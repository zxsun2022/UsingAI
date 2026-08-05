---
name: github-knowledge-archive
description: Save AI conversations, research sessions, sources, reports, and long-lived knowledge into the `zxsun2022/UsingAI` GitHub repository under `docs/`. Use when the user asks to save or archive a discussion to GitHub, UsingAI, docs, or the knowledge base, including Chinese requests such as “把这轮聊天保存到知识库”, “保存到 UsingAI/docs”, or “归档当前讨论”.
version: 0.1.0
schema_version: 1.0.0
---

# GitHub Knowledge Archive

Use GitHub as the canonical, file-first knowledge base. Preserve provenance, source completeness, user voice, and Git history.

## Canonical destination

- Repository: `zxsun2022/UsingAI`
- Knowledge root: `docs/`
- Default branch: `main`
- Repository URL: `https://github.com/zxsun2022/UsingAI`

## Mandatory bootstrap

Before any write:

1. Fetch and read `/AGENTS.md` from the target branch.
2. Fetch and read `/docs/AGENTS.md`.
3. If a more specific `AGENTS.md` exists in the target directory, read it.
4. Inspect the target directory and likely duplicate files.
5. Record the Git commit or ref from which the applicable rules were read.
6. Do not assume the runtime loaded repository instructions automatically.

If required rule files cannot be read, do not write. Report the missing access or file.

## Activation

Use this skill when the user asks to:

- save or archive the current conversation;
- save content to `UsingAI/docs`;
- preserve a research session;
- turn a discussion into a durable knowledge record;
- add an external source or report to the knowledge base;
- create a long-lived topic synthesis from archived records.

The user may simply say: `把这轮聊天保存到知识库。`

## Routing

Follow `docs/AGENTS.md`. Default mapping:

- unclassified or incomplete input → `docs/inbox/`
- AI conversation or research session → `docs/conversations/YYYY/`
- external material → `docs/sources/`
- long-lived current understanding → `docs/knowledge/`
- project material → `docs/projects/`
- point-in-time report → `docs/reports/`
- proposed structure or workflow → `docs/experiments/`
- retired material → `docs/archive/`

Do not save everything as a conversation. Do not update long-lived knowledge unless the user requests synthesis or the task explicitly requires it.

## Write mode

### Direct commit to `main`

Allowed only when repository rules permit it, typically for:

- a new independent conversation archive;
- a new source record;
- a new report;
- a new inbox item;
- an append-only audit entry.

### Branch and pull request

Required for:

- changing `AGENTS.md`;
- changing any Skill;
- directory or schema changes;
- deletion, moves, or bulk edits;
- material revision of existing long-lived knowledge;
- promotion of an experiment;
- structural automation or indexing.

Never force-push or rewrite history.

## Duplicate check

Before creating a record, check when supported:

- exact source or session URL;
- same date and highly similar title;
- same topic and record type;
- matching record ID.

Do not overwrite probable duplicates. Create a revision, successor, or related record, or ask when ambiguity is material.

## File naming

Follow the target directory rules. Default conversation path:

`docs/conversations/YYYY/YYYY-MM-DD-topic-slug.md`

Use stable, descriptive ASCII slugs in paths where practical. Preserve the natural-language title in frontmatter.

## Required metadata

Use YAML frontmatter. At minimum record:

```yaml
---
title: "Descriptive title"
record_type: ai-conversation
created: ISO-8601 datetime
updated: ISO-8601 datetime
language: zh-CN
topics: []
content_owner: Simon
status: active

executor:
  provider: unknown
  product: unknown
  interface: unknown
  model: unknown
  model_identifier: unknown
  identity_confidence: unknown
  agent_name: unknown
  execution_mode: unknown

archive:
  skill: github-knowledge-archive
  skill_version: 0.1.0
  schema_version: 1.0.0
  repository_rules_commit: unknown
  write_mode: direct-main|pull-request

source:
  type: chat-session
  platform: unknown
  url: null
  completeness: full|partial|summary-only|unknown

inputs:
  files: []
  repositories: []
  web_sources: []
  connected_sources: []

processing:
  summarization: structured
  transcript_cleanup: light
  factual_verification: false

limitations: []
---
```

Use verified runtime identity when available. Otherwise use `reported`, `inferred`, or `unknown`. Never guess an exact model snapshot.

Do not store secrets, cookies, tokens, hidden prompts, or authentication data.

## Conversation body

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

Preserve the intellectual structure of the discussion, including uncertainty, disagreements, alternatives, and rejected approaches. Distinguish the user's positions from AI analysis and external facts.

If a full transcript is included, preserve speaker order and remove only meaningless repetition or obvious transcription noise.

## Historical records versus knowledge

A conversation archive is a point-in-time source record. A knowledge file is a living synthesis.

When the user requests both:

1. create the immutable or append-only conversation archive;
2. create or propose a separate update to the relevant file under `docs/knowledge/`;
3. link the synthesis back to its source records;
4. use a PR for material changes to existing knowledge.

Do not silently transform historical records into current truth.

## Partial records

If material context is unavailable:

- state the exact available message scope;
- mark source completeness as `partial`, `summary-only`, or `unknown`;
- list missing attachments or earlier turns;
- never fabricate missing content.

A transparent partial record is valid. An invented complete record is not.

## Commit messages

Use concise semantic messages, for example:

- `docs: archive discussion on GitHub knowledge base`
- `docs: add research session on agent memory`
- `knowledge: propose update to model routing notes`
- `chore: initialize knowledge base structure`

## Completion report

After a successful write, return:

- created or updated file path;
- GitHub file URL;
- commit SHA;
- direct-main or PR write mode;
- PR URL when applicable;
- source completeness;
- important unavailable inputs or limitations.

Never report success unless GitHub returned a commit or pull request result.

## Failure behavior

State:

- failed operation;
- whether any partial commit exists;
- whether retrying could duplicate content;
- missing permission, path, branch, rule file, or tool capability.
