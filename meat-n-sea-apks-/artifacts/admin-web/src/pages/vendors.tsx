import { useState } from "react";
import { useGetAllVendors, useToggleVendorStatus } from "@workspace/api-client-react";
import type { Vendor } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Store, Search, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function VendorCard({ vendor }: { vendor: Vendor }) {
  const { toast } = useToast();
  const toggleMutation = useToggleVendorStatus();
  const [optimisticOpen, setOptimisticOpen] = useState(vendor.isOpen);

  const handleToggle = async (val: boolean) => {
    setOptimisticOpen(val);
    try {
      await toggleMutation.mutateAsync({ vendorId: vendor._id, data: { isOpen: val } });
      toast({ title: `${vendor.name} is now ${val ? "open" : "closed"}` });
    } catch {
      setOptimisticOpen(!val);
      toast({ title: "Failed to update vendor status", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{vendor.name}</p>
              <Badge variant={vendor.status === "approved" ? "default" : "secondary"} className="text-xs shrink-0">
                {vendor.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{vendor.phone}</p>
            {vendor.fssaiNumber && (
              <p className="text-xs text-muted-foreground">FSSAI: {vendor.fssaiNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">Radius: {vendor.serviceRadiusKm} km</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {optimisticOpen ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={`text-xs font-medium ${optimisticOpen ? "text-green-600" : "text-muted-foreground"}`}>
                {optimisticOpen ? "Open" : "Closed"}
              </span>
            </div>
            <Switch
              checked={optimisticOpen}
              onCheckedChange={handleToggle}
              disabled={toggleMutation.isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Vendors() {
  const { data: vendors, isLoading, error } = useGetAllVendors();
  const [search, setSearch] = useState("");

  const filtered = vendors?.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search)
  );

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage vendor availability
        </p>
      </div>

      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load vendors. The database may still be connecting.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
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
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No vendors found</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered?.map((vendor) => (
              <VendorCard key={vendor._id} vendor={vendor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
