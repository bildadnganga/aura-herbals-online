import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ksh } from "@/lib/format";

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
            <Link
              key={p.id}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
            >
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
          ))}
        </div>
      )}
    </div>
  );
}