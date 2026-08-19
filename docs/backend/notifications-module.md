# Notifications Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/notifications/`

---

## 1. Overview

The `NotificationsModule` manages in-app notifications, user alert preferences, and real-time delivery via Socket.IO for background events (sync completion, embedding progress, AI extraction results).

---

## 2. Structure

```text
src/modules/notifications/
├── notifications.controller.ts  # Notification CRUD endpoints
├── notifications.module.ts      # Module definition
├── notifications.service.ts     # Notification delivery and persistence
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`Notification` (`notifications`)**:
  - `workspaceId`, `userId`: User and workspace scoping.
  - `type`: Enum (`INFO`, `SUCCESS`, `WARNING`, `ERROR`, `SYSTEM`).
  - `title`, `message`, `data`: Notification payload and metadata.
  - `isRead`, `readAt`: Read status tracking.
- **`NotificationPreference` (`notification_preferences`)**:
  - Channel toggles (`emailEnabled`, `pushEnabled`, `inAppEnabled`).
  - Per-type granular notification preferences stored as JSONB.

---

## 4. Real-time Delivery

Works in tandem with `EventsGateway` (WebSocket) and the BullMQ `notification` queue to deliver async alerts directly to connected user sessions.
