import { useGetMyVendor, useGetVendorOrders, useToggleVendorStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Store, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { useVendorSocket } from "@/hooks/useVendorSocket";

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: vendor, isLoading: vendorLoading } = useGetMyVendor();
  const vendorId = (vendor as { _id?: string })?._id ?? "";
  useVendorSocket(vendorId || undefined);
  const { data: orders } = useGetVendorOrders({ vendorId }, { query: { enabled: !!vendorId } as never });

  const toggleStatus = useToggleVendorStatus({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops/my-vendor"] }),
    },
  });

  const orderList = (orders as unknown[]) ?? [];
  const activeOrders = orderList.filter(
    (o) => !["delivered", "cancelled"].includes((o as { status: string }).status)
  );
  const todayRevenue = orderList
    .filter((o) => {
      const d = new Date((o as { createdAt: string }).createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((s: number, o) => s + ((o as { totalAmount: number }).totalAmount ?? 0), 0);

  const isOpen = (vendor as { isOpen?: boolean })?.isOpen ?? false;

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen text-muted-foreground">
        No vendor profile found for this account.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {(vendor as { name?: string }).name ?? "My Store"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(vendor as { address?: string }).address ?? ""}
          </p>
        </div>

        <button
          onClick={() =>
            toggleStatus.mutate({ vendorId, data: { isOpen: !isOpen } })
          }
          disabled={toggleStatus.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isOpen
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Store className="w-4 h-4" />
          {isOpen ? "Open" : "Closed"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-primary" />}
          label="Active orders"
          value={String(activeOrders.length)}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-accent-foreground" />}
          label="Today's revenue"
          value={fmt(todayRevenue as number)}
          accent
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-muted-foreground" />}
          label="Total orders"
          value={String(orderList.length)}
        />
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Recent orders</h2>
        {activeOrders.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            No active orders right now.
          </div>
        ) : (
          <div className="space-y-2">
            {activeOrders.slice(0, 8).map((o) => {
              const order = o as {
                _id: string;
                status: string;
                totalAmount: number;
                createdAt: string;
                items?: Array<{ name?: string; quantity?: number }>;
              };
              return (
                <div
                  key={order._id}
                  className="bg-card border border-card-border rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(", ") ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {fmt(order.totalAmount)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(order.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-xl px-5 py-4 flex items-center gap-4 ${
        accent ? "border-accent/40 bg-accent/5" : "border-card-border"
      }`}
    >
      <div className={`p-2 rounded-lg ${accent ? "bg-accent/20" : "bg-muted"}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
