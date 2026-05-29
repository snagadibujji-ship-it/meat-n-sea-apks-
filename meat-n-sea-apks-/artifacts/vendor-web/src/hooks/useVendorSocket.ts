import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NewOrderPayload {
  orderId: string;
  totalAmount: number;
  items?: Array<{ name?: string; quantity?: number }>;
}

interface StatusUpdatePayload {
  orderId: string;
  newStatus: string;
}

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function useVendorSocket(vendorId: string | undefined) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_vendor", vendorId);
    });

    socket.on("new_order", (payload: NewOrderPayload) => {
      const itemSummary = payload.items
        ?.slice(0, 2)
        .map((i) => `${i.quantity}× ${i.name}`)
        .join(", ");

      toast("New order received!", {
        description: itemSummary
          ? `${itemSummary} — ${fmt(payload.totalAmount)}`
          : fmt(payload.totalAmount),
        duration: 8000,
        action: {
          label: "View orders",
          onClick: () => (window.location.hash = "#/orders"),
        },
      });

      void qc.invalidateQueries({ queryKey: ["/api/ops/vendor-orders"] });
    });

    socket.on("order_status_updated", (_payload: StatusUpdatePayload) => {
      void qc.invalidateQueries({ queryKey: ["/api/ops/vendor-orders"] });
    });

    socket.on("connect_error", () => {
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [vendorId, qc]);
}
