# Generates documentation structure for AI Digital Twin Platform
# Skips existing files to preserve current documentation

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$docsRoot = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot "..") "docs")).Path

function Format-SectionLabel {
    param([string]$SectionFolder)

    $label = ($SectionFolder -replace '^\d+-', '').Replace('-', ' ')
    return (Get-Culture).TextInfo.ToTitleCase($label)
}

function Write-DocFile {
    param([string]$Path, [string]$Content)

    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Get-ReadmeContent {
    param(
        [string]$SectionName,
        [string]$SectionTitle,
        [string[]]$Documents,
        [string[]]$RelatedSections,
        [string]$NextSection
    )

    $docsList = if ($Documents.Count -gt 0) {
        ($Documents | ForEach-Object { "- [$_](./$_)" }) -join "`n"
    } else {
        "_No child documents in this section._"
    }

    $relatedList = if ($RelatedSections.Count -gt 0) {
        ($RelatedSections | ForEach-Object {
            $relatedFolder = $_
            $title = Format-SectionLabel -SectionFolder $relatedFolder
            "- [$title](../$relatedFolder/README.md)"
        }) -join "`n"
    } else {
        "_None specified._"
    }

    $nextLink = if ($NextSection) {
        $nextTitle = Format-SectionLabel -SectionFolder $NextSection
        "[$nextTitle](../$NextSection/README.md)"
    } else {
        "_End of documentation index._"
    }

    @"
# $SectionTitle

## Purpose

<!-- Describe why this documentation section exists and what problems it addresses. -->

## Scope

<!-- Define what is included and excluded from this section. -->

## Documents Included

$docsList

## Related Documents

$relatedList

## Current Status

| Field | Value |
| ----- | ----- |
| Status | Not Started |
| Completion | 0% |

## Owner

<!-- Team or role responsible for maintaining this section. -->

## Last Updated

<!-- YYYY-MM-DD -->

## Next Document

$nextLink
"@
}

function Get-DocContent {
    param([string]$Title)

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

<!-- Document design decisions, patterns, and structure. -->

## Future Improvements

<!-- Note planned enhancements or open questions. -->

## References

<!-- Link to related documents, standards, or external resources. -->
"@
}

function Write-IfMissing {
    param([string]$Path, [string]$Content)

    if ((Test-Path $Path) -and -not $Force) {
        Write-Host "SKIP (exists): $Path"
        return
    }

    $action = if (Test-Path $Path) { "UPDATE" } else { "CREATE" }
    Write-DocFile -Path $Path -Content $Content
    Write-Host "$action`: $Path"
}

# Section definitions: folder => @{ title, docs[], related[], next }
$sections = [ordered]@{
    "01-project-overview" = @{
        title = "Project Overview"
        docs = @()
        related = @("02-user-journeys", "03-functional-requirements", "05-system-architecture")
        next = "02-user-journeys"
    }
    "02-user-journeys" = @{
        title = "User Journeys"
        docs = @()
        related = @("01-project-overview", "03-functional-requirements")
        next = "03-functional-requirements"
    }
    "03-functional-requirements" = @{
        title = "Functional Requirements"
        docs = @()
        related = @("02-user-journeys", "04-non-functional-requirements", "09-api-design")
        next = "04-non-functional-requirements"
    }
    "04-non-functional-requirements" = @{
        title = "Non-Functional Requirements"
        docs = @()
        related = @("03-functional-requirements", "05-system-architecture", "15-security")
        next = "05-system-architecture"
    }
    "05-system-architecture" = @{
        title = "System Architecture"
        docs = @(
            "01-architecture-principles.md",
            "02-high-level-architecture.md",
            "03-frontend-architecture.md",
            "04-backend-architecture.md",
            "05-authentication-flow.md",
            "06-github-integration-flow.md",
            "07-repository-sync-flow.md",
            "08-ai-rag-architecture.md",
            "09-search-architecture.md",
            "10-background-jobs.md",
            "11-notification-flow.md",
            "12-database-interactions.md",
            "13-caching-strategy.md",
            "14-logging-monitoring.md",
            "15-deployment-architecture.md",
            "16-security-architecture.md",
            "17-future-architecture.md",
            "diagrams/README.md"
        )
        related = @("06-technology-stack", "16-frontend-architecture", "17-backend-architecture")
        next = "06-technology-stack"
    }
    "06-technology-stack" = @{
        title = "Technology Stack"
        docs = @("frontend.md", "backend.md", "database.md", "ai.md", "infrastructure.md", "devops.md", "testing.md")
        related = @("05-system-architecture", "18-folder-structure", "19-coding-standards")
        next = "07-database-erd"
    }
    "07-database-erd" = @{
        title = "Database ERD"
        docs = @("entities.md", "relationships.md", "diagrams.md")
        related = @("08-database-design", "05-system-architecture")
        next = "08-database-design"
    }
    "08-database-design" = @{
        title = "Database Design"
        docs = @(
            "authentication.md", "integration.md", "repository.md", "branch.md",
            "commit.md", "pull-request.md", "documentation.md", "ai.md",
            "chat.md", "search.md", "notification.md", "audit.md"
        )
        related = @("07-database-erd", "09-api-design", "12-ai-rag-architecture")
        next = "09-api-design"
    }
    "09-api-design" = @{
        title = "API Design"
        docs = @("authentication.md", "github.md", "repositories.md", "ai.md", "search.md", "notifications.md")
        related = @("08-database-design", "10-authentication-design", "17-backend-architecture")
        next = "10-authentication-design"
    }
    "10-authentication-design" = @{
        title = "Authentication Design"
        docs = @()
        related = @("09-api-design", "15-security", "05-system-architecture")
        next = "11-github-integration"
    }
    "11-github-integration" = @{
        title = "GitHub Integration"
        docs = @("oauth.md", "repository-sync.md", "webhook.md", "rate-limits.md")
        related = @("09-api-design", "08-database-design", "14-background-jobs")
        next = "12-ai-rag-architecture"
    }
    "12-ai-rag-architecture" = @{
        title = "AI RAG Architecture"
        docs = @("embeddings.md", "chunking.md", "vector-search.md", "prompt-builder.md", "context-builder.md", "ai-provider.md")
        related = @("05-system-architecture", "08-database-design", "13-search-engine-design")
        next = "13-search-engine-design"
    }
    "13-search-engine-design" = @{
        title = "Search Engine Design"
        docs = @("keyword-search.md", "semantic-search.md", "hybrid-search.md", "ranking.md")
        related = @("12-ai-rag-architecture", "08-database-design", "09-api-design")
        next = "14-background-jobs"
    }
    "14-background-jobs" = @{
        title = "Background Jobs"
        docs = @("bullmq.md", "workers.md", "queues.md", "retries.md")
        related = @("05-system-architecture", "11-github-integration", "21-deployment")
        next = "15-security"
    }
    "15-security" = @{
        title = "Security"
        docs = @("authentication.md", "authorization.md", "encryption.md", "secrets.md", "rate-limiting.md")
        related = @("10-authentication-design", "04-non-functional-requirements", "21-deployment")
        next = "16-frontend-architecture"
    }
    "16-frontend-architecture" = @{
        title = "Frontend Architecture"
        docs = @("routing.md", "layouts.md", "components.md", "hooks.md", "state-management.md")
        related = @("05-system-architecture", "06-technology-stack", "18-folder-structure")
        next = "17-backend-architecture"
    }
    "17-backend-architecture" = @{
        title = "Backend Architecture"
        docs = @("modules.md", "controllers.md", "services.md", "repositories.md", "dto.md", "middleware.md")
        related = @("05-system-architecture", "09-api-design", "19-coding-standards")
        next = "18-folder-structure"
    }
    "18-folder-structure" = @{
        title = "Folder Structure"
        docs = @("frontend.md", "backend.md", "shared.md")
        related = @("16-frontend-architecture", "17-backend-architecture", "19-coding-standards")
        next = "19-coding-standards"
    }
    "19-coding-standards" = @{
        title = "Coding Standards"
        docs = @("naming.md", "typescript.md", "react.md", "nestjs.md", "git.md", "documentation.md")
        related = @("18-folder-structure", "20-testing-strategy", "06-technology-stack")
        next = "20-testing-strategy"
    }
    "20-testing-strategy" = @{
        title = "Testing Strategy"
        docs = @("unit.md", "integration.md", "e2e.md", "performance.md")
        related = @("19-coding-standards", "21-deployment", "06-technology-stack")
        next = "21-deployment"
    }
    "21-deployment" = @{
        title = "Deployment"
        docs = @("docker.md", "github-actions.md", "environments.md", "monitoring.md", "backups.md")
        related = @("05-system-architecture", "06-technology-stack", "15-security")
        next = "22-development-roadmap"
    }
    "22-development-roadmap" = @{
        title = "Development Roadmap"
        docs = @("milestones.md", "phases.md")
        related = @("23-future-enhancements", "01-project-overview")
        next = "23-future-enhancements"
    }
    "23-future-enhancements" = @{
        title = "Future Enhancements"
        docs = @()
        related = @("22-development-roadmap", "05-system-architecture")
        next = "24-glossary"
    }
    "24-glossary" = @{
        title = "Glossary"
        docs = @()
        related = @("01-project-overview", "05-system-architecture")
        next = $null
    }
}

# Doc title mapping from filename
$docTitles = @{
    "01-architecture-principles.md" = "Architecture Principles"
    "02-high-level-architecture.md" = "High-Level Architecture"
    "03-frontend-architecture.md" = "Frontend Architecture"
    "04-backend-architecture.md" = "Backend Architecture"
    "05-authentication-flow.md" = "Authentication Flow"
    "06-github-integration-flow.md" = "GitHub Integration Flow"
    "07-repository-sync-flow.md" = "Repository Sync Flow"
    "08-ai-rag-architecture.md" = "AI RAG Architecture"
    "09-search-architecture.md" = "Search Architecture"
    "10-background-jobs.md" = "Background Jobs"
    "11-notification-flow.md" = "Notification Flow"
    "12-database-interactions.md" = "Database Interactions"
    "13-caching-strategy.md" = "Caching Strategy"
    "14-logging-monitoring.md" = "Logging and Monitoring"
    "15-deployment-architecture.md" = "Deployment Architecture"
    "16-security-architecture.md" = "Security Architecture"
    "17-future-architecture.md" = "Future Architecture"
}

function Get-DocTitleFromFile {
    param([string]$FileName)

    if ($docTitles.ContainsKey($FileName)) {
        return $docTitles[$FileName]
    }

    $base = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    if ($base -eq "README") { return "Diagrams" }
    return (Get-Culture).TextInfo.ToTitleCase($base.Replace('-', ' '))
}

# Create section READMEs and child documents
foreach ($key in $sections.Keys) {
    $section = $sections[$key]
    $sectionPath = Join-Path $docsRoot $key

    $readmeContent = Get-ReadmeContent `
        -SectionName $key `
        -SectionTitle $section.title `
        -Documents $section.docs `
        -RelatedSections $section.related `
        -NextSection $section.next

    Write-IfMissing -Path (Join-Path $sectionPath "README.md") -Content $readmeContent

    foreach ($doc in $section.docs) {
        if ($doc -eq "diagrams/README.md") {
            $docPath = Join-Path (Join-Path $sectionPath "diagrams") "README.md"
            $content = @"
# Diagrams

## Purpose

<!-- Describe why this documentation section exists and what problems it addresses. -->

## Scope

<!-- Define what is included and excluded from this section. -->

## Documents Included

_No child documents in this section._

## Related Documents

- [System Architecture](../README.md)

## Current Status

| Field | Value |
| ----- | ----- |
| Status | Not Started |
| Completion | 0% |

## Owner

<!-- Team or role responsible for maintaining this section. -->

## Last Updated

<!-- YYYY-MM-DD -->

## Next Document

[Architecture Principles](../01-architecture-principles.md)
"@
            Write-IfMissing -Path $docPath -Content $content
            continue
        }

        $docPath = Join-Path $sectionPath $doc
        $title = Get-DocTitleFromFile -FileName $doc
        Write-IfMissing -Path $docPath -Content (Get-DocContent -Title $title)
    }
}

# Root docs/README.md
$folderDescriptions = ($sections.Keys | ForEach-Object {
    $folderKey = $_
    $num = $folderKey -replace '^(\d+).*', '$1'
    $title = $sections[$folderKey].title
    "| $num | [$title](./$folderKey/README.md) | <!-- Brief description --> |"
}) -join "`n"

$folderDescriptionBlocks = ($sections.Keys | ForEach-Object {
    $folderKey = $_
    "### $($sections[$folderKey].title) ($folderKey/)

<!-- Describe the purpose of this folder and what documentation it contains. -->

"
}) -join "`n"

$progressTracker = ($sections.Keys | ForEach-Object {
    $folderKey = $_
    "| [$($sections[$folderKey].title)](./$folderKey/README.md) | Not Started | TBD | TBD |"
}) -join "`n"

$rootReadme = @"
# AI Digital Twin Platform - Documentation

## Documentation Overview

<!-- High-level introduction to the documentation set for the AI Digital Twin Platform. -->

## Documentation Roadmap

<!-- Planned documentation phases and priorities across the software development lifecycle. -->

| Phase | Section | Status |
| ----- | ------- | ------ |
$folderDescriptions

## Progress Tracker

| Section | Status | Owner | Last Updated |
| ------- | ------ | ----- | ------------ |
$progressTracker

## Folder Descriptions

$folderDescriptionBlocks

## Contribution Guidelines

<!-- How to add, update, or review documentation in this repository. -->

1. Follow the documentation standards below.
2. Do not overwrite existing content without review.
3. Update the section README when adding new documents.
4. Use relative links between related documents.

## Documentation Standards

### File Naming

- Use kebab-case for all file names.
- Numbered prefixes indicate order within a section (e.g., 01-architecture-principles.md).

### README Structure

Every section README must include:

- Purpose
- Scope
- Documents Included
- Related Documents
- Current Status
- Owner
- Last Updated
- Next Document

### Document Template

Every document must include:

- Purpose
- Scope
- Overview
- Responsibilities
- Design
- Future Improvements
- References

### Linking

- Use relative paths for internal links.
- Cross-reference related sections in README files.
- Keep the Next Document chain navigable from section to section.
"@

Write-IfMissing -Path (Join-Path $docsRoot "README.md") -Content $rootReadme

Write-Host "`nDocumentation structure generation complete."
