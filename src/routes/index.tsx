import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Shield, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HerbWell — Natural Herbal Medicine Store" },
      { name: "description", content: "Discover handcrafted herbal remedies, teas and tinctures from trusted growers." },
      { property: "og:title", content: "HerbWell — Natural Herbal Medicine" },
      { property: "og:description", content: "Handcrafted herbal remedies and tinctures." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] text-[var(--color-brand-foreground)]">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold md:text-6xl">Nature's Medicine, Delivered.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
            Premium herbal remedies, organic teas and time-honored tinctures from trusted growers.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-3">
        {[
          { icon: Leaf, title: "100% Natural", text: "Sourced from organic farms worldwide." },
          { icon: Shield, title: "Lab Tested", text: "Every batch verified for purity." },
          { icon: Truck, title: "Fast Shipping", text: "Discreet delivery to your door." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-6 text-center">
            <f.icon className="mx-auto mb-3 h-10 w-10 text-[var(--color-brand)]" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">New Arrivals</h2>
          <Link to="/products" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            View all →
          </Link>
        </div>
        {!featured?.length ? (
          <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No products yet. Admins can add them from the Admin dashboard.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {featured.map((p) => (
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
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">${Number(p.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}