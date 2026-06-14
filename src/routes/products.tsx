import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ksh } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop Herbal Medicine — HerbWell" },
      { name: "description", content: "Browse our full catalog of natural herbal remedies, teas and tinctures." },
      { property: "og:title", content: "Shop Herbal Medicine — HerbWell" },
      { property: "og:description", content: "Browse our full catalog of natural herbal remedies." },
    ],
  }),
  component: Products,
});

function Products() {
  const { add } = useCart();
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">All Herbal Medicines</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No products available yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
            >
              <Link to="/products/$slug" params={{ slug: p.slug }} className="block">
                <div className="aspect-square bg-muted">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </div>
                <div className="p-3">
                  {p.category && <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>}
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">{ksh(p.price)}</p>
                </div>
              </Link>
              <div className="mt-auto p-3 pt-0">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    add({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url });
                    toast.success(`${p.name} added to cart`);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}