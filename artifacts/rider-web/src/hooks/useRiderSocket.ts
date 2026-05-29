import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface OrderAssignedPayload {
  orderId: string;
  vendorId: string;
}

interface StatusUpdatePayload {
  orderId: string;
  newStatus: string;
}

export function useRiderSocket(riderId: string | undefined) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!riderId) return;

    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_rider", riderId);
    });

    socket.on("order_assigned", (_payload: OrderAssignedPayload) => {
      toast("New delivery assigned!", {
        description: "A new order is ready for pickup.",
        duration: 10000,
      });

      void qc.invalidateQueries({ queryKey: ["/api/riders/orders"] });
    });

    socket.on("order_status_updated", (_payload: StatusUpdatePayload) => {
      void qc.invalidateQueries({ queryKey: ["/api/riders/orders"] });
    });

    socket.on("connect_error", () => {
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [riderId, qc]);
}
