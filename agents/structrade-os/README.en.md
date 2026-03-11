# StrucTrade OS

Language: [中文](./README.md) | [English](./README.en.md)
Specs: [中文 Spec](./StrucTrade_OS.md) | [English Spec](./StrucTrade_OS.en.md)

StrucTrade OS is a personal investing operating system spec for AI agents. It is not a stock-picking bot and it is not an auto-trading system. Its purpose is to turn an agent into a structured investing workflow across research intake, thesis management, risk controls, trade planning, triggers, reviews, and attribution.

## How To Use

The simplest way to use StrucTrade OS is to copy the block below and send it to your agent.

```text
Please read and execute this document:
https://raw.githubusercontent.com/zxsun2022/UsingAI/main/agents/structrade-os/StrucTrade_OS.en.md

Requirements:
1. Follow the phases in order.
2. After completing each phase, report back to me.
3. Do not proceed to the next phase until I confirm.
```

If the target agent cannot fetch URLs, paste the full contents of `StrucTrade_OS.en.md` and keep the same execution requirements.

## Core Philosophy

StrucTrade OS is built around one idea: most individual investors do not lack information, they lack structure. The system is designed to improve decision quality rather than increase trading frequency.

- Structure before judgment: raw notes, links, screenshots, and ideas must become structured records before they become decisions.
- Risk before returns: every trade idea should be challenged by a skeptical risk layer before execution.
- Every thesis must be falsifiable: a valid thesis needs assumptions, disconfirming conditions, and a review path.
- Position size should match conviction: sizing, pacing, and holding period should reflect what the investor actually knows.
- Human-in-the-loop by design: the system advises, records, checks, and reminds. It never places trades automatically.

## Workflow

StrucTrade OS follows an institutional-style loop for a single-user investing workflow:

1. Intake: capture research notes, links, screenshots, broker statements, and observations.
2. Thesis: convert raw inputs into explicit, reviewable investment theses.
3. Risk: enforce hard rules, surface soft warnings, and pressure-test decisions.
4. Trigger: track price levels, event windows, and thesis-dependent alerts.
5. Trade Plan: turn a view into position sizing, entry pacing, stop logic, and exit conditions.
6. Attribution: review results and separate skill, timing, sizing, and luck.

## What Makes It Different

- It treats investing as an operating system, not a chat prompt.
- It encodes discipline as executable rules instead of vague reminders.
- It connects research, execution, and review in one loop.
- It is designed for thesis-driven US equity investing, with room to extend into ETFs, options, and crypto.

## Who It Is For

StrucTrade OS is best suited to investors who already have views and want a better operating framework around them.

- Investors running thesis-driven positions in US stocks and ETFs
- Investors who want stricter risk controls without handing control to an automated strategy
- Investors who want to turn ad hoc ideas into a repeatable process

## Directory Role

This directory belongs under `agents/`, not `skills/`.

- `skills/` are better for narrow, reusable capabilities.
- `agents/structrade-os/` is the right home for a full agent spec, operating model, and execution workflow.

## Files

- `StrucTrade_OS.md`: original Chinese spec
- `StrucTrade_OS.en.md`: English agent-ready spec
- `README.md`: Chinese project overview
- `README.en.md`: English project overview

## Distribution Notes

1. Use the spec file as the primary input for the agent.
2. Prefer the raw URL when the platform supports document retrieval.
3. Keep this directory intact when sharing across platforms instead of distributing a single file in isolation.
