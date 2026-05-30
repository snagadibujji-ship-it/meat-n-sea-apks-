import { useGetMyVendor, useGetProducts, useToggleProductStock } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, ToggleLeft, ToggleRight } from "lucide-react";

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function Products() {
  const qc = useQueryClient();
  const { data: vendor } = useGetMyVendor();
  const vendorId = (vendor as { _id?: string })?._id ?? "";

  const { data: products, isLoading } = useGetProducts(
    { vendorId },
    { query: { enabled: !!vendorId } as never }
  );

  const toggleStock = useToggleProductStock({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops/products"] }),
    },
  });

  const productList = (products as unknown[]) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">{productList.length} items</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : productList.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center space-y-3">
          <Package className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No products found for your store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productList.map((p) => {
            const product = p as {
              _id: string;
              name: string;
              price: number;
              inStock: boolean;
              category?: string;
              imageUrl?: string;
              description?: string;
            };
            return (
              <div
                key={product._id}
                className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight truncate">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {product.category}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground shrink-0">
                      {fmt(product.price)}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto pt-2 border-t border-border flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        product.inStock ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {product.inStock ? "In stock" : "Out of stock"}
                    </span>
                    <button
                      onClick={() => toggleStock.mutate({ productId: product._id })}
                      disabled={toggleStock.isPending}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {product.inStock ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                      Toggle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
