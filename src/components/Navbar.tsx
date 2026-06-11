import { Link } from "@tanstack/react-router";
import { ShoppingCart, Leaf, LogOut, User as UserIcon, Shield } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-brand)] text-[var(--color-brand-foreground)] shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Leaf className="h-6 w-6" />
          <span>HerbWell</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <Link to="/" className="hover:opacity-80">Home</Link>
          <Link to="/products" className="hover:opacity-80">Shop</Link>
          {user && <Link to="/orders" className="hover:opacity-80">My Orders</Link>}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 hover:opacity-80">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-xs font-bold text-[var(--color-primary-foreground)]">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="text-[var(--color-brand-foreground)] hover:bg-white/10 hover:text-[var(--color-brand-foreground)]">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth"><UserIcon className="h-4 w-4" /> Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}