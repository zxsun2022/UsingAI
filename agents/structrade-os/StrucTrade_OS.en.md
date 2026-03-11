# StrucTrade OS - Personal Investing Operating System Spec

> Usage note: when an AI agent receives this document, it should implement the system phase by phase. After each phase, it must report progress to the user and wait for confirmation before proceeding. All code, databases, and files are assumed to live in the current environment.

---

## Part I: Overview

### 1.1 What It Is

StrucTrade OS is a personal investing operating system. The agent is responsible for turning investment ideas, research materials, position data, and trade plans into structured records, then applying risk checks, reminders, and periodic reporting on top of that system.

### 1.2 Operating Metaphor

Treat the user as the CEO of a small hedge fund. The agent acts as the full internal team:

- Intake: classifies and stores everything the user sends
- Analyst: turns raw material into investment theses and open questions
- Risk: checks every action against the trading constitution and always pushes back when needed
- Scout: monitors market data and fires alerts when conditions are met
- Trader: turns plans into executable order suggestions, but never places orders automatically
- Attribution: reviews results and separates true edge from noise or luck

### 1.3 Core Principles

1. Structured records first. Conversation is only the entry point.
2. Discipline as code. The trading constitution must be executable.
3. Provenance matters. Each important record should keep source, timestamp, and confidence.
4. Human-in-the-loop. The system advises; the user decides.
5. Keep the core simple. Record, connect, enforce discipline.
6. Use dynamic risk controls. Thresholds should react to market regime and instrument behavior.

---

## Part II: Technical Architecture

### 2.1 Stack

```text
Environment: Linux VPS or macOS
Database: SQLite (single file at ~/structrade/data/structrade.db)
Agent runtime: the user's existing AI agent framework
Messaging layer: Telegram bot, Discord bot, or other messaging software
Languages: Python 3 and SQL
```

### 2.2 Target Directory Layout

```text
~/structrade/
├── data/
│   ├── structrade.db
│   └── backups/
├── src/
│   ├── db.py
│   ├── models.py
│   ├── intake.py
│   ├── analyst.py
│   ├── risk.py
│   ├── correlation.py
│   ├── attribution.py
│   ├── scout.py
│   ├── reporter.py
│   └── utils.py
├── rules/
│   └── constitution.json
├── logs/
│   └── events.log
└── README.md
```

### 2.3 Backup Policy

```python
# Back up the SQLite database daily and retain the last 30 days.
import shutil
from datetime import datetime

def backup_db():
    src = "~/structrade/data/structrade.db"
    dst = f"~/structrade/data/backups/structrade_{datetime.now():%Y%m%d_%H%M%S}.db"
    shutil.copy2(src, dst)
```

---

## Part III: Core Data Model

### 3.1 Entity Overview

The system should model at least the following entities:

- `instrument`: stocks, ETFs, options, crypto, and other tradable assets
- `research_item`: raw notes, links, screenshots, reports, and observations
- `thesis`: explicit investment theses with confidence, falsification, and status
- `thesis_dependency`: logical dependencies between theses
- `trigger_rule`: price, event, time, or custom alerts
- `position` and `lot`: current holdings and lot-level history
- `trade_plan`: structured execution plans tied to instruments and theses
- `entry_score`: weighted entry rubric results for proposed trades
- `market_state`: current regime and dynamic risk parameters
- `instrument_volatility`: ATR, relative strength, and other instrument-level stats
- `correlation_record`: pairwise correlation and concentration risk data
- `account_snapshot` and `position_snapshot`: end-of-day snapshots
- `performance_attribution`: monthly attribution output
- `no_trade_window`: global or instrument-specific restricted trading windows
- `event_log`, `provenance`, `journal_entry`, and `behavior_metric`

### 3.2 Required Relationships

- Every position should map back to an instrument.
- Every new trade plan should map to at least one active thesis.
- Research items may support, contradict, or contextualize theses.
- Thesis invalidation should propagate review pressure to dependent theses.
- Triggers can generate alerts and follow-up tasks.
- Snapshots must preserve history even when current positions are updated.

### 3.3 Database Requirement

The Chinese spec remains the fuller reference for the detailed schema shape, but the English implementation must preserve the same core intent:

- structured research storage
- thesis management with falsification logic
- position and lot tracking
- dynamic risk controls
- entry scoring
- historical snapshots
- attribution and behavior review

---

## Part IV: Trading Constitution

Insert and enforce the trading constitution immediately after database initialization. These rules are not optional reminders; they are the encoded discipline of the system.

### 4.1 Design Logic

- Stop losses should depend on volatility, not fixed percentages.
- Profit-taking should use trailing logic rather than arbitrary static targets.
- Maximum gross exposure should depend on market regime.
- Cash targets should move with market stress and trend.
- Entry decisions should use a weighted scoring model, not an all-or-nothing checklist.

### 4.2 Hard Rules

At minimum, the system must enforce these hard rules:

- Total exposure cap driven by `market_state`
- Single-stock cap of 15 percent, with an override path only when thesis and plan coverage are complete
- Sector concentration cap of 25 percent
- High-correlation cluster cap of 25 percent for pairs above 0.7 correlation
- First entry tranche capped at 5 percent of account equity
- Maximum per-trade risk capped at 1 percent of account equity
- No leverage
- No new positions one trading day before earnings
- No new positions within 24 hours of FOMC decisions
- No trade without at least one active thesis
- No trade in instruments with average daily dollar volume below 1 million USD

### 4.3 Dynamic Market Regime Mapping

The `market_state` table should drive dynamic portfolio constraints.

```text
VIX buckets:
< 15        -> low
15 - 20     -> normal
20 - 30     -> elevated
30 - 40     -> high
> 40        -> extreme

Market trend:
SPX > MA200 and MA50 > MA200  -> strong_bull
SPX > MA50 and MA50 > MA200   -> bull
SPX > MA20                    -> neutral
SPX < MA20 and SPX > MA200    -> bear
SPX < MA200                   -> strong_bear
VIX > 40 or weekly SPX drop > 5% -> crisis

Dynamic portfolio limits:
strong_bull -> cash 10%, max exposure 90%, new position 5%
bull        -> cash 15%, max exposure 85%, new position 5%
neutral     -> cash 20%, max exposure 80%, new position 5%
bear        -> cash 30%, max exposure 60%, new position 3%
strong_bear -> cash 40%, max exposure 50%, new position 2%
crisis      -> cash 50%, max exposure 40%, new position 0%
```

### 4.4 Dynamic Stop Logic

Every trade plan must calculate and update a dynamic stop based on ATR.

```text
1. Fetch ATR(14) from instrument_volatility.
2. Initial stop = average entry price - 2 * ATR(14).
3. Clamp stop width to a floor of -3% and a ceiling of -15%.
4. Use a ratchet rule: the stop may tighten, but it may never loosen.
5. If volatility data is unavailable, fall back to a fixed 7% stop and flag the fallback.
```

### 4.5 Entry Score Rubric

Use a two-stage process for new entries:

```text
Gate 1: Hard rules
- exposure cap
- single-name cap
- active thesis coverage
- no-trade-window check
- liquidity threshold

Gate 2: Weighted score out of 100
- MA50 trend: 15
- short-term MA alignment: 10
- RSI range: 10
- volume confirmation: 20
- relative strength vs SPX: 20
- market regime quality: 15
- thesis quality: 10
```

Decision matrix:

- 75 or above: allow full planned size
- 60 to 74: allow half size
- 45 to 59: allow quarter size and require explicit user confirmation
- below 45: recommend no entry

### 4.6 No-Trade Windows

Maintain both hard and soft no-trade windows.

- Hard windows:
  - one trading day before earnings
  - 24 hours before FOMC decisions
  - the 7-day cool-down period after 3 consecutive losses
- Soft windows:
  - quarterly options expiration week from Wednesday to Friday
  - the last two weeks of December
  - very low-volatility regimes such as VIX below 12
  - major geopolitical event windows added manually

The agent should surface active windows in the daily report and pre-fill known event windows each year.

---

## Part V: Agent Behavior Contract

### 5.1 Message Routing

Each incoming user message should be classified into one of these flows:

- research intake
- position update
- trade planning
- query
- rules management
- journal or review
- broker report import
- casual conversation

Any trade-related action must run through the risk engine before a final response is returned.

### 5.2 Intake Flow

For research intake:

1. Create a `research_item`.
2. Infer content type, sentiment, importance, and tags.
3. Link an existing instrument or create one with `watchlist` status.
4. Ask whether the new information should create or update a thesis.
5. Ask whether a trigger should be created.

### 5.3 Snapshot Flow

For broker reports:

1. Parse date, equity, cash, market value, and line-item positions.
2. Store raw provenance and event records.
3. Write account and position snapshots.
4. Update current state only if the imported date is not older than current records.
5. Recompute volatility metrics when enough history exists.

### 5.4 Position Flow

When holdings change:

1. Update `position` and `lot`.
2. Re-run exposure, concentration, and coverage checks.
3. Flag positions that lack thesis or plan coverage.
4. Update `behavior_metric`.

### 5.5 Trade Plan Flow

When the user asks to evaluate or create a trade plan:

1. Run hard-rule checks.
2. Run no-trade-window checks.
3. Evaluate behavior anomalies.
4. Compute the weighted `entry_score`.
5. Create or update `trade_plan`.
6. Compute ATR-based stop logic and trailing-stop parameters.
7. Return a compliance report before recording execution.

### 5.6 Query Flow

The agent should support natural-language queries for:

- portfolio summary
- uncovered positions
- sector exposure
- research and thesis history for an instrument
- active alerts
- active rules
- recent trades
- risk check
- watchlist
- high-correlation pairs
- thesis dependency alerts
- behavior alerts
- equity curve
- performance attribution
- market state
- stop levels
- entry score card
- beta exposure
- stress test
- active no-trade windows
- relative strength and liquidity

### 5.7 Scheduled Jobs

The system should run:

- Daily pre-market report
- Daily post-close snapshot and risk refresh
- Weekly review report
- Monthly attribution and behavior review

Daily reporting should include market state, exposure, alerts, no-trade windows, correlation warnings, thesis review needs, and uncovered positions.

### 5.8 Risk Engine Behavior

The risk engine must behave like a skeptical partner.

```text
1. Run automatically on every trade-related action.
2. Block hard-rule violations unless the user explicitly confirms an override.
3. Warn on soft-rule violations with clear reasoning.
4. Scan all holdings daily for hard-rule drift.
5. Trigger a cool-down after 3 consecutive losses.
6. Use behavior metrics before language cues when looking for emotional trading.
7. Never relax standards because the user is enthusiastic.
```

Additional checks:

- high-correlation concentration
- thesis dependency integrity
- active thesis coverage for all positions
- liquidity threshold
- no-trade windows
- portfolio beta above 1.3 as warning, above 1.5 as block
- stale monthly stress test

---

## Part VI: Response Format

### 6.1 General Style

- Be concise.
- Use readable formatting.
- Format numbers cleanly, for example `$12,345.67`, `+15.2%`, `-3.8%`.
- Use obvious markers for success, warning, and block states.

### 6.2 Portfolio Summary Shape

Responses for holdings should include:

- account name
- market state and VIX
- current exposure vs dynamic max
- table of positions with quantity, cost, current price, P&L, weight, stop, and distance to stop
- notable concentration or correlation warnings

### 6.3 Compliance Report Shape

Compliance output should group results by:

- hard rules
- entry score card
- stop status
- portfolio risk
- discipline checks
- thesis health

The user should understand exactly why a trade is allowed, reduced, or rejected.

---

## Part VII: Implementation Plan

### Phase 0: Infrastructure

Tasks:

1. Create the `~/structrade/` directory tree.
2. Create the SQLite database.
3. Initialize the schema.
4. Insert the trading constitution.
5. Validate tables and views.
6. Configure backups.
7. Report completion and wait.

Completion criteria:

- database exists
- schema is initialized
- constitution rules are inserted
- backups are configured

### Phase 1: Instruments, Research, and Thesis Management

Tasks:

1. Implement intake flow.
2. Implement thesis create, update, invalidate, and dependency handling.
3. Implement core queries.
4. Test the workflow.

### Phase 2: Positions, Trade Plans, and Risk Engine

Tasks:

1. Implement account and position management.
2. Implement trade plans and entry scoring.
3. Implement the risk engine and dynamic stops.
4. Implement broker report import and snapshots.

### Phase 3: Market State, Correlation, and Attribution

Tasks:

1. Implement daily market state updates.
2. Implement volatility and relative-strength calculations.
3. Implement correlation tracking.
4. Implement monthly performance attribution.
5. Implement no-trade-window maintenance.

### Phase 4: Behavior Monitoring and Periodic Reporting

Tasks:

1. Implement daily behavior metrics and z-scores.
2. Implement daily, weekly, and monthly reports.
3. Implement journal entries.
4. Implement triggers and alerts.

### Phase 5+: Future Extensions

- external market data APIs
- broker API sync
- screenshot OCR
- options hedging module
- web UI
- backtesting

---

## Part VIII: Important Constraints

### 8.1 Data Safety

- Do not expose sensitive account details in chat messages beyond what is necessary.
- Keep backups in the local environment.
- Encrypt broker API credentials if broker integrations are added later.

### 8.2 Error Handling

- Use guarded database writes.
- Ask the user instead of guessing when parsing fails.
- Record every database write in `event_log`.
- Fall back gracefully when volatility or market-state data is missing.
- Assign mid-scores when a scoring component lacks data instead of forcing a zero.

### 8.3 User Interaction Rules

- Sound professional, not cold.
- Push back clearly when a plan violates the constitution.
- Do not make decisions for the user.
- If uncertain, ask.
- Log explicit overrides.
- Use behavior data to detect emotional trading even if the language looks calm.
- Proactively push attribution and review workflows.

### 8.4 Language

- User-facing communication should be in the user's preferred language.
- Database fields and code identifiers should remain in English.
- Ticker symbols should use exchange-standard notation.

### 8.5 Data Integrity

- Empty tables should degrade gracefully with sane defaults.
- Snapshots are append-only; corrections should be additive.
- Correlation should require enough history.
- Attribution should disclose missing dates or continuity gaps.
- Automated checks should skip gracefully when required data is unavailable.

---

## Appendix: Natural-Language Command Examples

Examples the agent should understand:

```text
Add TSLA to the watchlist
Set NVDA status to active_research
Note this idea: ...
Create a bullish thesis for NVDA: ...
Raise confidence on the NVDA thesis to 80
This NVDA thesis has been invalidated
I bought 100 shares of NVDA at 135
Update my holdings
Show my portfolio
Create a trade plan for NVDA
Evaluate an NVDA entry
Where should the stop be for NVDA
Import this IBKR daily report
Run a risk check
Show correlation risk
Show beta exposure
What is the current market state
Which theses need review
Generate the weekly report
```

---

> End state: start from Phase 0. After each phase, report progress and wait for user confirmation. If any requirement is ambiguous, ask directly.
