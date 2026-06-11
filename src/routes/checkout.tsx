import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(5).max(500),
  phone: z.string().trim().min(5).max(30),
});

function Checkout() {
  const { user, loading } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

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
    setBusy(false);
    if (itemsError) { toast.error(itemsError.message); return; }
    clear();
    toast.success("Order placed!");
    navigate({ to: "/orders" });
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
          <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>Place Order</Button>
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