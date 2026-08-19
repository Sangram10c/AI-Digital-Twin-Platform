# Uploads Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/uploads/`

---

## 1. Overview

The `UploadsModule` handles file uploads (user avatars, custom markdown documentation, architectural diagrams, repository exports) with validation, size constraints, and local/S3-compatible storage backend resolution.

---

## 2. Structure

```text
src/modules/uploads/
├── uploads.controller.ts    # File upload and download endpoints
├── uploads.module.ts        # Module configuration
├── uploads.service.ts       # Storage client and MIME validation
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Key Capabilities

- Secure multipart file upload handling via NestJS interceptors.
- MIME-type validation and payload size restrictions.
- Ingestion hand-off to `KnowledgeModule` when uploaded files are targeted as custom workspace documentation.
