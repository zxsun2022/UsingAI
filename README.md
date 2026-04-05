# UsingAI

[简体中文说明](./README.zh-CN.md)

Public showcase for my AI work, including distributable skills, reusable agents, and future additions such as prompts, experiments, and workflows.

## Documentation Language Policy

English is the primary language of this repository at the project level.

- Root-level documentation should default to English, with a separate Chinese companion file when helpful.
- The `agents/` directory may remain bilingual when that improves usability.
- The `skills/` directory may remain Chinese-first when translating domain terms would reduce accuracy.

## Repository Scope

This is a showcase and aggregation repository, not a single-skill package.

- Each subdirectory under `skills/` is an independent skill unit.
- Each subdirectory under `agents/` is an independent agent or agent-spec unit.
- In actual use, copy, symlink, or package the specific subdirectory you need instead of treating the whole repository as one installable skill.
- All public examples currently use fictional birth data such as `2000-1-1` to avoid mixing in real personal data.

## Current Contents

- [`skills/ziwei-iztro-reader`](./skills/ziwei-iztro-reader): A Ziwei Doushu charting and layered interpretation skill built on `iztro`.
- [`skills/ziwei-zhongzhou-reader`](./skills/ziwei-zhongzhou-reader): A deeper interpretation skill that extends `iztro` charting with Wang Tingzhi's Zhongzhou-school framework.
- [`skills/institutional_equity_research_memo`](./skills/institutional_equity_research_memo): A buy-side, institution-grade public-equity research memo skill for long/short analysis using public-source evidence.
- [`skills/axiom-extractor`](./skills/axiom-extractor): An incremental corpus-reading skill for distilling a person's core axioms, beliefs, and worldview from large collections of writings.
- [`agents/structrade-os`](./agents/structrade-os): A personal investment operating system spec for AI agents, currently updated to the v3.0 charter edition.

## Usage

1. Clone this repository.
2. Enter the subdirectory of the target skill or agent.
3. Follow that subdirectory's own documentation for platform-specific integration.
4. If you need to upload content to Claude.ai or a similar platform, package only the target subdirectory rather than the entire repository.

## Planned Additions

More content will be added over time, including:

- More reusable AI skills
- More reusable AI agents and agent specs
- Prompts and agent configurations
- Experimental workflows and examples
- Documentation on practical AI usage
