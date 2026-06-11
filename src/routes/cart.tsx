import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: Cart,
});

function Cart() {
  const { items, setQty, remove, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-6"><Link to="/products">Browse products</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-muted">
              {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{i.name}</h3>
              <p className="text-sm text-[var(--color-primary)]">${i.price.toFixed(2)}</p>
            </div>
            <Input
              type="number"
              min={1}
              value={i.quantity}
              onChange={(e) => setQty(i.id, parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Button variant="ghost" size="icon" onClick={() => remove(i.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-lg border bg-card p-4">
        <span className="text-lg font-semibold">Total: ${total.toFixed(2)}</span>
        <Button size="lg" onClick={() => navigate({ to: user ? "/checkout" : "/auth" })}>
          {user ? "Checkout" : "Sign in to Checkout"}
        </Button>
      </div>
    </div>
  );
}