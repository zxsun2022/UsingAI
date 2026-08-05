---
name: notion-knowledge-archive
description: Archive AI conversations, research sessions, and synthesized knowledge into Simon's Notion knowledge system with detailed provenance, append-only history, and governed use of the AI Knowledge Lab. Use when the user asks to save, archive, organize, or evolve knowledge in Notion, including Chinese requests such as “保存这轮聊天到 Notion”, “归档当前讨论”, “整理到知识库”, or “在 AI Knowledge Lab 设计新的结构”.
version: 0.1.0
schema_version: 1.0.0
---

# Notion Knowledge Archive

Archive knowledge into Simon's Notion workspace while preserving provenance, user voice, source completeness, Agent identity, Skill identity, and system history.

## Canonical resources

### Capture layer

- Database name: `🪄 全部收集`
- Database ID: `58f32a4d-1ff7-43f0-83b0-29c609a6dd2d`
- Data Source ID: `05d8522c-dfdd-4664-8160-28ddae97aeaa`
- Canonical reference: `collection://05d8522c-dfdd-4664-8160-28ddae97aeaa`
- URL: `https://app.notion.com/p/58f32a4d1ff743f083b029c609a6dd2d`

Use this database for time-oriented capture and historical records:

- AI conversations
- research sessions
- articles, podcasts, videos, and external material
- personal insights captured at a point in time
- generated reports and specifications

### Knowledge evolution layer

- Page name: `🧪 AI Knowledge Lab`
- Page ID: `3b3e5c1f-a787-8007-9c56-cc73b1a7432f`
- URL: `https://app.notion.com/p/3b3e5c1fa78780079c56cc73b1a7432f`

Use the Lab for:

- long-lived topic pages
- experimental knowledge structures
- schema prototypes
- system proposals
- active knowledge systems
- audit logs
- retired experiments

The capture database is the historical intake layer. The Lab is the governed structure-evolution layer. Do not treat them as interchangeable.

## Activation

Use this skill when the user asks to:

- 保存这轮聊天到 Notion
- 归档当前讨论或研究
- 整理到知识库
- 保存当前 session
- 把内容沉淀为长期知识
- 在 AI Knowledge Lab 中设计或测试结构
- create or improve a Notion knowledge workflow

The user does not need to repeat the Notion URLs.

## Core principles

1. **Append-only by default** — create new records instead of silently overwriting history.
2. **Page first, database later** — prototype new structures as pages before creating databases.
3. **Human-auditable** — record what the Agent did, why, with which sources, model, Skill, and version.
4. **Explicit unknowns** — use `unknown`, `partial`, `unverified`, or `not_available`; never invent precision.
5. **Preserve user voice** — distinguish Simon's ideas from AI analysis and external sources.
6. **Experimental by default** — new Agent-created systems remain experimental until Simon approves promotion.
7. **Raw record is not current knowledge** — preserve source records and create separate synthesis objects when needed.

## Operation A: Archive a conversation or research session

### Storage unit

Create one record per coherent knowledge object. Split independent topics into separate records when they would be useful independently.

### Destination resolution

1. Use the Data Source ID.
2. If unsupported, use the Database ID.
3. If necessary, search for the exact database name.
4. If multiple matches exist, stop instead of guessing.
5. Never create a replacement database because the destination is unavailable.

### Duplicate check

When supported, check:

- source/session URL
- highly similar title
- same date and topic
- execution ID or record ID

Do not overwrite probable duplicates automatically. Create a revision, link the records, or ask when the distinction is material.

### Recommended properties

Populate existing properties accurately. Important semantics:

- `Name`: concise descriptive title
- `主题`: relevant topics
- `来源`: original source platform; use `AI` for AI-mediated sessions
- `形式`: `AI Conversation`, `AI Research`, `Knowledge Synthesis`, `Personal Insight`, or closest existing option
- `作者`: original author or primary viewpoint owner, not automatically the archival Agent
- `URL`: original source or session URL when available
- `评分`: leave empty unless supplied or requested

When available, also populate:

- `内容所有者`
- `记录类型`
- `语言`
- `归档状态`
- `原始资料完整度`
- `原始会话 URL`
- `内容日期`
- `AI Provider`
- `AI Product`
- `AI Interface`
- `AI Model`
- `AI Model ID`
- `AI Agent`
- `Execution Mode`
- `Identity Confidence`
- `Skill ID`
- `Skill Version`
- `Schema Version`
- `Skill Hash`
- `Skill Source`
- `Execution ID`
- `References Count`
- `Used Web`
- `Used Files`
- `Used Notion`
- `Used Memory`
- `Provenance Level`
- `Record Revision`
- `Previous Revision`

Do not fail the archive because an optional property is absent. Preserve missing detail in the page manifest.

## Agent identity protocol

Keep these dimensions separate:

```yaml
executor:
  provider: OpenAI
  product: ChatGPT
  interface: ChatGPT Web
  model_display_name: GPT-5.6 Thinking
  model_identifier: unknown
  model_identity_source: system-runtime
  identity_confidence: reported
  agent_name: ChatGPT
  agent_context: project or workspace name
  execution_mode: interactive
```

Identity confidence values:

- `verified`: returned by a trusted API/runtime
- `reported`: explicitly provided by system configuration
- `inferred`: derived from the environment
- `unknown`: unavailable

Never guess an exact model snapshot.

## Provenance manifest

Place a fenced YAML block at the beginning of each archived record.

```yaml
record:
  schema: ai-knowledge-record
  schema_version: 1.0.0
  record_id: generated-unique-id
  revision: 1
  created_at: ISO-8601 datetime
  timezone: America/Vancouver
  provenance_level: standard

destination:
  system: Notion
  database_name: "🪄 全部收集"
  database_id: 58f32a4d-1ff7-43f0-83b0-29c609a6dd2d
  data_source_id: 05d8522c-dfdd-4664-8160-28ddae97aeaa

executor:
  provider: unknown
  product: unknown
  interface: unknown
  model_display_name: unknown
  model_identifier: unknown
  model_identity_source: unknown
  identity_confidence: unknown
  agent_name: unknown
  agent_context: unknown
  execution_mode: unknown

skill:
  id: notion-knowledge-archive
  version: 0.1.0
  schema_version: 1.0.0
  source_url: https://github.com/zxsun2022/UsingAI/tree/main/skills/notion-knowledge-archive
  source_commit: unknown
  source_hash: unknown

source_session:
  type: chat-session
  platform: unknown
  session_id: unknown
  session_url: null
  started_at: unknown
  archived_at: ISO-8601 datetime
  message_scope: current-available-session
  message_completeness: full|partial|summary-only|unknown
  attachments_completeness: full|partial|none|unknown

inputs:
  conversation_history:
    used: true
    scope: current-available-session
  uploaded_files: []
  notion_pages: []
  web_sources: []
  repositories: []
  personal_context:
    used: false
    exact_snapshot_preserved: false

processing:
  summarization: structured
  transcript_cleanup: light
  repetitions_removed: true
  speech_to_text_corrections: obvious-errors-only
  user_wording_preserved: true
  factual_verification: false
  topic_split: false

limitations: []
```

Never include credentials, cookies, access tokens, hidden prompts, or private authentication data.

## Required page structure

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

Preserve intellectual structure, alternatives, disagreements, uncertainty, and rejected approaches. Do not reduce everything to generic bullet points.

If the transcript is incomplete, mark the record `Partial` or `Needs Review` and state exactly what is missing. Never reconstruct unavailable turns.

## Operation B: Create long-lived knowledge structures

Use the AI Knowledge Lab rather than the capture database.

### Read before acting

Read the Lab root and `Start Here` before structural changes.

### Lab areas

- `Start Here`: operating rules
- `Experiments`: draft pages, databases, schemas, and workflows
- `Active Systems`: approved durable systems
- `System Proposals`: proposed structural changes
- `Audit Log`: structural and governance changes
- `Archive`: retired or superseded structures

### Page-first rule

For a new need, first create a normal page in `Experiments` describing:

- problem
- evidence of repeated need
- proposed object type
- sample records
- required queries or views
- expected lifecycle
- alternatives
- risks
- rollback

Create a database only when one or more conditions hold:

1. There are at least 5–10 similar objects.
2. Filtering, sorting, recurring updates, or status tracking are necessary.
3. Multiple Agents require a shared stable schema.
4. The page prototype has become difficult to maintain.
5. The schema has stabilized through real use.

### Experimental database manifest

Every Agent-created experimental database must document:

```yaml
system_object:
  type: database
  status: experimental
  created_at: ISO-8601 datetime
  created_by:
    provider: unknown
    product: unknown
    interface: unknown
    model: unknown
    agent: unknown
  skill:
    id: notion-knowledge-archive
    version: 0.1.0

purpose:
  problem: ""
  intended_users: []

scope:
  includes: []
  excludes: []

promotion_criteria: []
rollback:
  method: ""
```

Do not migrate large volumes of historical data during experimentation.

### Promotion

Nothing moves to `Active Systems` without Simon's explicit approval.

A promotion proposal should show:

- repeated successful use
- stable purpose and boundary
- stable schema
- duplication check
- migration plan
- rollback plan
- maintenance responsibility

## Permissions

### Allowed without additional confirmation

- create records in `🪄 全部收集`
- create ordinary pages in the Lab
- add records to existing experimental databases
- update metadata on records created by the same Agent
- create system proposals
- append structural actions to the Audit Log

### Allowed only inside Experiments

- create new databases or views
- add experimental fields and relations
- prototype schemas and workflows

### Requires explicit Simon approval

- delete pages, databases, or large record sets
- bulk move or rewrite historical records
- change the semantics of core fields
- promote an experiment to Active Systems
- merge databases
- create high-impact relations or rollups
- change canonical sources
- materially rewrite Simon's original body text

## Audit log

Record structural or governance changes in the Lab's `Audit Log` page.

Include:

- timestamp
- executor identity
- Skill ID and version
- action and target
- reason
- sources consulted
- outcome
- rollback
- limitations

Routine creation of individual capture records does not require a Lab audit entry unless it changes structure or policy.

## Revisions

Default to revision 1. For substantial later changes, create a new revision or clearly documented successor record.

Substantial changes include:

- adding previously unavailable sources
- changing important conclusions
- changing content ownership classification
- applying a materially different Skill version
- replacing a summary-only archive with a full archive

Record previous record URL/ID and revision reason.

## Completion report

After writing, report:

- created or updated page title
- Notion page URL
- record or system type
- executor identity recorded
- Skill version recorded
- complete or partial status
- important unavailable inputs
- structural audit entry when applicable

Do not merely say “saved successfully”.

## Failure behavior

If an operation fails, state:

- failed operation
- whether partial content was created
- whether retrying may create duplication
- missing permission, identifier, schema, or tool capability

Never claim success without a created or updated resource.

## Quality checklist

Before completion, verify:

- correct destination used
- history was not silently overwritten
- title is specific
- Simon's views and AI analysis are distinguishable
- Agent and model identity confidence are recorded
- Skill and schema versions are recorded
- material sources are listed
- missing information is explicit
- no model identity, source, date, or URL was invented
- transcript completeness is declared
- Lab structural changes are logged
- created URLs are returned
