import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/orders")({
  component: Orders,
});

function Orders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">My Orders</h1>
      {!data?.length ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {data.map((o: any) => (
            <div key={o.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand-dark)] capitalize">{o.status}</span>
                  <p className="mt-1 font-semibold">{ksh(o.total)}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.order_items?.map((it: any) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span>{ksh(Number(it.unit_price) * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}