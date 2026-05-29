import { Link, useLocation } from "wouter";
import { LayoutDashboard, Store, ShoppingBag, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import logoUrl from "@assets/IMG_20260512_082228_1779882901880.jpg";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/products", label: "Products", icon: Package },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <img src={logoUrl} alt="Meat n Sea" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-tight">Meat n Sea</p>
            <p className="text-xs text-sidebar-foreground/50 leading-tight">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40">v1.0 — Development</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
