# AI / RAG Architecture

Project

AI Digital Twin Platform

Version

1.0

Status

Approved

---

# 1. Purpose

This document defines the complete AI architecture used by the AI Digital Twin Platform.

The platform uses Retrieval-Augmented Generation (RAG) to answer engineering questions using synchronized engineering knowledge rather than relying solely on the knowledge of a Large Language Model (LLM).

The objective is to provide accurate, explainable, and evidence-backed answers.

---

# 2. Goals

The AI system shall:

- Understand engineering history.
- Search synchronized engineering knowledge.
- Answer using repository evidence.
- Provide citations.
- Avoid hallucinations.
- Support multiple AI providers.
- Scale for large repositories.

---

# 3. AI Architecture

```

User

↓

Frontend

↓

Chat API

↓

AI Orchestrator

↓

Retriever

↓

Context Builder

↓

Prompt Builder

↓

Provider Manager

↓

LLM

↓

Response Formatter

↓

Citation Builder

↓

Conversation Storage

↓

Frontend

```

---

# 4. AI Components

## AI Orchestrator

Responsibilities

- Receive user request
- Coordinate AI workflow
- Handle failures
- Manage execution

---

## Retriever

Responsibilities

Retrieve relevant engineering knowledge.

Sources

- Commits
- Pull Requests
- Reviews
- Issues
- Documentation
- Repository Metadata

---

## Context Builder

Responsibilities

Combine retrieved information into one context.

Example

Commit

-

PR

-

Documentation

-

Issue

↓

Context

---

## Prompt Builder

Responsibilities

Generate the final prompt sent to the LLM.

The prompt must include:

- User Question
- Repository Context
- Engineering Metadata
- Citations
- System Instructions

---

## Provider Manager

Responsibilities

Select AI provider.

Supported

- Ollama
- OpenAI
- Gemini
- Anthropic

Future providers should be supported without changing business logic.

---

## LLM

Responsibilities

Generate natural language responses.

The LLM must never directly access GitHub or the database.

---

## Response Formatter

Responsibilities

Format

- Markdown
- Code Blocks
- Tables
- Lists

Prepare streaming responses.

---

## Citation Builder

Responsibilities

Attach evidence.

Examples

Commit

PR

Issue

README

Documentation

Branch

Repository

Every answer should include supporting references whenever possible.

---

## Conversation Manager

Responsibilities

Store

- Chat history
- Context
- AI responses
- User feedback

---

# 5. RAG Pipeline

User Question

↓

Keyword Search

↓

Semantic Search

↓

Merge Results

↓

Ranking Engine

↓

Context Builder

↓

Prompt Builder

↓

AI Provider

↓

Response

↓

Citation Generator

↓

Store Conversation

---

# 6. Knowledge Sources

Version 1

Repository Metadata

Branches

Commits

Pull Requests

Reviews

Issues

README

Markdown Documentation

Conversation History

Future

Jira

Slack

Confluence

Gmail

Bitbucket

GitLab

---

# 7. Embedding Pipeline

Repository Sync

↓

Chunk Generator

↓

Text Cleaning

↓

Chunk Metadata

↓

Embedding Generation

↓

pgvector

↓

Ready For Search

Embeddings are generated asynchronously.

---

# 8. Chunking Strategy

The platform divides large documents into semantic chunks.

Chunk Types

Documentation

Commit Messages

Pull Request Descriptions

Issue Discussions

README Sections

Each chunk stores

- Source
- Repository
- Branch
- File
- Chunk ID

---

# 9. Retrieval Strategy

The AI performs

Keyword Search

-

Semantic Search

-

Metadata Filtering

↓

Hybrid Retrieval

↓

Ranking

↓

Context

Hybrid retrieval provides higher accuracy.

---

# 10. Prompt Structure

Every prompt contains

System Prompt

↓

User Question

↓

Repository Context

↓

Engineering Evidence

↓

Conversation History

↓

Instructions

↓

LLM

---

# 11. Citation Strategy

Every response should reference:

Repository

Commit

Pull Request

Issue

Documentation

Branch

Example

Payment Gateway was introduced in

Commit

3ac91d

Author

John

Pull Request

#145

Documentation

payment.md

Confidence

96%

---

# 12. AI Safety

The AI must

Never invent commits.

Never invent pull requests.

Never fabricate repository history.

Never answer without evidence.

When evidence is insufficient,

respond honestly.

---

# 13. Multi-Repository Support

Users may search

Single Repository

Multiple Repositories

Entire Workspace

Results should always identify the source repository.

---

# 14. Conversation Memory

Each conversation stores

Question

Retrieved Context

Prompt

Response

Feedback

Pinned Status

Timestamp

Repository Scope

Future

Collections

Folders

Tags

---

# 15. AI Provider Strategy

Development

Ollama

Production

OpenAI

Gemini

Anthropic

The Provider Manager chooses the configured provider.

---

# 16. Performance

Target Response Time

Initial response

< 5 seconds

Streaming enabled

Embeddings generated asynchronously

Search optimized using pgvector

---

# 17. Failure Handling

If retrieval fails

↓

Return meaningful message

If AI provider fails

↓

Retry

↓

Fallback Provider

↓

Notify User

If evidence is insufficient

↓

Return available findings

↓

Recommend repository synchronization

---

# 18. Future Enhancements

Code Diff Analysis

Repository Comparison

Architecture Detection

Bug Root Cause Analysis

Release Summaries

Sprint Summaries

Code Review Assistant

Engineering Timeline

AI Memory Optimization

Fine-Tuned Models

---

# 19. Summary

The AI / RAG Architecture transforms engineering metadata into an intelligent, searchable knowledge base.

By combining retrieval, semantic search, structured prompts, provider abstraction, and evidence-backed responses, the AI Digital Twin Platform delivers trustworthy engineering insights while remaining scalable and extensible.
