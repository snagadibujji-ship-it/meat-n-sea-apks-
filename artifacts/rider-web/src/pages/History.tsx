import { useGetRiderOrders } from "@workspace/api-client-react";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  picked_up: "bg-indigo-100 text-indigo-800",
};

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const { data: orders, isLoading } = useGetRiderOrders();

  const orderList = (orders as unknown[]) ?? [];
  const completed = orderList.filter((o) =>
    ["delivered", "cancelled"].includes((o as { status: string }).status)
  );

  const totalEarned = orderList
    .filter((o) => (o as { status: string }).status === "delivered")
    .reduce((s: number, o) => s + ((o as { totalAmount: number }).totalAmount ?? 0), 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {completed.filter((o) => (o as { status: string }).status === "delivered").length}
          </p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4 text-accent-foreground" />
            <span className="text-xs">Total earned</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(totalEarned as number)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          No completed deliveries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map((o) => {
            const order = o as {
              _id: string;
              status: string;
              totalAmount: number;
              createdAt: string;
              deliveryAddress?: string;
              items?: Array<{ name?: string; quantity?: number }>;
            };
            return (
              <div
                key={order._id}
                className="bg-card border border-card-border rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === "delivered" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {order.status}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
