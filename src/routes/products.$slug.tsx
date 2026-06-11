import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$slug")({
  component: Product,
});

function Product() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="mx-auto max-w-5xl p-10">Loading…</div>;
  if (!data) return <div className="mx-auto max-w-5xl p-10">Product not found. <Link to="/products" className="text-[var(--color-primary)] underline">Back to shop</Link></div>;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        {data.image_url && <img src={data.image_url} alt={data.name} className="h-full w-full object-cover" />}
      </div>
      <div>
        {data.category && <p className="text-sm uppercase tracking-wide text-muted-foreground">{data.category}</p>}
        <h1 className="mt-1 text-3xl font-bold">{data.name}</h1>
        <p className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">${Number(data.price).toFixed(2)}</p>
        <p className="mt-4 text-sm text-muted-foreground">{data.stock > 0 ? `${data.stock} in stock` : "Out of stock"}</p>
        <p className="mt-6 whitespace-pre-wrap text-base">{data.description}</p>
        <Button
          size="lg"
          className="mt-8"
          disabled={data.stock <= 0}
          onClick={() => {
            add({ id: data.id, name: data.name, price: Number(data.price), image_url: data.image_url });
            toast.success(`${data.name} added to cart`);
          }}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}