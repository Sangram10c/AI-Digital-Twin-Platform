# Organizations Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/organizations/`

---

## 1. Overview

The `OrganizationsModule` manages multi-tenant organizational hierarchies, shared subscription tiers, and group-level permission scopes encompassing multiple workspaces.

---

## 2. Structure

```text
src/modules/organizations/
├── organizations.controller.ts  # Organization endpoints
├── organizations.module.ts      # Module definition
├── organizations.service.ts     # Organization management logic
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Key Responsibilities

- Organization onboarding and domain verification.
- Mapping organizational membership to child workspace roles.
- Cross-workspace billing and quota aggregation.
