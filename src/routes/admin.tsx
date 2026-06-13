import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ksh } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  featured: boolean;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  active: boolean;
  sort_order: number;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadProductImage(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
  if (error) throw error;
  // Long-lived signed URL (10 years) — works on private buckets
  const { data: signed, error: signErr } = await supabase
    .storage.from("product-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !signed) throw signErr ?? new Error("Failed to sign URL");
  return signed.signedUrl;
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth" });
      else if (!isAdmin) navigate({ to: "/" });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !isAdmin) return <div className="p-10 text-center">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><ProductsAdmin /></TabsContent>
        <TabsContent value="banners"><BannersAdmin /></TabsContent>
        <TabsContent value="orders"><OrdersAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["featured-products"] });
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Add Medicine</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit Medicine" : "Add Medicine"}</DialogTitle></DialogHeader>
            <ProductForm
              initial={editing}
              onDone={() => {
                setOpen(false); setEditing(null);
                qc.invalidateQueries({ queryKey: ["admin-products"] });
                qc.invalidateQueries({ queryKey: ["products"] });
                qc.invalidateQueries({ queryKey: ["featured-products"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                    {p.name}
                  </div>
                </td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 text-right">{ksh(p.price)}</td>
                <td className="p-3 text-right">{p.stock}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ initial, onDone }: { initial: Product | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) { toast.error("Name and price required"); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: slugify(name),
      description: description.trim() || null,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category: category.trim() || null,
      image_url: imageUrl || null,
      featured,
    };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Added"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tincture, Tea, Capsule..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price (KSh)</Label><Input type="number" step="1" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
        <div><Label>Stock</Label><Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
      </div>
      <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
      <div>
        <Label>Image</Label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
        {imageUrl && <img src={imageUrl} alt="" className="mt-2 h-24 w-24 rounded object-cover" />}
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label className="cursor-pointer">Featured (Special Offer)</Label>
          <p className="text-xs text-muted-foreground">Show with a featured badge on the home page.</p>
        </div>
        <Switch checked={featured} onCheckedChange={setFeatured} />
      </div>
      <Button type="submit" className="w-full" disabled={saving || uploading}>
        {saving ? "Saving…" : initial ? "Update Medicine" : "Add Medicine"}
      </Button>
    </form>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  return (
    <div className="mt-4 space-y-3">
      {!data?.length ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">No orders yet.</p>
      ) : data.map((o) => (
        <div key={o.id} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
              <p className="mt-1 text-sm">{o.shipping_name} — {o.shipping_phone}</p>
              <p className="text-sm text-muted-foreground">{o.shipping_address}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{ksh(o.total)}</p>
              <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                <SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
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
  );
}