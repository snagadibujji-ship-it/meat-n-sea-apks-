---
name: Socket.io room join pattern for vendor/rider
description: Client-side join pattern for vendor and rider rooms after socket connection.
---

Clients call `socket.emit("join_vendor", vendorId)` or `socket.emit("join_rider", riderId)` immediately on `connect`. The server must listen for these events and call `socket.join(...)`.

**Why:** Without explicit join, `getIO().to("vendor_xxx").emit(...)` targets an empty room and no one receives the event.

**How to apply:** In `socket.ts`, add:
```ts
socket.on("join_vendor", (vendorId: string) => socket.join(`vendor_${vendorId}`));
socket.on("join_rider",  (riderId: string)  => socket.join(`rider_${riderId}`));
```
The client hooks (`useVendorSocket`, `useRiderSocket`) already emit these join events on connect.
