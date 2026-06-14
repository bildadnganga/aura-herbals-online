import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Shield, Truck, ShoppingCart } from "lucide-react";
import heroImg from "@/assets/arthritis-pack.jpeg.asset.json";
import { ksh } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

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
  const { add } = useCart();
  const { data: products } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Array<{ id: string; slug: string; name: string; price: number; image_url: string | null; featured: boolean; category: string | null }>;
    },
  });

  const { data: banners } = useQuery({
    queryKey: ["banners-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; title: string; subtitle: string | null; image_url: string; link_url: string | null }>;
    },
  });

  return (
    <div>
      <section
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(rgba(0,40,20,0.65), rgba(0,40,20,0.75)), url(${heroImg.url})` }}
      >
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold drop-shadow-lg md:text-6xl">Nature's Medicine, Delivered.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-95 drop-shadow">
            Premium herbal remedies, organic teas and time-honored tinctures from trusted growers.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </section>

      {!!banners?.length && (
        <section className="mx-auto max-w-7xl px-4 pt-10">
          <h2 className="mb-4 text-2xl font-bold">Special Offers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => {
              const card = (
                <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-lg">
                  <img src={b.image_url} alt={b.title} className="h-48 w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="text-lg font-bold">{b.title}</h3>
                    {b.subtitle && <p className="text-sm opacity-90">{b.subtitle}</p>}
                  </div>
                </div>
              );
              return b.link_url ? (
                <a key={b.id} href={b.link_url}>{card}</a>
              ) : (
                <div key={b.id}>{card}</div>
              );
            })}
          </div>
        </section>
      )}

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
          <h2 className="text-2xl font-bold">Our Products</h2>
          <Link to="/products" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            View all →
          </Link>
        </div>
        {!products?.length ? (
          <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No products yet. Admins can add them from the Admin dashboard.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
              >
                {p.featured && (
                  <span className="absolute right-2 top-2 z-10 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary-foreground)] shadow">
                    Featured
                  </span>
                )}
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
      </section>
    </div>
  );
}