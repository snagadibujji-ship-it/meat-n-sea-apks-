import { useState } from "react";
import { useGetAllOrders } from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, AlertCircle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "picked_up", label: "Picked Up" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  ready: "bg-purple-100 text-purple-800 border-purple-200",
  picked_up: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function OrderRow({ order }: { order: Order }) {
  const statusClass = STATUS_COLORS[order.currentStatus] ?? "bg-muted text-muted-foreground border-border";
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "—";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <ShoppingBag className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">#{order._id.slice(-8)}</p>
        <p className="text-xs text-muted-foreground">
          {order.paymentMethod?.toUpperCase()} · {createdAt}
        </p>
        {order.customerNote && (
          <p className="text-xs text-muted-foreground italic mt-0.5">"{order.customerNote}"</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{formatPaise(order.totalAmountPaise)}</p>
        <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full border font-medium ${statusClass}`}>
          {order.currentStatus?.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

export default function Orders() {
  const [status, setStatus] = useState("all");
  const { data: orders, isLoading, error } = useGetAllOrders({
    status: status === "all" ? undefined : status,
    limit: "50",
  });

  return (
    <div className="p-8">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monitor all orders</p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load orders. The database may still be connecting.
        </div>
      )}

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
                  </div>
                  <div className="h-5 bg-muted rounded animate-pulse w-20" />
                </div>
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="px-5">
              {orders?.map((order) => (
                <OrderRow key={order._id} order={order} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {orders && orders.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground text-right">
          Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
