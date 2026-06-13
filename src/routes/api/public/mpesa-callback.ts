import { createFileRoute } from "@tanstack/react-router";

type CallbackItem = { Name: string; Value?: string | number };

export const Route = createFileRoute("/api/public/mpesa-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const stk = payload?.Body?.stkCallback;
        if (!stk) return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });

        const checkoutRequestId: string | undefined = stk.CheckoutRequestID;
        const resultCode: number = stk.ResultCode;
        const resultDesc: string = stk.ResultDesc;

        const items: CallbackItem[] = stk?.CallbackMetadata?.Item ?? [];
        const get = (name: string) => items.find((i) => i.Name === name)?.Value;
        const receipt = get("MpesaReceiptNumber") as string | undefined;

        const status = resultCode === 0 ? "success" : "failed";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: payment } = await supabaseAdmin
          .from("mpesa_payments")
          .update({
            status,
            result_code: resultCode,
            result_desc: resultDesc,
            mpesa_receipt: receipt ?? null,
            raw_callback: payload,
          })
          .eq("checkout_request_id", checkoutRequestId ?? "")
          .select("order_id")
          .maybeSingle();

        if (payment?.order_id && status === "success") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("id", payment.order_id);
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});