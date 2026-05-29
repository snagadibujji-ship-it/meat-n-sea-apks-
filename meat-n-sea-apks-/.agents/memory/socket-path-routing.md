---
name: Socket.io path routing in Replit proxy
description: Socket.io requires its own path entry in artifact.toml or connections are blocked by the shared proxy.
---

The Replit shared proxy routes traffic by path prefix based on `artifact.toml` `paths = [...]`. Socket.io uses `/socket.io` for both HTTP long-polling and WebSocket upgrade handshakes. If `/socket.io` is missing from the API server's paths list, all socket connections fail with 404s even though the server is running.

**Why:** The proxy only forwards paths it knows about. `/api` alone is not enough.

**How to apply:** Whenever adding Socket.io to an API server artifact, ensure `artifact.toml` has:
```toml
paths = ["/api", "/socket.io"]
```
Direct edits to artifact.toml are blocked — write a sibling temp file (`.replit-artifact/artifact.edit.toml`) then call `verifyAndReplaceArtifactToml`.
