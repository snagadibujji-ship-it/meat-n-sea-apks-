import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "./lib/logger";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join_vendor", (vendorId: string) => socket.join(`vendor_${vendorId}`));
    socket.on("join_order", (orderId: string) => socket.join(`order_${orderId}`));
    socket.on("join_rider", (riderId: string) => socket.join(`rider_${riderId}`));
    socket.on("join_admin", () => socket.join("admin"));

    socket.on("rider_location_update", ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) => {
      io.to(`order_${orderId}`).emit("rider_location_update", { lat, lng });
    });

    socket.on("disconnect", () => logger.info({ socketId: socket.id }, "Socket disconnected"));
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
