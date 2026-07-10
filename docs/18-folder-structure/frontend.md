# Frontend

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

```
frontend/src/
├── app/                       # Next.js App Router pages
│   ├── (auth)/                # Authentication route group
│   ├── (dashboard)/           # Dashboard route group
│   └── api/                   # API routes
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Layout components (Header, Sidebar, Footer)
│   ├── shared/                # Reusable components
│   └── providers/             # Context providers
├── features/                  # Feature-first modules
│   ├── auth/
│   ├── dashboard/
│   ├── workspaces/
│   ├── documents/
│   ├── ai/
│   ├── knowledge/
│   ├── analytics/
│   ├── settings/
│   └── admin/
├── hooks/                     # Custom React hooks
├── services/                  # API service layer
├── store/                     # Zustand state stores
├── lib/                       # Utilities (cn, validators)
├── config/                    # App configuration
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
├── constants/                 # Application constants
├── assets/                    # Static assets
└── styles/                    # Global styles
```

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
