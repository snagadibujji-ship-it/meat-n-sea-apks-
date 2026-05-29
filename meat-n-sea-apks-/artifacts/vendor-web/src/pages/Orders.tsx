import { useState } from "react";
import {
  useGetMyVendor,
  useGetVendorOrders,
  useAdvanceOrderStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

const ALL_STATUSES = ["all", "placed", "accepted", "preparing", "ready", "picked_up", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, string> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
};

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Orders() {
  const [filter, setFilter] = useState<string>("all");
  const qc = useQueryClient();

  const { data: vendor } = useGetMyVendor();
  const vendorId = (vendor as { _id?: string })?._id ?? "";
  const { data: orders, isLoading } = useGetVendorOrders(
    { vendorId },
    { query: { enabled: !!vendorId } }
  );

  const advance = useAdvanceOrderStatus({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops/vendor-orders"] }),
    },
  });

  const orderList = (orders as unknown[]) ?? [];
  const filtered =
    filter === "all"
      ? orderList
      : orderList.filter((o) => (o as { status: string }).status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const order = o as {
              _id: string;
              status: string;
              totalAmount: number;
              createdAt: string;
              items?: Array<{ name?: string; quantity?: number; price?: number }>;
              deliveryAddress?: string;
            };
            const next = NEXT_STATUS[order.status];
            return (
              <div
                key={order._id}
                className="bg-card border border-card-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {fmt(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <ul className="space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {item.quantity}× {item.name}
                        </span>
                        {item.price != null && (
                          <span>{fmt(item.price * (item.quantity ?? 1))}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {order.deliveryAddress && (
                  <p className="text-xs text-muted-foreground">
                    Deliver to: {order.deliveryAddress}
                  </p>
                )}

                {next && (
                  <button
                    onClick={() =>
                      advance.mutate({ orderId: order._id, data: { newStatus: next } })
                    }
                    disabled={advance.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    Mark as {next.replace("_", " ")} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
