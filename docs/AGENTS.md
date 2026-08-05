# Knowledge Base Agent Rules

`docs/` is the canonical file-first knowledge base. Store content as human-readable Markdown with YAML frontmatter.

## Required workflow

Before writing:

1. Read `/AGENTS.md` and this file.
2. Inspect the relevant target directory.
3. Decide whether the content is a historical record, external source, long-lived knowledge, project material, report, or experiment.
4. Check for likely duplicates by title, source URL, date, and topic.
5. Use the least destructive operation.

## Directory routing

| Directory | Purpose | Default write mode |
|---|---|---|
| `inbox/` | Unclassified or incomplete input | direct commit allowed |
| `conversations/` | AI conversation and research-session archives | direct commit allowed |
| `sources/` | External articles, podcasts, videos, papers, and documents | direct commit allowed |
| `knowledge/` | Long-lived topic synthesis and current understanding | PR for material revisions |
| `projects/` | Goal-oriented project knowledge and decisions | direct new files; PR for structural changes |
| `reports/` | Point-in-time reviews and generated reports | direct commit allowed |
| `experiments/` | Draft schemas and proposed structures | direct new pages; promotion requires PR |
| `archive/` | Retired or superseded material | moving content here requires PR |

## Core distinction

- A conversation archive records what happened at a specific time.
- A knowledge file records the current reusable understanding of a topic.
- Preserve the original archive when creating or updating long-lived knowledge.
- Do not turn every conversation into a knowledge file automatically.

## Naming

Use stable, human-readable names.

- Conversations: `YYYY-MM-DD-topic-slug.md`
- Sources: `YYYY-MM-DD-title-slug.md`
- Reports: `YYYY-MM-DD-report-name.md`
- Knowledge and projects: stable topic or project names without date prefixes

Use lowercase ASCII slugs for paths where practical. Chinese titles may remain inside the document.

## Minimum frontmatter

```yaml
---
title: "Descriptive title"
record_type: ai-conversation
created: 2026-08-04T20:00:00-07:00
updated: 2026-08-04T20:00:00-07:00
language: zh-CN
topics: []
content_owner: Simon
status: active

executor:
  provider: unknown
  product: unknown
  interface: unknown
  model: unknown
  identity_confidence: unknown

archive:
  skill: github-knowledge-archive
  skill_version: 0.1.0
  repository_rules_commit: unknown

source:
  type: chat-session
  url: null
  completeness: full|partial|summary-only|unknown
---
```

Add only relevant optional fields. Do not turn frontmatter into an uncontrolled dump.

## Conversation archive body

Use applicable sections:

1. `核心摘要`
2. `用户原始问题与观点`
3. `背景与上下文`
4. `讨论与分析`
5. `关键结论`
6. `行动项`
7. `待解决问题`
8. `来源与参考信息`
9. `对话记录`
10. `Revision History`

Preserve disagreements, uncertainty, rejected approaches, and meaningful user wording. Remove only meaningless repetition and obvious speech-to-text noise.

## Incomplete input

If source material is incomplete:

- create a clearly marked partial record when it still has value;
- describe exactly what is missing;
- never reconstruct unavailable content;
- use `status: needs-review` or `source.completeness: partial`.

## Revisions

Historical records are append-only by default. For substantial updates, create a successor or document the revision and previous file explicitly.

## Structural experiments

Use **page first, database or automation later** as the general design principle:

- prototype with Markdown files under `experiments/`;
- document problem, evidence, proposed structure, examples, risks, promotion criteria, and rollback;
- do not create scripts, indexes, or generated systems until repeated use justifies them;
- promotion into stable directories requires explicit approval and a PR.
