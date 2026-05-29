import { useGetMyRider, useGetRiderOrders, useUpdateMyRiderStatus, useAdvanceOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bike, MapPin, Clock, ChevronRight } from "lucide-react";
import { useRiderSocket } from "@/hooks/useRiderSocket";

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const NEXT_RIDER_STATUS: Record<string, string> = {
  ready: "picked_up",
  picked_up: "delivered",
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

export default function Main() {
  const qc = useQueryClient();
  const { data: rider, isLoading: riderLoading } = useGetMyRider();
  const riderId = (rider as { _id?: string })?._id ?? "";
  useRiderSocket(riderId || undefined);
  const { data: orders } = useGetRiderOrders();

  const updateStatus = useUpdateMyRiderStatus({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/riders/me"] }),
    },
  });

  const advanceOrder = useAdvanceOrderStatus({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/riders/orders"] }),
    },
  });

  const isOnline = (rider as { isOnline?: boolean })?.isOnline ?? false;

  const orderList = (orders as unknown[]) ?? [];
  const activeOrders = orderList.filter((o) => {
    const s = (o as { status: string }).status;
    return ["ready", "picked_up"].includes(s);
  });

  if (riderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        No rider profile found for this account.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-card border border-card-border rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Bike className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {(rider as { name?: string }).name ?? "Rider"}
            </p>
            <p className="text-sm text-muted-foreground">
              {(rider as { vehicleNumber?: string }).vehicleNumber ?? ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => updateStatus.mutate({ data: { isOnline: !isOnline } })}
          disabled={updateStatus.isPending}
          className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-60 ${
            isOnline
              ? "bg-green-600 text-white shadow-md shadow-green-200"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-white animate-pulse" : "bg-muted-foreground/50"
            }`}
          />
          {isOnline ? "Online" : "Offline"}
        </button>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Active deliveries</h2>

        {!isOnline ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            You're offline. Go online to receive orders.
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            No active deliveries. Waiting for new orders…
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((o) => {
              const order = o as {
                _id: string;
                status: string;
                totalAmount: number;
                createdAt: string;
                deliveryAddress?: string;
                items?: Array<{ name?: string; quantity?: number }>;
              };
              const next = NEXT_RIDER_STATUS[order.status];
              return (
                <div
                  key={order._id}
                  className="bg-card border border-card-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</p>
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

                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {order.deliveryAddress}
                    </div>
                  )}

                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                  )}

                  {next && (
                    <button
                      onClick={() =>
                        advanceOrder.mutate({ orderId: order._id, data: { newStatus: next } })
                      }
                      disabled={advanceOrder.isPending}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline disabled:opacity-50"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Today's deliveries</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {
              orderList.filter((o) => {
                const d = new Date((o as { createdAt: string }).createdAt);
                return d.toDateString() === new Date().toDateString();
              }).length
            }
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Bike className="w-4 h-4" />
            <span className="text-xs">Total delivered</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {
              orderList.filter(
                (o) => (o as { status: string }).status === "delivered"
              ).length
            }
          </p>
        </div>
      </div>
    </div>
  );
}
