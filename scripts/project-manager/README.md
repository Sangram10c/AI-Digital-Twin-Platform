# Project Progress Manager (PPM)

> Production-grade CLI utility for managing the progress lifecycle of the **AI Engineering Intelligence Platform**.

---

## Overview

PPM automatically manages `CURRENT_STATUS.md`, calculates progress, tracks milestones, validates the project structure, and generates reports — all from the terminal.

Instead of manually editing `CURRENT_STATUS.md`, developers use CLI commands to advance through the documentation workflow.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   CLI Layer                      │
│           index.ts (Commander.js)                │
│    ┌──────┬──────┬──────┬──────┬──────┐         │
│    │status│update│ next │compl.│valid.│ ...      │
│    └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┘         │
├───────┼──────┼──────┼──────┼──────┼─────────────┤
│       ▼      ▼      ▼      ▼      ▼             │
│               Service Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Status   │ │   Doc    │ │ Progress │         │
│  │  Parser   │ │ Scanner  │ │  Calc    │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Task   │ │Milestone │ │ Decision │         │
│  │ Detector │ │ Tracker  │ │ Tracker  │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Git    │ │Validator │ │  Report  │         │
│  │ Service  │ │ Service  │ │Generator │         │
│  └──────────┘ └──────────┘ └──────────┘         │
├─────────────────────────────────────────────────┤
│              Utility Layer                       │
│  markdown-parser │ file-utils │ format-utils     │
│  logger                                          │
├─────────────────────────────────────────────────┤
│         Constants / Types / Templates            │
└─────────────────────────────────────────────────┘
```

### Design Principles

- **Command Pattern** — each CLI command is a standalone module that orchestrates services
- **Service Layer** — business logic is encapsulated in reusable services
- **Utility Layer** — low-level file I/O, markdown parsing, and terminal formatting
- **Strong Typing** — zero `any`, zero `ts-ignore`, full TypeScript strict mode
- **SOLID** — single responsibility per module, open for extension

---

## Folder Structure

```
scripts/project-manager/
├── index.ts                              # CLI entry point (Commander.js)
├── package.json                          # Local dependencies
├── tsconfig.json                         # TypeScript strict config
├── README.md                             # This file
├── commands/
│   ├── status.command.ts                 # Dashboard display
│   ├── update.command.ts                 # Update CURRENT_STATUS.md
│   ├── next.command.ts                   # Move to next document
│   ├── complete.command.ts               # Complete current document
│   ├── validate.command.ts               # Project validation
│   ├── report.command.ts                 # Generate PROJECT_REPORT.md
│   ├── timeline.command.ts               # Visual timeline
│   └── help.command.ts                   # Help display
├── services/
│   ├── status-parser.service.ts          # Parse/update CURRENT_STATUS.md
│   ├── doc-scanner.service.ts            # Scan docs/ directory
│   ├── progress-calculator.service.ts    # Calculate phase progress
│   ├── task-detector.service.ts          # Detect current/next task
│   ├── milestone-tracker.service.ts      # Track milestones
│   ├── decision-tracker.service.ts       # Track decisions
│   ├── git.service.ts                    # Git integration
│   ├── validator.service.ts              # Project validation
│   └── report-generator.service.ts       # Report generation
├── utils/
│   ├── markdown-parser.ts                # Markdown table/section parsing
│   ├── file-utils.ts                     # Safe file I/O
│   ├── format-utils.ts                   # Terminal formatting
│   └── logger.ts                         # Colored logging
├── constants/
│   └── index.ts                          # Paths, registry, config
├── types/
│   └── index.ts                          # TypeScript interfaces
└── templates/
    ├── report.template.ts                # PROJECT_REPORT.md template
    └── status.template.ts                # Dashboard layout
```

---

## Commands

| Command    | npm Script                 | Description                                                         |
| ---------- | -------------------------- | ------------------------------------------------------------------- |
| `status`   | `npm run project:status`   | Show the project dashboard with progress bars, git info, milestones |
| `update`   | `npm run project:update`   | Scan docs, recalculate progress, update CURRENT_STATUS.md           |
| `next`     | `npm run project:next`     | Move focus to the next document                                     |
| `complete` | `npm run project:complete` | Mark current document as ✅ Completed and advance                   |
| `validate` | `npm run project:validate` | Check for missing docs, broken structure, missing configs           |
| `report`   | `npm run project:report`   | Generate a comprehensive PROJECT_REPORT.md                          |
| `timeline` | `npm run project:timeline` | Show visual timeline grouped by phase                               |
| `help`     | `npm run project:help`     | Display all available commands                                      |

---

## Examples

### View project status

```bash
npm run project:status
```

### Complete a document and move on

```bash
npm run project:complete
```

### Generate a full project report

```bash
npm run project:report
```

### Validate project structure

```bash
npm run project:validate
```

---

## Services

| Service                     | Responsibility                                          |
| --------------------------- | ------------------------------------------------------- |
| `StatusParserService`       | Parse and update CURRENT_STATUS.md sections and tables  |
| `DocScannerService`         | Scan `docs/` directory tree for numbered markdown files |
| `ProgressCalculatorService` | Calculate per-phase and overall progress percentages    |
| `TaskDetectorService`       | Detect current/next document and support advancement    |
| `MilestoneTrackerService`   | Track completed/current/next milestones                 |
| `DecisionTrackerService`    | Track approved and pending architecture decisions       |
| `GitService`                | Git integration (branch, commits, modified files)       |
| `ValidatorService`          | Validate project structure and configuration            |
| `ReportGeneratorService`    | Generate PROJECT_REPORT.md from aggregated data         |

---

## Dependencies

| Package       | Purpose                          |
| ------------- | -------------------------------- |
| `commander`   | CLI framework                    |
| `chalk`       | Terminal colors                  |
| `ora`         | Spinner animations               |
| `cli-table3`  | Terminal tables                  |
| `fs-extra`    | Enhanced file operations         |
| `glob`        | File pattern matching            |
| `gray-matter` | Markdown frontmatter parsing     |
| `simple-git`  | Git integration                  |
| `inquirer`    | Interactive prompts (future use) |
| `tsx`         | TypeScript execution (dev)       |

---

## Setup

```bash
cd scripts/project-manager
npm install
```

The root `package.json` includes all `project:*` scripts, so commands work from the project root.

---

## Husky Integration

The pre-commit hook automatically runs:

1. `project:validate --silent` — ensures project structure is valid
2. `project:update --silent` — refreshes CURRENT_STATUS.md
3. `lint-staged` — standard linting

---

## Future Extensions

The modular architecture supports adding:

- Database migration tracking (new service + command)
- Sprint tracking (new service + command)
- CI/CD integration (extend git service)
- Feature completion tracking (new service)
- Release tracking (new service + command)
- Issue tracking (new service + command)

Each extension follows the same pattern: create a service, create a command, register in `index.ts`.
