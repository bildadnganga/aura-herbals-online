import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MPESA_BASE = "https://sandbox.safaricom.co.ke";

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

async function getAccessToken(key: string, secret: string) {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

const inputSchema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().min(7).max(20),
  amount: z.number().positive().max(150000),
});

export const initiateMpesaStkPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the order belongs to this user
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, total")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.user_id !== userId) throw new Error("Forbidden");

    const key = process.env.MPESA_CONSUMER_KEY!;
    const secret = process.env.MPESA_CONSUMER_SECRET!;
    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    if (!key || !secret || !shortcode || !passkey) {
      throw new Error("M-Pesa credentials not configured");
    }

    const ts = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
    const phone = normalizePhone(data.phone);
    const amount = Math.max(1, Math.round(data.amount));
    const callbackURL = "https://aura-herbals-online.lovable.app/api/public/mpesa-callback";

    const token = await getAccessToken(key, secret);
    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackURL,
        AccountReference: `HerbWell-${data.orderId.slice(0, 8)}`,
        TransactionDesc: "HerbWell order payment",
      }),
    });
    const stkJson = (await stkRes.json()) as {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      errorMessage?: string;
    };

    if (!stkRes.ok || stkJson.ResponseCode !== "0") {
      const msg = stkJson.errorMessage || stkJson.ResponseDescription || "STK push failed";
      throw new Error(msg);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("mpesa_payments").insert({
      order_id: data.orderId,
      user_id: userId,
      phone,
      amount,
      checkout_request_id: stkJson.CheckoutRequestID,
      merchant_request_id: stkJson.MerchantRequestID,
      status: "pending",
    });

    return {
      checkoutRequestId: stkJson.CheckoutRequestID,
      message: "Check your phone and enter your M-Pesa PIN to complete payment.",
    };
  });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: payment } = await context.supabase
      .from("mpesa_payments")
      .select("status, mpesa_receipt, result_desc")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { payment: payment ?? null };
  });