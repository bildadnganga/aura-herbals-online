import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { initiateMpesaStkPush, getPaymentStatus } from "@/lib/mpesa.functions";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(5).max(500),
  phone: z.string().trim().regex(/^(\+?254|0)?[71]\d{8}$/, "Enter a valid Kenyan phone (e.g. 0712345678)"),
});

function Checkout() {
  const { user, loading } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [stkStatus, setStkStatus] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const startStk = useServerFn(initiateMpesaStkPush);
  const checkStatus = useServerFn(getPaymentStatus);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (!items.length) {
    return <div className="mx-auto max-w-md p-10 text-center">Your cart is empty.</div>;
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, address, phone });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    if (!user) return;
    setBusy(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        shipping_name: parsed.data.name,
        shipping_address: parsed.data.address,
        shipping_phone: parsed.data.phone,
      })
      .select()
      .single();
    if (error || !order) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to create order");
      return;
    }
    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
      })),
    );
    if (itemsError) { setBusy(false); toast.error(itemsError.message); return; }

    try {
      const res = await startStk({ data: { orderId: order.id, phone: parsed.data.phone, amount: total } });
      setStkStatus(res.message);
      toast.success("STK push sent — check your phone");

      // Poll for payment status
      let attempts = 0;
      pollRef.current = window.setInterval(async () => {
        attempts++;
        const { payment } = await checkStatus({ data: { orderId: order.id } });
        if (payment?.status === "success") {
          window.clearInterval(pollRef.current!);
          clear();
          toast.success(`Payment received! Receipt: ${payment.mpesa_receipt}`);
          navigate({ to: "/orders" });
        } else if (payment?.status === "failed") {
          window.clearInterval(pollRef.current!);
          setBusy(false);
          setStkStatus(null);
          toast.error(payment.result_desc ?? "Payment failed");
        } else if (attempts > 30) {
          window.clearInterval(pollRef.current!);
          setBusy(false);
          setStkStatus("Timed out waiting for payment confirmation. Check your M-Pesa messages.");
        }
      }, 3000);
    } catch (err: any) {
      setBusy(false);
      toast.error(err?.message ?? "M-Pesa payment failed to start");
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr]">
      <form onSubmit={placeOrder} className="space-y-4 rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-bold">Shipping Details</h1>
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="addr">Address</Label>
          <Textarea id="addr" required value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" required placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground">Safaricom M-Pesa number used for payment.</p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Processing payment…" : `Pay KES ${total.toFixed(0)} with M-Pesa`}
        </Button>
        {stkStatus && (
          <p className="rounded-md bg-[var(--color-brand)]/10 p-3 text-center text-sm text-[var(--color-brand-dark)]">
            {stkStatus}
          </p>
        )}
      </form>
      <div className="h-fit space-y-2 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>{i.name} × {i.quantity}</span>
            <span>${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}