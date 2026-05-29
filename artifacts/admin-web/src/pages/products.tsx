import { useState } from "react";
import { useGetProducts, useToggleProductStock } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Package, Search, AlertCircle, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const toggleMutation = useToggleProductStock();
  const [optimisticInStock, setOptimisticInStock] = useState(!product.isOutOfStock);

  const handleToggle = async (inStock: boolean) => {
    setOptimisticInStock(inStock);
    try {
      await toggleMutation.mutateAsync({
        productId: product._id,
        data: { stockQuantity: inStock ? 10 : 0 },
      });
      toast({ title: `${product.name} marked as ${inStock ? "in stock" : "out of stock"}` });
    } catch {
      setOptimisticInStock(!inStock);
      toast({ title: "Failed to update stock", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover shrink-0 bg-muted"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ImageOff className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                {product.category && (
                  <Badge variant="secondary" className="text-xs mt-0.5">{product.category}</Badge>
                )}
              </div>
              <p className="text-sm font-bold text-primary shrink-0">{formatPaise(product.pricePaise)}</p>
            </div>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-medium ${optimisticInStock ? "text-green-600" : "text-destructive"}`}>
                {optimisticInStock ? `In Stock (${product.stockQuantity})` : "Out of Stock"}
              </span>
              <Switch
                checked={optimisticInStock}
                onCheckedChange={handleToggle}
                disabled={toggleMutation.isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Products() {
  const { data: products, isLoading, error } = useGetProducts({});
  const [search, setSearch] = useState("");

  const filtered = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage product stock levels</p>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load products. The database may still be connecting.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-28" />
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filtered?.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
