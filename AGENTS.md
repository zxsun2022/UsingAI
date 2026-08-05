# UsingAI Repository Agent Rules

This repository contains AI skills, agent configurations, applications, templates, and a file-first personal knowledge base under `docs/`.

## Mandatory bootstrap

Before writing anywhere in this repository:

1. Read this file.
2. Read the nearest applicable `AGENTS.md` in the target directory and its ancestors.
3. Follow the most specific applicable rule.
4. Inspect the target path before creating or replacing content.
5. Never assume repository rules were loaded automatically by the runtime.

## Repository areas

| Path | Purpose |
|---|---|
| `skills/` | Versioned reusable AI skills |
| `agents/` | Agent configurations and prompts |
| `apps/` | Applications and prototypes |
| `templates/` | Reusable templates |
| `docs/` | Canonical file-first knowledge base |

## Git policy

### Direct commits to `main` are allowed for

- new independent records under `docs/inbox/`, `docs/conversations/`, `docs/sources/`, or `docs/reports/`;
- append-only audit entries;
- fixing obvious formatting errors in a file created by the same Agent during the same task.

### Branch and pull request are required for

- modifying this `AGENTS.md`;
- modifying any file under `skills/`;
- changing directory structure or schemas;
- bulk edits or migrations;
- deleting or moving files;
- materially revising existing long-lived knowledge under `docs/knowledge/`;
- promoting content from `docs/experiments/` into a stable area.

## Safety boundaries

Agents must not:

- force-push or rewrite Git history;
- delete branches, files, or large record sets without explicit approval;
- commit credentials, cookies, tokens, private keys, or secrets;
- fabricate model identities, source URLs, dates, citations, or unavailable conversation turns;
- present AI interpretation as the user's original words;
- silently overwrite historical records.

## Provenance

Every AI-created knowledge record should identify, when available:

- executing provider, product, interface, model, and identity confidence;
- Skill ID and version;
- source completeness;
- material files, pages, repositories, and web sources used;
- processing actions and limitations.

Use explicit values such as `unknown`, `partial`, or `unverified` instead of guessing.

## Completion report

After a write, report:

- file path and GitHub URL;
- commit SHA or pull request URL;
- whether the change was committed directly or submitted for review;
- any material missing inputs or limitations.
