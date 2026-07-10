# Migrates legacy docs folders into the numbered documentation structure.
# Skips targets that already contain non-placeholder content.

param(
    [switch]$RemoveLegacy
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot "..") "docs")).Path

function Write-DocFile {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Test-IsPlaceholder {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return $true }
    $text = [System.IO.File]::ReadAllText($Path)
    if ($text -match 'Project\s+AI Digital Twin Platform') { return $false }
    if ($text.Length -gt 800 -and $text -notmatch '<!-- Describe the purpose of this document\. -->') { return $false }
    return $text -match '<!-- Describe the purpose' -or $text -match '<!-- Describe why this documentation'
}

function Get-Section {
    param([string]$Content, [string]$Heading)
    $pattern = "(?ms)^## $Heading\s*\r?\n(.*?)(?=^## |\z)"
    if ($Content -match $pattern) { return $Matches[1].Trim() }
    return $null
}

function New-SectionReadme {
    param(
        [string]$Title,
        [string]$Purpose,
        [string]$Scope,
        [string]$Body,
        [string[]]$Related,
        [string]$NextSection,
        [string]$Status = "Migrated"
    )

    $relatedList = ($Related | ForEach-Object {
        $label = (Get-Culture).TextInfo.ToTitleCase(($_ -replace '^\d+-', '').Replace('-', ' '))
        "- [$label](../$_/README.md)"
    }) -join "`n"

    $nextLink = if ($NextSection) {
        $nextLabel = (Get-Culture).TextInfo.ToTitleCase(($NextSection -replace '^\d+-', '').Replace('-', ' '))
        "[$nextLabel](../$NextSection/README.md)"
    } else { "_End of documentation index._" }

    @"
# $Title

## Purpose

$Purpose

## Scope

$Scope

## Content

$Body

## Documents Included

_No child documents in this section._

## Related Documents

$relatedList

## Current Status

| Field | Value |
| ----- | ----- |
| Status | $Status |
| Completion | 100% |

## Owner

<!-- Team or role responsible for maintaining this section. -->

## Last Updated

2026-07-09

## Next Document

$nextLink
"@
}

function New-TopicDoc {
    param(
        [string]$Title,
        [string]$Body,
        [string[]]$References = @()
    )

    $refs = if ($References.Count -gt 0) {
        ($References | ForEach-Object { "- $_" }) -join "`n"
    } else {
        "<!-- Link to related documents, standards, or external resources. -->"
    }

    @"
# $Title

## Purpose

<!-- Describe the purpose of this document. -->

## Scope

<!-- Define the boundaries and context of this document. -->

## Overview

<!-- Provide a high-level summary. -->

## Responsibilities

<!-- List key responsibilities, components, or actors. -->

## Design

$Body

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

$refs
"@
}

function Migrate-IfPlaceholder {
    param([string]$Target, [string]$Content)
    if (Test-IsPlaceholder -Path $Target) {
        Write-DocFile -Path $Target -Content $Content
        Write-Host "MIGRATED: $Target"
        return $true
    }
    Write-Host "SKIP (has content): $Target"
    return $false
}

# --- README sections (full document body) ---

$readmeMigrations = @(
    @{
        Source = "architecture/01-project-overview.md"
        Target = "01-project-overview/README.md"
        Title = "Project Overview"
        Purpose = "Define the vision, problem statement, solution, target users, and key principles for the AI Digital Twin Platform."
        Scope = "High-level product context for stakeholders, architects, and engineers."
        Related = @("02-user-journeys", "03-functional-requirements", "05-system-architecture")
        Next = "02-user-journeys"
    },
    @{
        Source = "Planning/user-journey.md"
        Target = "02-user-journeys/README.md"
        Title = "User Journeys"
        Purpose = "Define how users interact with the platform throughout their lifecycle."
        Scope = "User experience flows and sequences of user actions."
        Related = @("01-project-overview", "03-functional-requirements")
        Next = "03-functional-requirements"
    },
    @{
        Source = "Planning/functional-requirements.md"
        Target = "03-functional-requirements/README.md"
        Title = "Functional Requirements"
        Purpose = "Define the capabilities the platform must provide to end users."
        Scope = "Functional capabilities across authentication, workspaces, documents, AI, search, and integrations."
        Related = @("02-user-journeys", "04-non-functional-requirements", "09-api-design")
        Next = "04-non-functional-requirements"
    },
    @{
        Source = "Planning/non-functional-requirements.md"
        Target = "04-non-functional-requirements/README.md"
        Title = "Non-Functional Requirements"
        Purpose = "Define quality attributes, performance, security, scalability, and operational requirements."
        Scope = "Non-functional constraints and quality targets for the platform."
        Related = @("03-functional-requirements", "05-system-architecture", "15-security")
        Next = "05-system-architecture"
    },
    @{
        Source = "api/06-api-design.md"
        Target = "09-api-design/README.md"
        Title = "API Design"
        Purpose = "Define API conventions, response formats, and endpoint overview."
        Scope = "REST API design standards for the platform."
        Related = @("08-database-design", "10-authentication-design", "17-backend-architecture")
        Next = "10-authentication-design"
    },
    @{
        Source = "backend/07-authentication.md"
        Target = "10-authentication-design/README.md"
        Title = "Authentication Design"
        Purpose = "Document authentication flows, providers, JWT structure, and RBAC."
        Scope = "Identity, access tokens, and role-based access control."
        Related = @("09-api-design", "15-security", "05-system-architecture")
        Next = "11-github-integration"
    },
    @{
        Source = "architecture/18-feature-roadmap.md"
        Target = "23-future-enhancements/README.md"
        Title = "Future Enhancements"
        Purpose = "Track prioritized future features and enhancements."
        Scope = "P0 through P3 feature priorities beyond the current roadmap."
        Related = @("22-development-roadmap", "05-system-architecture")
        Next = "24-glossary"
    }
)

foreach ($item in $readmeMigrations) {
    $sourcePath = Join-Path $root $item.Source
    $targetPath = Join-Path $root $item.Target
    if (-not (Test-Path $sourcePath)) {
        Write-Host "MISSING SOURCE: $($item.Source)"
        continue
    }
    if (-not (Test-IsPlaceholder -Path $targetPath)) {
        Write-Host "SKIP (has content): $($item.Target)"
        continue
    }
    $body = [System.IO.File]::ReadAllText($sourcePath).Trim()
    $content = New-SectionReadme -Title $item.Title -Purpose $item.Purpose -Scope $item.Scope -Body $body -Related $item.Related -NextSection $item.Next
    Write-DocFile -Path $targetPath -Content $content
    Write-Host "MIGRATED: $($item.Target)"
}

# --- Technology stack split ---
$techStackPath = Join-Path $root "architecture/03-tech-stack.md"
if (Test-Path $techStackPath) {
    $tech = [System.IO.File]::ReadAllText($techStackPath)
    $splits = @{
        "06-technology-stack/frontend.md" = "Frontend"
        "06-technology-stack/backend.md" = "Backend"
        "06-technology-stack/devops.md" = "DevOps"
        "06-technology-stack/testing.md" = "Testing"
    }
    foreach ($entry in $splits.GetEnumerator()) {
        $section = Get-Section -Content $tech -Heading $entry.Value
        if ($section) {
            Migrate-IfPlaceholder -Target (Join-Path $root $entry.Key) -Content (New-TopicDoc -Title $entry.Value -Body $section -References @("[Technology Stack README](../README.md)"))
        }
    }
}

# --- Folder structure split ---
$folderPath = Join-Path $root "architecture/04-folder-structure.md"
if (Test-Path $folderPath) {
    $folder = [System.IO.File]::ReadAllText($folderPath)
    $rootSection = Get-Section -Content $folder -Heading "Repository Root"
    $frontendSection = Get-Section -Content $folder -Heading "Frontend Structure"
    $backendSection = Get-Section -Content $folder -Heading "Backend Structure"

    if ($rootSection) {
        Migrate-IfPlaceholder -Target (Join-Path $root "18-folder-structure/shared.md") -Content (New-TopicDoc -Title "Shared" -Body $rootSection)
    }
    if ($frontendSection) {
        Migrate-IfPlaceholder -Target (Join-Path $root "18-folder-structure/frontend.md") -Content (New-TopicDoc -Title "Frontend" -Body $frontendSection)
    }
    if ($backendSection) {
        Migrate-IfPlaceholder -Target (Join-Path $root "18-folder-structure/backend.md") -Content (New-TopicDoc -Title "Backend" -Body $backendSection)
    }
}

# --- Security split ---
$securityPath = Join-Path $root "architecture/12-security.md"
if (Test-Path $securityPath) {
    $security = [System.IO.File]::ReadAllText($securityPath)
    $owasp = Get-Section -Content $security -Heading "OWASP Top 10 Mitigations"
    $headers = Get-Section -Content $security -Heading "Security Headers"
    $rate = Get-Section -Content $security -Heading "Rate Limiting"
    $encryption = Get-Section -Content $security -Heading "Data Encryption"

    $securityReadme = New-SectionReadme -Title "Security" -Purpose "Document platform security controls and mitigations." -Scope "Application security, headers, rate limiting, and encryption." -Body ("## OWASP Top 10 Mitigations`n`n$owasp`n`n## Security Headers`n`n$headers") -Related @("10-authentication-design", "04-non-functional-requirements", "21-deployment") -NextSection "16-frontend-architecture"
    Migrate-IfPlaceholder -Target (Join-Path $root "15-security/README.md") -Content $securityReadme
    if ($rate) {
        Migrate-IfPlaceholder -Target (Join-Path $root "15-security/rate-limiting.md") -Content (New-TopicDoc -Title "Rate Limiting" -Body $rate)
    }
    if ($encryption) {
        Migrate-IfPlaceholder -Target (Join-Path $root "15-security/encryption.md") -Content (New-TopicDoc -Title "Encryption" -Body $encryption)
    }
}

# --- Coding standards split ---
$codingPath = Join-Path $root "architecture/13-coding-standards.md"
if (Test-Path $codingPath) {
    $coding = [System.IO.File]::ReadAllText($codingPath)
    $naming = Get-Section -Content $coding -Heading "Naming Conventions"
    $patterns = Get-Section -Content $coding -Heading "Architecture Patterns"
    $typescript = Get-Section -Content $coding -Heading "TypeScript Rules"
    $git = Get-Section -Content $coding -Heading "Git Conventions"

    $codingReadme = New-SectionReadme -Title "Coding Standards" -Purpose "Define naming, architecture patterns, and engineering conventions." -Scope "Cross-cutting coding standards for frontend and backend." -Body ("## Architecture Patterns`n`n$patterns") -Related @("18-folder-structure", "20-testing-strategy", "06-technology-stack") -NextSection "20-testing-strategy"
    Migrate-IfPlaceholder -Target (Join-Path $root "19-coding-standards/README.md") -Content $codingReadme
    if ($naming) { Migrate-IfPlaceholder -Target (Join-Path $root "19-coding-standards/naming.md") -Content (New-TopicDoc -Title "Naming" -Body $naming) }
    if ($typescript) { Migrate-IfPlaceholder -Target (Join-Path $root "19-coding-standards/typescript.md") -Content (New-TopicDoc -Title "TypeScript" -Body $typescript) }
}

$gitWorkflowPath = Join-Path $root "architecture/GIT_WORKFLOW.md"
if (Test-Path $gitWorkflowPath) {
    $gitWorkflow = [System.IO.File]::ReadAllText($gitWorkflowPath).Trim()
    $gitConventions = if (Test-Path $codingPath) { Get-Section -Content ([System.IO.File]::ReadAllText($codingPath)) -Heading "Git Conventions" } else { "" }
    $gitBody = if ($gitConventions) { "## Git Conventions`n`n$gitConventions`n`n---`n`n$gitWorkflow" } else { $gitWorkflow }
    Migrate-IfPlaceholder -Target (Join-Path $root "19-coding-standards/git.md") -Content (New-TopicDoc -Title "Git" -Body $gitBody)
}

# --- Roadmap ---
$roadmapPath = Join-Path $root "architecture/14-development-roadmap.md"
if (Test-Path $roadmapPath) {
    $roadmap = [System.IO.File]::ReadAllText($roadmapPath).Trim()
    Migrate-IfPlaceholder -Target (Join-Path $root "22-development-roadmap/phases.md") -Content (New-TopicDoc -Title "Phases" -Body $roadmap)
}

# --- Testing split ---
$testingPath = Join-Path $root "architecture/16-testing-strategy.md"
if (Test-Path $testingPath) {
    $testing = [System.IO.File]::ReadAllText($testingPath)
    $pyramid = Get-Section -Content $testing -Heading "Testing Pyramid"
    $unit = Get-Section -Content $testing -Heading "Unit Tests (Jest)"
    $integration = Get-Section -Content $testing -Heading "Integration Tests (Supertest)"
    $e2e = Get-Section -Content $testing -Heading "E2E Tests (Playwright)"
    $running = Get-Section -Content $testing -Heading "Running Tests"

    $testingReadme = New-SectionReadme -Title "Testing Strategy" -Purpose "Define the testing pyramid and overall quality approach." -Scope "Unit, integration, E2E, and performance testing." -Body ("## Testing Pyramid`n`n$pyramid`n`n## Running Tests`n`n$running") -Related @("19-coding-standards", "21-deployment", "06-technology-stack") -NextSection "21-deployment"
    Migrate-IfPlaceholder -Target (Join-Path $root "20-testing-strategy/README.md") -Content $testingReadme
    if ($unit) { Migrate-IfPlaceholder -Target (Join-Path $root "20-testing-strategy/unit.md") -Content (New-TopicDoc -Title "Unit" -Body $unit) }
    if ($integration) { Migrate-IfPlaceholder -Target (Join-Path $root "20-testing-strategy/integration.md") -Content (New-TopicDoc -Title "Integration" -Body $integration) }
    if ($e2e) { Migrate-IfPlaceholder -Target (Join-Path $root "20-testing-strategy/e2e.md") -Content (New-TopicDoc -Title "E2E" -Body $e2e) }
}

# --- AI / RAG ---
$aiArchPath = Join-Path $root "ai/08-ai-architecture.md"
if (Test-Path $aiArchPath) {
    $aiArch = [System.IO.File]::ReadAllText($aiArchPath).Trim()
    Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/ai-provider.md") -Content (New-TopicDoc -Title "AI Provider" -Body $aiArch)
}

$ragPath = Join-Path $root "ai/09-rag-pipeline.md"
if (Test-Path $ragPath) {
    $rag = [System.IO.File]::ReadAllText($ragPath)
    $overview = Get-Section -Content $rag -Heading "Overview"
    $flow = Get-Section -Content $rag -Heading "Pipeline Flow"
    $ingestion = Get-Section -Content $rag -Heading "Ingestion Pipeline"
    $retrieval = Get-Section -Content $rag -Heading "Retrieval Pipeline"

    $ragReadme = New-SectionReadme -Title "AI RAG Architecture" -Purpose "Document retrieval-augmented generation architecture." -Scope "Ingestion, embedding, retrieval, and generation pipelines." -Body ("## Overview`n`n$overview`n`n## Pipeline Flow`n`n$flow") -Related @("05-system-architecture", "08-database-design", "13-search-engine-design") -NextSection "13-search-engine-design"
    Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/README.md") -Content $ragReadme
    if ($ingestion) {
        $chunking = ($ingestion -split "`n" | Select-Object -Skip 1 | Where-Object { $_ -match 'Chunking' }) -join "`n"
        Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/chunking.md") -Content (New-TopicDoc -Title "Chunking" -Body $ingestion)
        Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/embeddings.md") -Content (New-TopicDoc -Title "Embeddings" -Body $ingestion)
    }
    if ($retrieval) {
        Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/context-builder.md") -Content (New-TopicDoc -Title "Context Builder" -Body $retrieval)
    }
}

$vectorPath = Join-Path $root "database/10-vector-database.md"
if (Test-Path $vectorPath) {
    $vector = [System.IO.File]::ReadAllText($vectorPath).Trim()
    Migrate-IfPlaceholder -Target (Join-Path $root "12-ai-rag-architecture/vector-search.md") -Content (New-TopicDoc -Title "Vector Search" -Body $vector)
}

# --- GitHub integration ---
$integrationsPath = Join-Path $root "api/11-integrations.md"
if (Test-Path $integrationsPath) {
    $integrations = [System.IO.File]::ReadAllText($integrationsPath).Trim()
    $githubReadme = New-SectionReadme -Title "GitHub Integration" -Purpose "Document GitHub and external integration patterns." -Scope "GitHub OAuth, repository sync, webhooks, and integration extensibility." -Body $integrations -Related @("09-api-design", "08-database-design", "14-background-jobs") -NextSection "12-ai-rag-architecture"
    Migrate-IfPlaceholder -Target (Join-Path $root "11-github-integration/README.md") -Content $githubReadme
}

# --- Database ERD ---
$dbPath = Join-Path $root "database/05-database-design.md"
if (Test-Path $dbPath) {
    $db = [System.IO.File]::ReadAllText($dbPath)
    $overview = Get-Section -Content $db -Heading "Overview"
    $erd = Get-Section -Content $db -Heading "Entity Relationship Diagram"
    $pgvector = Get-Section -Content $db -Heading "pgvector Usage"

    $erdReadme = New-SectionReadme -Title "Database ERD" -Purpose "Document entity relationships and database overview." -Scope "Core entities, relationships, and vector storage." -Body ("## Overview`n`n$overview") -Related @("08-database-design", "05-system-architecture") -NextSection "08-database-design"
    Migrate-IfPlaceholder -Target (Join-Path $root "07-database-erd/README.md") -Content $erdReadme
    if ($erd) { Migrate-IfPlaceholder -Target (Join-Path $root "07-database-erd/diagrams.md") -Content (New-TopicDoc -Title "Diagrams" -Body $erd) }
    if ($pgvector) { Migrate-IfPlaceholder -Target (Join-Path $root "07-database-erd/relationships.md") -Content (New-TopicDoc -Title "Relationships" -Body $pgvector) }
}

# --- Deployment split ---
$deployPath = Join-Path $root "deployment/15-deployment.md"
if (Test-Path $deployPath) {
    $deploy = [System.IO.File]::ReadAllText($deployPath)
    $docker = Get-Section -Content $deploy -Heading "Docker Deployment"
    $cicd = Get-Section -Content $deploy -Heading "CI/CD Pipeline"
    $envStrategy = Get-Section -Content $deploy -Heading "Environment Strategy"
    $infra = Get-Section -Content $deploy -Heading "Infrastructure Requirements"

    $deployReadme = New-SectionReadme -Title "Deployment" -Purpose "Document deployment strategy and infrastructure requirements." -Scope "Docker, CI/CD, environments, monitoring, and backups." -Body ("## Infrastructure Requirements`n`n$infra") -Related @("05-system-architecture", "06-technology-stack", "15-security") -NextSection "22-development-roadmap"
    Migrate-IfPlaceholder -Target (Join-Path $root "21-deployment/README.md") -Content $deployReadme
    if ($docker) { Migrate-IfPlaceholder -Target (Join-Path $root "21-deployment/docker.md") -Content (New-TopicDoc -Title "Docker" -Body $docker) }
    if ($cicd) { Migrate-IfPlaceholder -Target (Join-Path $root "21-deployment/github-actions.md") -Content (New-TopicDoc -Title "GitHub Actions" -Body $cicd) }
    if ($envStrategy) { Migrate-IfPlaceholder -Target (Join-Path $root "21-deployment/environments.md") -Content (New-TopicDoc -Title "Environments" -Body $envStrategy) }
}

$envPath = Join-Path $root "deployment/17-environment-variables.md"
if (Test-Path $envPath) {
    $envVars = [System.IO.File]::ReadAllText($envPath).Trim()
    $envTarget = Join-Path $root "21-deployment/environments.md"
    if (Test-IsPlaceholder -Path $envTarget) {
        Migrate-IfPlaceholder -Target $envTarget -Content (New-TopicDoc -Title "Environments" -Body $envVars)
    } else {
        $existing = [System.IO.File]::ReadAllText($envTarget)
        if ($existing -notmatch 'Environment Variables') {
            $merged = $existing -replace '(## Design\r?\n)', "`$1`n`n## Environment Variables`n`n$envVars`n`n"
            Write-DocFile -Path $envTarget -Content $merged
            Write-Host "MERGED: 21-deployment/environments.md"
        }
    }
    Migrate-IfPlaceholder -Target (Join-Path $root "15-security/secrets.md") -Content (New-TopicDoc -Title "Secrets" -Body $envVars)
}

# --- Update root README progress ---
$rootReadmePath = Join-Path $root "README.md"
if (Test-Path $rootReadmePath) {
    $rootReadme = [System.IO.File]::ReadAllText($rootReadmePath)
    $rootReadme = $rootReadme -replace '\| Not Started \| TBD \| TBD \|', '| Migrated | TBD | 2026-07-09 |'
    $rootReadme = $rootReadme -replace '<!-- High-level introduction to the documentation set for the AI Digital Twin Platform\. -->', 'Central documentation index for the AI Digital Twin Platform. Content migrated from the legacy `docs/architecture`, `docs/Planning`, `docs/api`, `docs/ai`, `docs/backend`, `docs/database`, and `docs/deployment` folders into the numbered structure.'
    Write-DocFile -Path $rootReadmePath -Content $rootReadme
    Write-Host "UPDATED: docs/README.md"
}

# --- Remove legacy folders ---
if ($RemoveLegacy) {
    $legacyFolders = @("architecture", "Planning", "api", "ai", "backend", "database", "deployment", "decisions", "diagrams", "frontend")
    foreach ($folder in $legacyFolders) {
        $legacyPath = Join-Path $root $folder
        if (Test-Path $legacyPath) {
            Remove-Item -Path $legacyPath -Recurse -Force
            Write-Host "REMOVED: docs/$folder/"
        }
    }
}

Write-Host "`nLegacy documentation migration complete."
