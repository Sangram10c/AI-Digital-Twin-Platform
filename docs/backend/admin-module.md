# Admin Module

> **Status:** 🟡 Scaffolded (Enterprise administration scheduled for Phase 15)  
> **Source Directory:** `apps/backend/src/modules/admin/`

---

## 1. Overview

The `AdminModule` provides administrative endpoints and management scaffolding for platform administrators. In current development, it acts as a structured boundary for administrative operations, user role elevation, and system audit views.

---

## 2. Structure

```text
src/modules/admin/
├── admin.controller.ts     # Admin REST controller
├── admin.module.ts         # Module definition
├── admin.service.ts        # Admin business logic
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Key Components

- **`AdminController`**: Exposes `/admin` prefix endpoints guarded by administrative role guards.
- **`AdminService`**: Coordinates system-level health, administrative metrics, and maintenance operations.

---

## 4. Planned Capabilities (Phase 15)

- Platform-wide user management and account deactivation
- Workspace quota management and override controls
- Centralized audit log inspection
- Background job queue monitoring and manual re-triggering
- Global AI provider usage and cost monitoring dashboard
