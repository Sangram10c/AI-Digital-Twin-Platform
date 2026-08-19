# Knowledge Heuristics Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/knowledge-heuristics/`

---

## 1. Overview

The `KnowledgeHeuristicsModule` extracts deterministic repository metadata, tech stack components, file structures, and risk signals directly from source code and package manifests without making costly LLM calls.

---

## 2. Structure

```text
src/modules/knowledge-heuristics/
├── knowledge-heuristics.controller.ts  # Extraction inspection endpoints
├── knowledge-heuristics.module.ts      # Module definition
├── knowledge-heuristics.service.ts     # Heuristic analysis engine
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`HeuristicMetadata` (`heuristic_metadata`)**:
  - `languages`, `frameworks`, `libraries`, `dependencies`, `databases`, `cloudProviders`, `cicd`, `modules`
  - `featureCount`, `bugFixCount`, `refactorCount`, `securityCount`, `performanceCount`
  - `riskScore`, `confidenceScore`
  - `folderStructure`, `relationships`, `rawSignals`, `contentChecksum`

---

## 4. Pipeline Integration

Runs as the first phase of the repository synchronization pipeline. Extracted signals provide deterministic context to the subsequent AI digest builders, drastically reducing token usage.
