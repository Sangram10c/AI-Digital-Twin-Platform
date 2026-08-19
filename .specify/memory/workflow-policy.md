workflow-policy
AI Digital Twin Platform — Spec Kit Configuration

Spec Kit Workflow Policy

Purpose

This document defines how the AI Digital Twin Platform uses Spec Kit for feature
development.

The goal is to use enough planning and validation to reduce errors and rework,
without creating unnecessary process overhead for small tasks.

The workflow must be selected based on the size, risk, and architectural impact
of the requested change.

1. Workflow Levels

The project uses three workflow levels:

SMALL
MEDIUM
LARGE

The agent must classify a feature before implementation unless the task is
obviously a trivial isolated change.

2. SMALL TASK

Definition

A small task is an isolated change with minimal architectural impact.

Typical characteristics:

0–2 impact areas
No significant database change
No architecture change
No security redesign
No cross-domain behavior
Existing services can be reused directly

Examples

Fix a validation bug
Fix a typo
Correct a response field
Fix logging
Add a missing unit test
Correct a small configuration issue
Fix a small citation metadata mapping
Small isolated refactor

Workflow

Inspect
↓
Implement
↓
Test
↓
Verify

Do not create Spec Kit specification documents for trivial work unless the
scope becomes unclear during implementation.

3. MEDIUM FEATURE

Definition

A medium feature affects several existing components but can be implemented
without major architectural redesign.

Typical characteristics:

3–5 impact areas
Multiple modules may be affected
API changes may be required
Moderate database or infrastructure impact
Existing architecture can be extended
Security impact is limited and understood

Examples

Conversation search
Conversation export
Repository statistics endpoint
New notification capability
Moderate AI usage dashboard
New repository filtering capability
New search filter
New API capability using existing models

Workflow

Specify
↓
Plan
↓
Tasks
↓
Implement
↓
Converge

Use Clarify only when requirements are genuinely ambiguous or when clarification
would materially affect architecture, data, security, API behavior, or scope.

Use Checklist and Analyze when the feature has elevated risk or uncertainty.

4. LARGE / CRITICAL FEATURE

Definition

A large feature has significant architectural, security, database,
infrastructure, AI/RAG, or cross-domain impact.

Typical characteristics:

6+ impact areas
Major database changes
Significant API changes
Security or authorization architecture
Cross-domain behavior
Major AI/RAG changes
New provider architecture
Infrastructure changes
Migration or backward compatibility concerns
Significant performance or scalability concerns

Examples

Authentication redesign
Multi-tenant architecture redesign
Major PostgreSQL schema redesign
Multi-repository RAG reasoning
Major RAG architecture change
New AI provider architecture
New security model
Major background processing architecture
Breaking API migration
Major production infrastructure change

Workflow

Specify
↓
Clarify
↓
Plan
↓
Checklist
↓
Tasks
↓
Analyze
↓
Implement
↓
Converge

5. IMPACT SCORING

Add one point for each applicable impact area.

Architectural Impact

Multiple modules affected
Shared infrastructure affected
New module boundary required
Existing architecture must change

Database Impact

Prisma model change
New relation
New index strategy
Migration required
Data migration required

API Impact

New API
Existing API contract change
Breaking API behavior
New authentication/authorization requirement

Security Impact

Authentication architecture change
Authorization architecture change
Workspace isolation change
Repository isolation change
Security boundary change
Sensitive data access rule change

Infrastructure Impact

Redis changes
BullMQ changes
Docker changes
Deployment changes
External infrastructure changes

AI / RAG Impact

LLM behavior change
Embedding behavior change
Retrieval behavior change
Prompt architecture change
Provider architecture change
Citation behavior change

User / Product Impact

Major new user-facing capability
Major workflow change
Backward compatibility concern

6. CLASSIFICATION

Use the following score:

0–2 = SMALL
3–5 = MEDIUM
6+ = LARGE

The reported score MUST equal the sum of the explicitly listed impact factors.

Before reporting classification:

List each triggered factor.
Assign +1 to each factor.
Sum the factors.
Verify the total.
Report the verified total.

Never report a different score from the detailed breakdown.

7. SECURITY ESCALATION RULE

Escalate a task when it changes or introduces:

Authentication architecture
Authorization architecture
Permission model
Workspace isolation model
Repository isolation model
Security boundaries
Sensitive-data access rules

Do NOT automatically escalate a task merely because it correctly uses an
existing authentication or authorization mechanism.

Examples:

Adding an endpoint using the existing JWT guard does not automatically escalate.
Creating a new permission model escalates.
Changing workspace isolation escalates.
Changing repository isolation escalates.

8. DATABASE ESCALATION RULE

Any feature involving a major schema redesign, destructive migration, or data
migration should use at least the MEDIUM workflow.

Use the LARGE workflow when the database change affects multiple domains,
tenancy, security, or backward compatibility.

9. AI / RAG ESCALATION RULE

Any change that affects core AI architecture should normally use the LARGE workflow.

Examples:

Changing retrieval architecture
Changing embedding strategy
Changing vector schema
Changing provider architecture
Changing RAG context construction
Changing citation architecture

Small prompt wording changes do not automatically require the LARGE workflow.

10. EXISTING ARCHITECTURE RULE

Before classifying or implementing a feature:

Inspect the existing codebase.
Identify existing related modules.
Identify existing services.
Identify existing database models.
Identify existing APIs.
Identify existing tests.
Identify existing infrastructure.
Determine whether the feature extends existing behavior or requires new architecture.

Do not classify a task based only on the user's description.

11. NO OVER-PLANNING RULE

Do not create planning artifacts when the work is obviously trivial.

Planning overhead must be proportional to the risk and complexity of the change.

The objective is not maximum documentation.

The objective is safe and efficient development.

12. NO UNDER-PLANNING RULE

Do not use direct implementation for changes involving:

security architecture
major schema changes
AI/RAG architecture
multiple domains
infrastructure
breaking changes

Use the appropriate planning workflow.

13. ESCALATION DURING IMPLEMENTATION

A feature may initially appear small or medium and become more complex after
code inspection.

If implementation reveals additional architectural impact:

STOP
↓
Recalculate impact
↓
Reclassify feature
↓
Update specification / plan / tasks
↓
Continue with the stronger workflow

Do not continue using a weaker workflow after discovering significant risks.

14. AGENT CLASSIFICATION OUTPUT

Before implementing a non-trivial feature, the agent should report:

Classification: SMALL | MEDIUM | LARGE

Impact Score: <number>

Reason:
<short explanation>

Workflow:
<selected workflow>

Example:

Classification: MEDIUM

Impact Score: 4

Reason:
The feature adds a new API, affects the conversation module, changes search
behavior, and requires authorization checks.

Workflow:
Specify → Plan → Tasks → Implement → Converge

15. ARTIFACT RULES

Only create the artifacts required by the selected workflow.

SMALL

Normally no new Spec Kit artifacts.

MEDIUM

Create:

.specify/specs/<feature>/
├── spec.md
├── plan.md
└── tasks.md

Add checklist.md only when useful.

LARGE

Create:

.specify/specs/<feature>/
├── spec.md
├── plan.md
├── checklist.md
└── tasks.md

Clarification decisions should be reflected in the specification.

Analysis findings should be resolved before implementation.

16. IMPLEMENTATION RULE

Implementation must follow the approved specification, plan, and tasks.

The agent MUST:

Reuse existing components
Follow the project constitution
Respect repository architecture
Respect workspace isolation
Maintain backward compatibility
Add or update tests
Validate database changes
Update documentation when required

The agent MUST NOT:

Invent requirements
Create duplicate services
Rewrite unrelated modules
Change completed phases without justification
Add unnecessary dependencies
Silently expand scope

17. CONVERGENCE RULE

After implementation, verify:

Requirements are implemented
Acceptance criteria are satisfied
Tasks are complete
Tests pass
Security requirements are satisfied
Database changes are valid
API behavior is correct
Documentation is updated where required

If gaps exist:

Identify the gap.
Create the minimum follow-up task.
Implement it.
Re-run verification.

Do not mark the feature complete while important requirements remain unmet.

18. FINAL WORKFLOW SUMMARY

SMALL

Inspect
→ Implement
→ Test
→ Verify

MEDIUM

Specify
→ Plan
→ Tasks
→ Implement
→ Converge

LARGE

Specify
→ Clarify
→ Plan
→ Checklist
→ Tasks
→ Analyze
→ Implement
→ Converge

19. PRIMARY GOAL

Spec Kit exists in this project to provide the minimum necessary process for
safe engineering.

The goal is:

Clear Requirements
↓
Appropriate Planning
↓
Controlled Implementation
↓
Verification
↓
Traceable, Maintainable Code

Do not optimize for the number of documents created.

Optimize for:

correctness
maintainability
security
scalability
traceability
development speed

## Decision Gate Rule

The agent MUST stop and ask the user before implementation when a decision:

- Changes the database schema
- Changes an existing API contract
- Changes security or authorization boundaries
- Changes workspace/repository isolation
- Changes RAG or AI architecture
- Introduces a new external provider
- Requires choosing between materially different architectural options
- Has multiple valid implementation approaches with meaningful long-term impact

For these decisions:

1. Explain the decision.
2. Present the available options.
3. Recommend one option.
4. Ask the user to choose or confirm.
5. Do not modify code until the decision is confirmed.

The agent MAY proceed without asking when:

- The answer is already established by the project constitution.
- The answer follows an existing project convention.
- The change is a low-risk implementation detail.
- The choice has no meaningful architectural impact.
