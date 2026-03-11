# StrucTrade OS — 个人投资操作系统规格书

> **本文档的使用方法**：你（AI Agent）收到此文档后，应按照 Phase 顺序逐步实现。每完成一个 Phase，向用户报告进展并等待确认后再进入下一个 Phase。所有代码、数据库、文件都部署在当前 VPS 环境中。

---

## 第一部分：项目概述

### 1.1 是什么

StrucTrade OS 是一个**个人投资操作系统**。用户通过 Telegram 与你对话，你负责将用户的投资想法、研究资料、持仓数据、交易计划结构化地存入数据库，并基于预设规则提供风控检查、交易提醒和定期报告。

### 1.2 核心隐喻

用户是对冲基金的 CEO。你是他的整个研究和交易团队，包含以下角色：

- **秘书（Intake）**：把用户发来的任何信息归类、结构化、存入数据库
- **分析师（Analyst）**：从原始材料提炼投资论点，提出需要验证的问题
- **风控官（Risk）**：检查每一笔操作是否违反交易宪法——**永远唱反调，永远不因为用户的热情而放松标准**
- **情报官（Scout）**：监控市场数据，触发条件命中时提醒用户
- **交易员（Trader）**：将计划转为可执行的订单建议（但永远不自动下单）
- **绩效分析师（Attribution）**：定期分解收益来源，识别真正的 alpha

### 1.3 核心原则

1. **结构化优先**：所有信息必须落入数据库对象，对话只是入口
2. **纪律即代码**：用户的交易宪法被编码为可执行的规则，系统强制执行
3. **溯源透明**：每条数据都有来源、时间戳、可信度
4. **人类决策**：系统只建议，不自动下单，所有交易指令需用户确认
5. **简单内核**：核心只做三件事——记录、关联、守纪律。复杂功能通过插件实现
6. **动态适应**：风控参数基于市场状态和标的特性动态调整，而非固定阈值

---

## 第二部分：技术架构

### 2.1 技术栈

```
运行环境：VPS（Linux）
数据库：SQLite（单文件，路径：~/structrade/data/structrade.db）
Agent 框架：用户当前已部署的 AI Agent
通信：Telegram Bot
语言：Python 3（主要）、SQL
```

### 2.2 目录结构

```
~/structrade/
├── data/
│   ├── structrade.db          # 主数据库
│   └── backups/               # 每日自动备份
├── src/
│   ├── db.py                  # 数据库初始化与迁移
│   ├── models.py              # 数据对象定义
│   ├── intake.py              # 信息摄入逻辑
│   ├── analyst.py             # 论点提炼逻辑
│   ├── risk.py                # 风控引擎
│   ├── correlation.py         # 相关性监控
│   ├── attribution.py         # 绩效归因
│   ├── scout.py               # 数据抓取与触发器
│   ├── reporter.py            # 报告生成
│   └── utils.py               # 工具函数
├── rules/
│   └── constitution.json      # 交易宪法（结构化规则）
├── logs/
│   └── events.log             # 事件日志
└── README.md
```

### 2.3 数据库备份策略

```python
# 每日凌晨自动备份，保留最近 30 天
# 备份文件名格式：structrade_YYYYMMDD_HHMMSS.db
# 实现方式：cron job 或 agent 每日触发
import shutil
from datetime import datetime

def backup_db():
    src = "~/structrade/data/structrade.db"
    dst = f"~/structrade/data/backups/structrade_{datetime.now():%Y%m%d_%H%M%S}.db"
    shutil.copy2(src, dst)
    # 删除 30 天前的备份
```

---

## 第三部分：数据库 Schema（核心）

### 3.1 实体关系总览

```
Constitution(rules) ──validates──▶ TradePlan
                                      │
Instrument ◀──belongs_to── Position ──has_many──▶ TradePlan
  │                           │                      │
  ├── ResearchItem[]          ├── Lot[]               ├── PlanAllocation
  ├── Thesis[]                └── (unallocated_qty)   └── references──▶ Thesis
  ├── Trigger[]                                              │
  │     │                                                    ├── depends_on ──▶ Thesis
  │     └── fires──▶ Alert ──generates──▶ Task               └── thesis_research
  └── InstrumentVolatility

PositionSnapshot ── 每日收盘快照
AccountSnapshot ── 每日账户快照
CorrelationRecord ── 持仓相关性
PerformanceAttribution ── 绩效归因
MarketState ── 市场状态评估
EntryScore ── 建仓条件评分
NoTradeWindow ── 禁止交易窗口

EventLog ── 记录所有变更
Provenance ── 追溯所有数据来源
JournalEntry ── 交易复盘日志
BehaviorMetric ── 交易行为统计
```

### 3.2 完整建表 SQL

```sql
-- ============================================================
-- StrucTrade OS — SQLite Schema
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- 1. Instrument（投资标的）
-- 统一抽象：股票、ETF、期权、加密货币等
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrument (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol          TEXT NOT NULL,               -- 代码，如 NVDA, BTC-USD
    name            TEXT,                        -- 全称
    asset_type      TEXT NOT NULL DEFAULT 'stock', -- stock | etf | option | crypto | bond | fund
    exchange        TEXT,                        -- 交易所：NASDAQ, NYSE, BINANCE...
    currency        TEXT DEFAULT 'USD',
    sector          TEXT,                        -- 行业板块
    industry        TEXT,                        -- 细分行业
    market_cap_tier TEXT,                        -- mega | large | mid | small | micro
    avg_daily_volume REAL,                       -- 日均成交量（股）
    avg_daily_dollar_volume REAL,                -- 日均成交额（美元）
    liquidity_tier  TEXT DEFAULT 'unknown',      -- high(>50M) | medium(10-50M) | low(1-10M) | illiquid(<1M)
    tags            TEXT DEFAULT '[]',           -- JSON 数组，自定义标签
    status          TEXT DEFAULT 'watchlist',    -- watchlist | active_research | ready_to_trade | trading | archived
    notes           TEXT,                        -- 简要备注
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(symbol, exchange)
);

CREATE INDEX idx_instrument_symbol ON instrument(symbol);
CREATE INDEX idx_instrument_status ON instrument(status);
CREATE INDEX idx_instrument_sector ON instrument(sector);

-- ------------------------------------------------------------
-- 2. ResearchItem（研究条目 / 原始输入）
-- 用户发来的一切原始材料先落到这里
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_item (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id   INTEGER,                    -- 可为 NULL（尚未关联标的）
    content_type    TEXT NOT NULL DEFAULT 'note', -- note | link | screenshot_text | file | quote | news | report
    title           TEXT,                        -- 标题/摘要
    content         TEXT NOT NULL,               -- 正文内容
    source_url      TEXT,                        -- 来源链接
    source_name     TEXT,                        -- 来源名称（如 "Bloomberg", "用户观察"）
    sentiment       TEXT,                        -- bullish | bearish | neutral | mixed
    importance      INTEGER DEFAULT 3,           -- 1-5，5 最重要
    tags            TEXT DEFAULT '[]',           -- JSON 数组
    is_processed    INTEGER DEFAULT 0,           -- 是否已提炼为 Thesis
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE SET NULL
);

CREATE INDEX idx_research_instrument ON research_item(instrument_id);
CREATE INDEX idx_research_processed ON research_item(is_processed);
CREATE INDEX idx_research_created ON research_item(created_at);

-- ------------------------------------------------------------
-- 3. Thesis（投资论点）
-- 从 ResearchItem 提炼的可辩论命题
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thesis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id   INTEGER NOT NULL,
    thesis_type     TEXT NOT NULL DEFAULT 'bull', -- bull | bear | base
    title           TEXT NOT NULL,                -- 一句话论点
    description     TEXT,                         -- 详细描述
    key_assumptions TEXT DEFAULT '[]',            -- JSON：关键假设列表
    falsification   TEXT,                         -- 证伪条件：什么情况下此论点不再成立
    confidence      INTEGER DEFAULT 50,           -- 0-100 置信度
    time_horizon    TEXT,                         -- short(<1m) | medium(1-6m) | long(>6m)
    status          TEXT DEFAULT 'active',        -- active | validated | invalidated | expired | paused
    invalidated_reason TEXT,                      -- 被证伪时的原因
    version         INTEGER DEFAULT 1,            -- 版本号，每次重大更新+1
    parent_thesis_id INTEGER,                     -- 如果是迭代版本，指向前一版
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_thesis_id) REFERENCES thesis(id) ON DELETE SET NULL
);

CREATE INDEX idx_thesis_instrument ON thesis(instrument_id);
CREATE INDEX idx_thesis_status ON thesis(status);

-- ------------------------------------------------------------
-- 3a. Thesis ↔ ResearchItem 关联表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thesis_research (
    thesis_id       INTEGER NOT NULL,
    research_item_id INTEGER NOT NULL,
    relationship    TEXT DEFAULT 'supports',      -- supports | contradicts | context
    PRIMARY KEY (thesis_id, research_item_id),
    FOREIGN KEY (thesis_id) REFERENCES thesis(id) ON DELETE CASCADE,
    FOREIGN KEY (research_item_id) REFERENCES research_item(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 3b. ThesisDependency（论点依赖关系）
-- 追踪论点之间的逻辑依赖
-- 例如：NVDA看多论点 依赖于 "AI资本开支持续增长" 宏观论点
-- 当父论点被证伪时，所有子论点应被标记 review
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thesis_dependency (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    child_thesis_id  INTEGER NOT NULL,            -- 依赖方（如个股论点）
    parent_thesis_id INTEGER NOT NULL,            -- 被依赖方（如宏观论点）
    dependency_type  TEXT DEFAULT 'requires',     -- requires | supports | contradicts
    strength         TEXT DEFAULT 'strong',       -- strong | moderate | weak
    notes            TEXT,
    created_at       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (child_thesis_id) REFERENCES thesis(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_thesis_id) REFERENCES thesis(id) ON DELETE CASCADE,
    UNIQUE(child_thesis_id, parent_thesis_id)
);

CREATE INDEX idx_dep_child ON thesis_dependency(child_thesis_id);
CREATE INDEX idx_dep_parent ON thesis_dependency(parent_thesis_id);

-- ------------------------------------------------------------
-- 4. Trigger（触发器 / 信号条件）
-- 定义"什么条件下提醒用户"
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trigger_rule (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id   INTEGER,                     -- 可为 NULL（宏观触发器）
    thesis_id       INTEGER,                     -- 关联论点（可选）
    name            TEXT NOT NULL,                -- 触发器名称
    trigger_type    TEXT NOT NULL,                -- price | fundamental | technical | news | time | custom
    condition_json  TEXT NOT NULL,                -- JSON 格式的条件定义
    priority        TEXT DEFAULT 'normal',        -- low | normal | high | urgent
    action_hint     TEXT,                         -- 触发后建议的操作
    status          TEXT DEFAULT 'active',        -- active | paused | fired | expired
    last_checked_at TEXT,
    fired_at        TEXT,
    expires_at      TEXT,                         -- 过期时间
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    FOREIGN KEY (thesis_id) REFERENCES thesis(id) ON DELETE SET NULL
);

CREATE INDEX idx_trigger_status ON trigger_rule(status);
CREATE INDEX idx_trigger_instrument ON trigger_rule(instrument_id);

-- ------------------------------------------------------------
-- 5. Account（交易账户）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,                -- 账户名称，如 "IBKR主账户", "Wealthsimple TFSA"
    broker          TEXT,                         -- 券商名称
    account_type    TEXT DEFAULT 'individual',    -- individual | tfsa | rrsp | margin | crypto
    currency        TEXT DEFAULT 'USD',
    initial_balance REAL,                         -- 初始资金
    current_balance REAL,                         -- 当前余额（定期更新）
    cash_available  REAL,                         -- 可用现金
    sync_method     TEXT DEFAULT 'manual',        -- manual | api | screenshot
    sync_config     TEXT,                         -- JSON：API key 等配置（加密存储）
    last_synced_at  TEXT,
    status          TEXT DEFAULT 'active',        -- active | inactive | closed
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- 6. Position（持仓）
-- 持仓是事实，代表当前持有量
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS position (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    instrument_id   INTEGER NOT NULL,
    total_quantity  REAL NOT NULL DEFAULT 0,      -- 总持有数量
    avg_cost        REAL,                         -- 平均成本
    current_price   REAL,                         -- 最新价格
    market_value    REAL,                         -- 当前市值
    unrealized_pnl  REAL,                         -- 未实现盈亏
    unrealized_pnl_pct REAL,                      -- 未实现盈亏百分比
    weight_pct      REAL,                         -- 占账户总值的比例
    sector_weight   REAL,                         -- 所在行业占账户总值的比例
    price_updated_at TEXT,                        -- 价格更新时间
    sync_source     TEXT DEFAULT 'manual',        -- manual | api | screenshot | import
    status          TEXT DEFAULT 'open',          -- open | closed | pending
    opened_at       TEXT,
    closed_at       TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE(account_id, instrument_id)
);

CREATE INDEX idx_position_account ON position(account_id);
CREATE INDEX idx_position_instrument ON position(instrument_id);
CREATE INDEX idx_position_status ON position(status);

-- ------------------------------------------------------------
-- 6a. Lot（交易批次）
-- 每笔买入/卖出是一个独立的 lot
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lot (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id     INTEGER NOT NULL,
    quantity        REAL NOT NULL,                -- 正数=买入，负数=卖出
    price           REAL NOT NULL,                -- 成交价格
    commission      REAL DEFAULT 0,               -- 手续费
    trade_date      TEXT NOT NULL,                -- 成交日期
    trade_time      TEXT,                         -- 成交时间
    order_type      TEXT,                         -- market | limit | stop | stop_limit
    notes           TEXT,
    provenance_id   INTEGER,                      -- 数据来源
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (position_id) REFERENCES position(id) ON DELETE CASCADE,
    FOREIGN KEY (provenance_id) REFERENCES provenance(id) ON DELETE SET NULL
);

CREATE INDEX idx_lot_position ON lot(position_id);
CREATE INDEX idx_lot_date ON lot(trade_date);

-- ------------------------------------------------------------
-- 7. TradePlan（交易计划）
-- 每个 position 可以有多个 plan，对应不同的交易逻辑
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_plan (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id     INTEGER,                     -- 可为 NULL（计划阶段，尚未建仓）
    instrument_id   INTEGER NOT NULL,
    thesis_id       INTEGER,                     -- 基于哪个投资论点
    name            TEXT NOT NULL,                -- 计划名称
    plan_type       TEXT DEFAULT 'trend',         -- trend | event | swing | hedge | income
    direction       TEXT DEFAULT 'long',          -- long | short
    entry_strategy  TEXT,                         -- JSON：分批建仓规则
    target_quantity REAL,                         -- 目标总数量
    target_weight_pct REAL,                       -- 目标占账户比例
    stop_loss_price REAL,                         -- 止损价（基于ATR动态计算）
    stop_loss_pct   REAL,                         -- 止损百分比
    take_profit_price REAL,                       -- 移动止盈触发价
    take_profit_pct REAL,                         -- 移动止盈回撤幅度
    max_risk_pct    REAL,                         -- 此计划对总资金的最大风险
    exit_conditions TEXT DEFAULT '[]',            -- JSON：退出条件列表
    time_limit      TEXT,                         -- 最晚退出日期
    status          TEXT DEFAULT 'draft',         -- draft | pending | active | partial | closed | cancelled
    status_reason   TEXT,                         -- 状态变更原因
    priority        INTEGER DEFAULT 3,            -- 1-5
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    closed_at       TEXT,
    FOREIGN KEY (position_id) REFERENCES position(id) ON DELETE SET NULL,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    FOREIGN KEY (thesis_id) REFERENCES thesis(id) ON DELETE SET NULL
);

CREATE INDEX idx_plan_position ON trade_plan(position_id);
CREATE INDEX idx_plan_instrument ON trade_plan(instrument_id);
CREATE INDEX idx_plan_status ON trade_plan(status);

-- ------------------------------------------------------------
-- 7a. PlanAllocation（计划分配）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_allocation (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_plan_id   INTEGER NOT NULL,
    position_id     INTEGER NOT NULL,
    allocated_qty   REAL NOT NULL,                -- 分配给此计划的数量
    allocated_at    TEXT DEFAULT (datetime('now')),
    notes           TEXT,
    FOREIGN KEY (trade_plan_id) REFERENCES trade_plan(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES position(id) ON DELETE CASCADE
);

CREATE INDEX idx_alloc_plan ON plan_allocation(trade_plan_id);
CREATE INDEX idx_alloc_position ON plan_allocation(position_id);

-- ------------------------------------------------------------
-- 8. Alert（提醒）
-- Trigger 命中后生成的提醒
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_id      INTEGER,
    instrument_id   INTEGER,
    alert_type      TEXT NOT NULL,                -- trigger_fired | risk_warning | compliance | review_needed | system
    priority        TEXT DEFAULT 'normal',        -- low | normal | high | urgent
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    suggested_action TEXT,
    data_json       TEXT,
    status          TEXT DEFAULT 'pending',       -- pending | sent | acknowledged | acted_on | dismissed
    sent_at         TEXT,
    acknowledged_at TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (trigger_id) REFERENCES trigger_rule(id) ON DELETE SET NULL,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE SET NULL
);

CREATE INDEX idx_alert_status ON alert(status);
CREATE INDEX idx_alert_priority ON alert(priority);
CREATE INDEX idx_alert_created ON alert(created_at);

-- ------------------------------------------------------------
-- 9. Rule（交易宪法 / 纪律规则）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rule (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category        TEXT NOT NULL,                -- position_sizing | entry | exit | risk | discipline | mindset
    subcategory     TEXT,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    rule_type       TEXT DEFAULT 'hard',          -- hard（违反即阻断）| soft（警告但不阻断）
    check_type      TEXT DEFAULT 'automated',     -- automated | manual_review | reminder | scoring
    condition_json  TEXT,                         -- JSON：可自动检查的条件
    parameters      TEXT DEFAULT '{}',            -- JSON：规则参数
    consequence     TEXT,                         -- 违反后的后果/操作
    is_active       INTEGER DEFAULT 1,
    source          TEXT DEFAULT 'constitution',  -- constitution | user_added | system
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_rule_category ON rule(category);
CREATE INDEX idx_rule_type ON rule(rule_type);

-- ------------------------------------------------------------
-- 10. EventLog（事件日志）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type      TEXT NOT NULL,                -- create | update | delete | alert | check | decision | sync
    entity_type     TEXT NOT NULL,                -- instrument | position | trade_plan | thesis | ...
    entity_id       INTEGER,
    actor           TEXT DEFAULT 'user',          -- user | system | agent | api
    action          TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    reason          TEXT,
    metadata        TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_event_type ON event_log(event_type);
CREATE INDEX idx_event_entity ON event_log(entity_type, entity_id);
CREATE INDEX idx_event_created ON event_log(created_at);

-- ------------------------------------------------------------
-- 11. Provenance（数据溯源）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provenance (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type     TEXT NOT NULL,                -- user_input | api | screenshot_ocr | web_scrape | file_import | agent_analysis
    source_name     TEXT,
    source_url      TEXT,
    source_hash     TEXT,
    reliability     INTEGER DEFAULT 3,            -- 1-5 可信度
    fetched_at      TEXT DEFAULT (datetime('now')),
    raw_content     TEXT,
    notes           TEXT
);

-- ------------------------------------------------------------
-- 12. JournalEntry（交易日志 / 复盘）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entry (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_type      TEXT NOT NULL DEFAULT 'reflection', -- trade_log | reflection | market_note | strategy_review | weekly_review
    title           TEXT,
    content         TEXT NOT NULL,
    related_instruments TEXT DEFAULT '[]',
    related_plans   TEXT DEFAULT '[]',
    lessons         TEXT DEFAULT '[]',
    mood            TEXT,                         -- confident | cautious | anxious | neutral | euphoric
    tags            TEXT DEFAULT '[]',
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_journal_type ON journal_entry(entry_type);
CREATE INDEX idx_journal_created ON journal_entry(created_at);

-- ------------------------------------------------------------
-- 13. DataFeed（数据抓取计划）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_feed (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id   INTEGER,
    feed_type       TEXT NOT NULL,                -- price | earnings | news | filing | sentiment | macro
    source          TEXT NOT NULL,                -- yahoo | alphavantage | finnhub | newsapi | custom
    schedule        TEXT DEFAULT 'daily',         -- realtime | hourly | daily | weekly | on_event
    config_json     TEXT,
    is_active       INTEGER DEFAULT 1,
    last_run_at     TEXT,
    next_run_at     TEXT,
    error_count     INTEGER DEFAULT 0,
    last_error      TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 14. AccountSnapshot（账户每日快照）
-- 每个交易日收盘后记录一次账户整体状态
-- 用途：净值曲线、回撤计算、历史回溯
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_snapshot (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    snapshot_date   TEXT NOT NULL,                -- YYYY-MM-DD
    total_equity    REAL,
    cash_balance    REAL,
    market_value    REAL,
    unrealized_pnl  REAL,
    realized_pnl_day REAL,
    total_position_pct REAL,
    cash_pct        REAL,
    mtm_pnl         REAL,                         -- Mark to Market 当日盈亏
    portfolio_beta   REAL,                         -- 组合整体对SPX的加权beta
    stress_test_2022 REAL,                         -- 若2022年重演，预估组合跌幅%
    source          TEXT DEFAULT 'manual',         -- manual | ibkr_report | api
    provenance_id   INTEGER,
    raw_data        TEXT,                          -- JSON：原始报告的完整解析数据
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    FOREIGN KEY (provenance_id) REFERENCES provenance(id) ON DELETE SET NULL,
    UNIQUE(account_id, snapshot_date)
);

CREATE INDEX idx_acct_snap_date ON account_snapshot(snapshot_date);
CREATE INDEX idx_acct_snap_account ON account_snapshot(account_id);

-- ------------------------------------------------------------
-- 15. PositionSnapshot（持仓每日快照）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS position_snapshot (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    instrument_id   INTEGER NOT NULL,
    snapshot_date   TEXT NOT NULL,
    quantity        REAL NOT NULL,
    avg_cost        REAL,
    close_price     REAL,
    market_value    REAL,
    unrealized_pnl  REAL,
    unrealized_pnl_pct REAL,
    weight_pct      REAL,
    day_pnl         REAL,
    day_pnl_pct     REAL,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE(account_id, instrument_id, snapshot_date)
);

CREATE INDEX idx_pos_snap_date ON position_snapshot(snapshot_date);
CREATE INDEX idx_pos_snap_instrument ON position_snapshot(instrument_id);

-- ------------------------------------------------------------
-- 16. InstrumentVolatility（标的波动率数据）
-- 用于动态止损计算、仓位管理、相对强度评估
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instrument_volatility (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id   INTEGER NOT NULL,
    calc_date       TEXT NOT NULL,
    atr_14          REAL,                         -- 14日ATR
    atr_20          REAL,                         -- 20日ATR
    daily_vol_20    REAL,                         -- 20日日波动率（标准差）
    daily_vol_60    REAL,                         -- 60日日波动率
    beta_spx        REAL,                         -- 对SPX的beta
    avg_daily_range_pct REAL,                     -- 平均日内振幅百分比
    rs_vs_spx_20    REAL,                         -- 20日相对强度 vs SPX（>1=跑赢大盘）
    rs_vs_spx_60    REAL,                         -- 60日相对强度 vs SPX
    volume_ratio_20 REAL,                         -- 当前成交量 / 20日均量（>1.5=放量）
    volatility_regime TEXT DEFAULT 'normal',      -- low | normal | high | extreme
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE(instrument_id, calc_date)
);

CREATE INDEX idx_vol_instrument ON instrument_volatility(instrument_id);
CREATE INDEX idx_vol_date ON instrument_volatility(calc_date);

-- ------------------------------------------------------------
-- 17. CorrelationRecord（持仓相关性记录）
-- 追踪持仓间实际相关性，防止虚假分散
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS correlation_record (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_a_id INTEGER NOT NULL,
    instrument_b_id INTEGER NOT NULL,
    calc_date       TEXT NOT NULL,
    period_days     INTEGER DEFAULT 60,
    correlation     REAL NOT NULL,                -- -1 到 +1
    correlation_regime TEXT,                      -- low(<0.3) | moderate(0.3-0.6) | high(0.6-0.8) | extreme(>0.8)
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_a_id) REFERENCES instrument(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_b_id) REFERENCES instrument(id) ON DELETE CASCADE,
    UNIQUE(instrument_a_id, instrument_b_id, calc_date, period_days)
);

CREATE INDEX idx_corr_date ON correlation_record(calc_date);

-- ------------------------------------------------------------
-- 18. PerformanceAttribution（绩效归因）
-- 定期分解：收益来自选股alpha、行业beta、还是大盘涨跌
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performance_attribution (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    period_start    TEXT NOT NULL,
    period_end      TEXT NOT NULL,
    period_type     TEXT DEFAULT 'monthly',       -- weekly | monthly | quarterly
    total_return_pct REAL,
    benchmark_return_pct REAL,                    -- 基准收益率（SPX）
    market_contribution_pct REAL,
    sector_contribution_pct REAL,
    stock_selection_pct REAL,                     -- alpha
    timing_contribution_pct REAL,
    cash_drag_pct   REAL,
    sharpe_ratio    REAL,
    max_drawdown_pct REAL,
    win_rate_pct    REAL,
    profit_factor   REAL,
    avg_win_pct     REAL,
    avg_loss_pct    REAL,
    rules_checked   INTEGER,
    rules_violated  INTEGER,
    overrides_count INTEGER,
    data_json       TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);

CREATE INDEX idx_attr_period ON performance_attribution(period_start, period_end);

-- ------------------------------------------------------------
-- 19. BehaviorMetric（交易行为统计）
-- 追踪交易行为模式，用于情绪化交易检测
-- 不靠关键词匹配，而是靠行为偏离基线
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS behavior_metric (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id      INTEGER NOT NULL,
    metric_date     TEXT NOT NULL,
    trades_count    INTEGER DEFAULT 0,
    messages_count  INTEGER DEFAULT 0,
    avg_trade_size_pct REAL,
    max_trade_size_pct REAL,
    time_to_decision_minutes REAL,
    post_loss_trade_count INTEGER DEFAULT 0,      -- 亏损后立刻开新仓的次数
    override_count  INTEGER DEFAULT 0,            -- 当日 override hard rule 的次数
    frequency_zscore REAL,                        -- 交易频率相对历史基线的 z-score
    size_zscore     REAL,                         -- 交易规模相对基线的 z-score
    emotional_flag  INTEGER DEFAULT 0,            -- 0=正常 1=可能情绪化 2=确认情绪化
    flag_reason     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    UNIQUE(account_id, metric_date)
);

CREATE INDEX idx_behavior_date ON behavior_metric(metric_date);

-- ------------------------------------------------------------
-- 20. MarketState（市场状态评估）
-- 记录宏观市场环境，用于动态调整风控参数
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_state (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    state_date      TEXT NOT NULL,
    spx_price       REAL,
    spx_above_ma20  INTEGER,                      -- 1=是 0=否
    spx_above_ma50  INTEGER,
    spx_above_ma200 INTEGER,
    vix_level       REAL,
    vix_regime      TEXT DEFAULT 'normal',         -- low(<15) | normal(15-20) | elevated(20-30) | high(30-40) | extreme(>40)
    market_regime   TEXT DEFAULT 'neutral',        -- strong_bull | bull | neutral | bear | strong_bear | crisis
    recommended_cash_pct REAL,
    recommended_max_position_pct REAL,
    recommended_new_position_max_pct REAL,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(state_date)
);

CREATE INDEX idx_market_date ON market_state(state_date);

-- ------------------------------------------------------------
-- 21. NoTradeWindow（禁止交易窗口）
-- 系统性定义"什么时候什么都不做"
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS no_trade_window (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    window_type     TEXT NOT NULL,                -- earnings | fomc | opex | tax_selling | low_vol | custom
    name            TEXT NOT NULL,
    start_date      TEXT NOT NULL,
    end_date        TEXT NOT NULL,
    instrument_id   INTEGER,                      -- NULL=全局窗口, 有值=仅针对该标的
    severity        TEXT DEFAULT 'hard',          -- hard=禁止所有新仓 | soft=仅警告
    reason          TEXT,
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE
);

CREATE INDEX idx_ntw_dates ON no_trade_window(start_date, end_date);

-- ------------------------------------------------------------
-- 22. EntryScore（建仓条件评分记录）
-- 用加权评分制替代 all-or-nothing 的技术面检查
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entry_score (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_plan_id   INTEGER,
    instrument_id   INTEGER NOT NULL,
    score_date      TEXT NOT NULL,
    pass_hard_rules INTEGER DEFAULT 0,            -- 1=通过 0=未通过
    hard_rule_failures TEXT DEFAULT '[]',          -- JSON: 未通过的 hard rule id 列表
    score_ma50_trend INTEGER DEFAULT 0,           -- 0-15
    score_ma_cross   INTEGER DEFAULT 0,           -- 0-10
    score_rsi_range  INTEGER DEFAULT 0,           -- 0-10
    score_volume_confirm INTEGER DEFAULT 0,       -- 0-20
    score_relative_strength INTEGER DEFAULT 0,    -- 0-20
    score_market_regime INTEGER DEFAULT 0,        -- 0-15
    score_thesis_quality INTEGER DEFAULT 0,       -- 0-10
    total_score     INTEGER DEFAULT 0,            -- 加权总分（满分100）
    decision        TEXT,                          -- full_position | half_position | quarter_position | reject
    decision_reason TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (trade_plan_id) REFERENCES trade_plan(id) ON DELETE SET NULL,
    FOREIGN KEY (instrument_id) REFERENCES instrument(id) ON DELETE CASCADE
);

CREATE INDEX idx_entry_score_date ON entry_score(score_date);
CREATE INDEX idx_entry_score_instrument ON entry_score(instrument_id);

-- ============================================================
-- 视图
-- ============================================================

-- 视图：未覆盖持仓（需要重点关注）
CREATE VIEW IF NOT EXISTS v_unallocated_positions AS
SELECT
    p.id AS position_id,
    i.symbol,
    a.name AS account_name,
    p.total_quantity,
    COALESCE(SUM(pa.allocated_qty), 0) AS allocated_quantity,
    p.total_quantity - COALESCE(SUM(pa.allocated_qty), 0) AS unallocated_quantity
FROM position p
JOIN instrument i ON p.instrument_id = i.id
JOIN account a ON p.account_id = a.id
LEFT JOIN plan_allocation pa ON pa.position_id = p.id
WHERE p.status = 'open'
GROUP BY p.id
HAVING unallocated_quantity > 0;

-- 视图：仓位概览
CREATE VIEW IF NOT EXISTS v_portfolio_summary AS
SELECT
    a.name AS account_name,
    i.symbol,
    i.sector,
    p.total_quantity,
    p.avg_cost,
    p.current_price,
    p.market_value,
    p.unrealized_pnl,
    p.unrealized_pnl_pct,
    p.weight_pct,
    COUNT(tp.id) AS plan_count,
    GROUP_CONCAT(tp.name, ' | ') AS plan_names
FROM position p
JOIN instrument i ON p.instrument_id = i.id
JOIN account a ON p.account_id = a.id
LEFT JOIN trade_plan tp ON tp.position_id = p.id AND tp.status IN ('active', 'partial')
WHERE p.status = 'open'
GROUP BY p.id
ORDER BY p.market_value DESC;

-- 视图：行业集中度
CREATE VIEW IF NOT EXISTS v_sector_exposure AS
SELECT
    i.sector,
    COUNT(DISTINCT i.id) AS stock_count,
    SUM(p.market_value) AS total_value,
    ROUND(SUM(p.weight_pct), 2) AS total_weight_pct
FROM position p
JOIN instrument i ON p.instrument_id = i.id
WHERE p.status = 'open' AND i.sector IS NOT NULL
GROUP BY i.sector
ORDER BY total_value DESC;

-- 视图：活跃提醒
CREATE VIEW IF NOT EXISTS v_active_alerts AS
SELECT
    a.id, a.priority, a.title, a.message, a.suggested_action, a.alert_type,
    i.symbol, a.created_at
FROM alert a
LEFT JOIN instrument i ON a.instrument_id = i.id
WHERE a.status IN ('pending', 'sent')
ORDER BY
    CASE a.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
    a.created_at DESC;

-- 视图：高相关性持仓对（风险集中警告）
CREATE VIEW IF NOT EXISTS v_high_correlation_pairs AS
SELECT
    cr.calc_date, ia.symbol AS symbol_a, ib.symbol AS symbol_b,
    cr.correlation, cr.correlation_regime,
    pa.weight_pct AS weight_a_pct, pb.weight_pct AS weight_b_pct,
    COALESCE(pa.weight_pct, 0) + COALESCE(pb.weight_pct, 0) AS combined_weight_pct
FROM correlation_record cr
JOIN instrument ia ON cr.instrument_a_id = ia.id
JOIN instrument ib ON cr.instrument_b_id = ib.id
LEFT JOIN position pa ON pa.instrument_id = ia.id AND pa.status = 'open'
LEFT JOIN position pb ON pb.instrument_id = ib.id AND pb.status = 'open'
WHERE cr.correlation > 0.7
AND cr.calc_date = (SELECT MAX(calc_date) FROM correlation_record)
ORDER BY cr.correlation DESC;

-- 视图：论点依赖链告警
CREATE VIEW IF NOT EXISTS v_thesis_dependency_alerts AS
SELECT
    td.id AS dependency_id,
    pt.id AS parent_thesis_id, pt.title AS parent_title, pt.status AS parent_status,
    ct.id AS child_thesis_id, ct.title AS child_title, ct.status AS child_status,
    i.symbol AS child_instrument, td.dependency_type, td.strength
FROM thesis_dependency td
JOIN thesis pt ON td.parent_thesis_id = pt.id
JOIN thesis ct ON td.child_thesis_id = ct.id
JOIN instrument i ON ct.instrument_id = i.id
WHERE pt.status = 'invalidated' AND ct.status = 'active'
ORDER BY td.strength DESC;

-- 视图：行为异常检测
CREATE VIEW IF NOT EXISTS v_behavior_alerts AS
SELECT
    bm.metric_date, bm.trades_count, bm.frequency_zscore, bm.size_zscore,
    bm.post_loss_trade_count, bm.override_count, bm.emotional_flag, bm.flag_reason,
    CASE
        WHEN bm.frequency_zscore > 2 THEN '交易频率异常偏高'
        WHEN bm.size_zscore > 2 THEN '交易规模异常偏大'
        WHEN bm.post_loss_trade_count >= 2 THEN '亏损后连续开仓'
        WHEN bm.override_count >= 2 THEN '频繁 override 规则'
        ELSE '正常'
    END AS alert_summary
FROM behavior_metric bm
WHERE bm.frequency_zscore > 2 OR bm.size_zscore > 2
   OR bm.post_loss_trade_count >= 2 OR bm.override_count >= 2
ORDER BY bm.metric_date DESC;

-- 视图：账户净值曲线数据
CREATE VIEW IF NOT EXISTS v_equity_curve AS
SELECT
    s.snapshot_date, s.total_equity, s.cash_balance, s.market_value,
    s.total_position_pct, s.cash_pct, s.mtm_pnl, s.portfolio_beta,
    ms.vix_level, ms.market_regime
FROM account_snapshot s
LEFT JOIN market_state ms ON s.snapshot_date = ms.state_date
ORDER BY s.snapshot_date ASC;
```

---

## 第四部分：交易宪法（初始规则数据）

在数据库创建后，立即插入以下规则。这些是交易纪律的编码化实现，系统必须执行。

### 4.1 设计原则

- **止损**：基于标的波动率（ATR），而非固定百分比。不同股票有不同的止损距离
- **止盈**：使用移动止盈（trailing stop），让利润奔跑，而非在固定盈利目标处退出
- **仓位上限**：根据市场状态动态调整，牛市可以更激进，熊市必须更保守
- **现金比例**：与 VIX 水平和市场趋势挂钩
- **建仓条件**：加权评分制，而非要求所有条件同时满足

### 4.2 规则插入 SQL

```sql
-- ============================================================
-- 交易宪法规则
-- ============================================================

-- === 仓位管理规则（Hard Rules） ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'total', '动态总仓位上限',
 '总仓位上限根据市场状态动态调整：强牛市最高90%，正常市场80%，熊市60%，危机40%。查看 market_state 表获取当日 recommended_max_position_pct',
 'hard', 'automated',
 '{"check":"total_position_pct","op":"<=","value":"dynamic","source":"market_state.recommended_max_position_pct"}',
 '{"default_max_pct":80,"bull_max_pct":90,"bear_max_pct":60,"crisis_max_pct":40}',
 '阻断新建仓操作，提醒用户先减仓或等待市场状态改善',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'single_stock', '单股仓位上限',
 '单只股票不超过总资金的15%。如果conviction极高且有完整thesis+plan覆盖，用户可override到20%',
 'hard', 'automated',
 '{"check":"single_stock_pct","op":"<=","value":15}',
 '{"max_pct":15,"override_max_pct":20,"override_requires":"active_thesis AND active_plan"}',
 '阻断该股票的加仓操作',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'sector', '行业集中度上限',
 '单一行业不超过总资金的25%。注意：行业标签只是粗略分类，真正的集中度要看 correlation_record',
 'hard', 'automated',
 '{"check":"sector_pct","op":"<=","value":25}',
 '{"max_pct":25}',
 '阻断该行业的新建仓操作',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'correlation_cluster', '高相关性集中度上限',
 '相关系数>0.7的持仓对，合计权重不超过25%。这比纯行业分类更准确地衡量真实集中度',
 'hard', 'automated',
 '{"check":"correlated_pair_combined_weight","correlation_threshold":0.7,"op":"<=","value":25}',
 '{"max_combined_pct":25,"correlation_threshold":0.7}',
 '提醒用户存在虚假分散风险，建议减持其中一只',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'new_position', '新开仓限制',
 '新开仓首批最多占总资金的5%，该笔交易的最大风险（到止损位的亏损）在总资金1%以内',
 'hard', 'automated',
 '{"check":"new_position_pct","op":"<=","value":5}',
 '{"max_pct":5,"max_risk_pct":1}',
 '缩减开仓规模或取消',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('position_sizing', 'leverage', '禁止杠杆',
 '不使用任何杠杆',
 'hard', 'automated',
 '{"check":"leverage_ratio","op":"<=","value":1}',
 '{"max_leverage":1}',
 '阻断任何杠杆操作',
 'constitution');

-- === 建仓规则（Hard Rules） ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'earnings', '财报前不开仓',
 '财报发布前一天不开新仓',
 'hard', 'automated',
 '{"check":"days_to_earnings","op":">","value":1}',
 '{}',
 '等待财报发布后再操作',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'fed', '联储议息前不开仓',
 '联储议息前24小时不开新仓',
 'hard', 'automated',
 '{"check":"hours_to_fomc","op":">","value":24}',
 '{}',
 '等待议息结果后再操作',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'market_trend', '大盘趋势确认',
 '大盘（SPX）须处于20日均线上方',
 'hard', 'manual_review',
 '{"check":"spx_above_ma","ma":20}',
 '{}',
 '暂停新建仓，等待大盘企稳',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'thesis_required', '论点覆盖',
 '每笔新建仓必须关联至少一个active状态的thesis。没有投资论点的交易禁止执行',
 'hard', 'automated',
 '{"check":"has_active_thesis","op":"==","value":true}',
 '{}',
 '要求用户先建立投资论点再交易',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'liquidity', '流动性准入门槛',
 '不交易日均成交额低于100万美元的标的。止损是建立在"能卖得掉"的前提上——流动性不足时止损是一句空话',
 'hard', 'automated',
 '{"check":"avg_daily_dollar_volume","op":">=","value":1000000}',
 '{"min_daily_dollar_volume":1000000}',
 '阻断建仓，提醒用户该标的流动性不足',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'no_trade_window', '禁止交易窗口',
 '以下时段禁止或限制新建仓：财报前1日(per instrument)、FOMC前24h(全局)、季度期权到期周的周三-周五(全局, soft)、12月最后两周税务卖压期(全局, soft)、VIX极低期(<12,全局, soft)',
 'hard', 'automated',
 '{"check":"no_trade_window","source":"no_trade_window_table"}',
 '{}',
 '阻断或警告新建仓。提示用户当前处于交易窗口限制期及原因',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'price_limit', '限价单控制',
 '挂单价格不超过前日收盘价1.5%',
 'soft', 'manual_review',
 '{"check":"order_price_premium","op":"<=","value":1.5}',
 '{"max_premium_pct":1.5}',
 '提醒用户避免追高',
 'constitution');

-- === 技术面建仓条件（评分子项，非独立阻断） ===
-- 这些条件通过 entry_score 评分制综合评估，不再逐条单独阻断

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'technical_ma50', 'MA50趋势（评分子项）',
 '股价位于50日均线上方，且均线呈上升趋势。在评分制中占15分',
 'soft', 'scoring',
 '{"check":"price_above_ma","ma":50,"trend":"up","max_score":15}',
 '{}',
 '评分子项：影响 entry_score.score_ma50_trend',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'technical_ma_cross', '短期均线排列（评分子项）',
 '3日均线位于5日均线上方。在评分制中占10分',
 'soft', 'scoring',
 '{"check":"ma_cross","fast":3,"slow":5,"direction":"above","max_score":10}',
 '{}',
 '评分子项：影响 entry_score.score_ma_cross',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'technical_rsi', 'RSI区间（评分子项）',
 'RSI介于30-70为满分10分，极端区间减分',
 'soft', 'scoring',
 '{"check":"rsi_range","min":30,"max":70,"max_score":10}',
 '{}',
 '评分子项：影响 entry_score.score_rsi_range',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'volume_confirm', '成交量确认（评分子项）',
 '建仓时需成交量配合：突破建仓要求放量(volume_ratio_20>1.5)，回调建仓要求缩量(volume_ratio_20<0.7)。无量突破大概率是假突破。在评分制中占20分',
 'soft', 'scoring',
 '{"check":"volume_confirmation","breakout_min_ratio":1.5,"pullback_max_ratio":0.7,"max_score":20}',
 '{}',
 '评分子项：影响 entry_score.score_volume_confirm',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('entry', 'relative_strength', '相对强度（评分子项）',
 '做多时，标的20日相对强度(rs_vs_spx_20)应>1.0。真正的强势股在大盘回调时跌得少。在评分制中占20分',
 'soft', 'scoring',
 '{"check":"rs_vs_spx","period":20,"op":">=","value":1.0,"max_score":20}',
 '{}',
 '评分子项：影响 entry_score.score_relative_strength',
 'constitution');

-- === 卖出 / 风控规则 ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('exit', 'dynamic_stop_loss', '动态止损线',
 '止损基于标的波动率而非固定百分比。默认止损位 = 建仓价 - 2×ATR(14)。低波动标的止损更紧，高波动标的止损更宽。若 instrument_volatility 无数据，回退到固定7%',
 'hard', 'automated',
 '{"check":"dynamic_stop_loss","method":"atr_multiple","atr_period":14,"atr_multiple":2,"fallback_pct":-7}',
 '{"atr_multiple":2,"atr_period":14,"fallback_pct":-7,"min_stop_pct":-3,"max_stop_pct":-15}',
 '立即生成卖出提醒。止损位随ATR更新但只能收紧不能放宽（棘轮机制）',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('exit', 'trailing_take_profit', '移动止盈',
 '从历史最高价回撤超过 2×ATR(14) 或 回撤15%（取较大者）时触发减仓信号。让利润奔跑，只在趋势反转时退出',
 'soft', 'automated',
 '{"check":"trailing_stop","method":"max_of_atr_and_pct","atr_period":14,"atr_multiple":2,"fallback_pct":15}',
 '{"atr_multiple":2,"min_trailing_pct":10,"max_trailing_pct":25}',
 '建议分批减仓（先减1/3），剩余继续持有并收紧 trailing stop',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('exit', 'thesis_invalidated', '论点失效退出',
 '当持仓关联的所有active thesis都变为invalidated时，必须在5个交易日内完全退出',
 'hard', 'automated',
 '{"check":"all_thesis_invalidated","op":"==","value":false}',
 '{"exit_deadline_days":5}',
 '立即生成退出提醒，设置5日倒计时',
 'constitution');

-- === 组合风险规则 ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('risk', 'beta_exposure', 'Beta暴露上限',
 '组合加权Beta不应超过1.5。如果全是高Beta股，大盘跌5%你可能跌8-10%',
 'soft', 'automated',
 '{"check":"portfolio_beta","op":"<=","value":1.5}',
 '{"max_beta":1.5,"warning_beta":1.3}',
 '警告组合对大盘暴露过高，建议增加低Beta或防御性持仓',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('risk', 'stress_test', '压力测试意识',
 '每月至少做一次压力测试：如果2022年重演（SPX跌25%），当前组合预估跌多少？如果预估跌幅>35%，发出警告',
 'soft', 'automated',
 '{"check":"stress_test_2022","op":">=","value":-35}',
 '{"max_stress_loss_pct":-35}',
 '提醒用户组合在极端市场下风险过大，考虑减仓或对冲',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('risk', 'hedging_consideration', '期权对冲考量',
 '当满足以下条件时提醒用户考虑期权对冲：(a)组合总仓位>70%且beta>1.2, (b)VIX<15时保护成本低, (c)单只持仓浮盈>50%需锁定。当前框架不使用期权交易，但保留此入口供未来迭代',
 'soft', 'reminder',
 '{"check":"hedging_trigger","conditions":["high_exposure","low_vix_protection","large_unrealized_gain"]}',
 '{"position_threshold_pct":70,"beta_threshold":1.2,"vix_low_threshold":15,"gain_threshold_pct":50}',
 '提醒用户：当前暴露较高，如果未来开通期权功能，此处可以做保护',
 'constitution');

-- === 交易纪律规则 ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('discipline', 'consecutive_loss', '连续亏损暂停',
 '连续3笔交易亏损，暂停交易1周并反思',
 'hard', 'automated',
 '{"check":"consecutive_losses","op":"<","value":3}',
 '{"pause_days":7}',
 '暂停所有新建仓操作1周，生成策略反思任务',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('discipline', 'consecutive_win', '连续盈利冷却',
 '连续盈利3周后强制休息2天',
 'soft', 'automated',
 '{"check":"consecutive_winning_weeks","op":"<","value":3}',
 '{"cool_down_days":2}',
 '建议休息2天，防止过度自信',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('discipline', 'no_empty', '永不空仓',
 '保留对市场的参与感',
 'soft', 'manual_review',
 '{"check":"total_position_count","op":">","value":0}',
 '{}',
 '提醒用户至少保持最小仓位',
 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('discipline', 'behavior_anomaly', '行为异常检测',
 '当 behavior_metric 中的 frequency_zscore 或 size_zscore 超过2时，或 post_loss_trade_count >= 2 时，触发冷静提醒。不靠关键词匹配，靠行为偏离基线',
 'soft', 'automated',
 '{"check":"behavior_zscore","fields":["frequency_zscore","size_zscore"],"threshold":2}',
 '{"zscore_threshold":2,"post_loss_threshold":2}',
 '温和但坚定地提醒用户：检测到交易行为偏离正常模式，建议暂停并反思',
 'constitution');

-- === 心态管理规则（提醒型） ===

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('mindset', 'accept_loss', '接受不完美',
 '允许30%交易亏损，追求整体正期望值',
 'soft', 'reminder', NULL,
 '{"acceptable_loss_rate":30}',
 '定期复盘时提醒', 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('mindset', 'no_noise', '隔离噪音',
 '关闭财经媒体推送，专注自身交易系统',
 'soft', 'reminder', NULL, '{}',
 '当检测到用户情绪化交易时提醒', 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('mindset', 'no_mental_accounting', '杜绝心理账户',
 '账户就是账户，不要与生活消费挂钩',
 'soft', 'reminder', NULL, '{}',
 '当用户提到生活开支与交易关联时提醒', 'constitution');

INSERT INTO rule (category, subcategory, name, description, rule_type, check_type, condition_json, parameters, consequence, source) VALUES
('mindset', 'review_attribution', '定期归因',
 '每月必须生成绩效归因报告，回答"我的收益到底来自哪里"',
 'soft', 'reminder',
 '{"check":"days_since_last_attribution","op":"<","value":35}',
 '{"max_gap_days":35}',
 '生成归因报告任务', 'constitution');
```

### 4.3 动态参数计算逻辑

风控参数不再是常量，而是由 market_state 表驱动：

```
市场状态评估规则（每日更新 market_state 表）：

VIX 划分：
  < 15      → low
  15 - 20   → normal
  20 - 30   → elevated
  30 - 40   → high
  > 40      → extreme

市场趋势划分：
  SPX > MA200 且 MA50 > MA200  → strong_bull
  SPX > MA50 且 MA50 > MA200   → bull
  SPX > MA20                   → neutral
  SPX < MA20 且 SPX > MA200    → bear
  SPX < MA200                  → strong_bear
  VIX > 40 或 SPX 单周跌幅>5% → crisis

动态参数映射：
  strong_bull → 现金10%, 最大仓位90%, 新仓5%
  bull        → 现金15%, 最大仓位85%, 新仓5%
  neutral     → 现金20%, 最大仓位80%, 新仓5%
  bear        → 现金30%, 最大仓位60%, 新仓3%
  strong_bear → 现金40%, 最大仓位50%, 新仓2%
  crisis      → 现金50%, 最大仓位40%, 新仓0%（禁止新开仓）
```

### 4.4 动态止损计算逻辑

```
止损位计算（每个 trade_plan 创建时 + 每日更新）：

1. 获取标的的 ATR(14)
   - 从 instrument_volatility 表取最新值
   - 如果无数据，回退到固定7%

2. 计算初始止损位
   止损价 = 建仓均价 - 2 × ATR(14)
   止损百分比 = (止损价 - 建仓均价) / 建仓均价

3. 安全边界
   - 止损百分比不得窄于 -3%（防止过于敏感）
   - 止损百分比不得宽于 -15%（防止风险过大）

4. 棘轮机制
   - 止损位只能收紧，不能放宽
   - 如果新算出的止损位比现有止损位更高，更新
   - 如果更低，保留原止损位

5. 示例
   NVDA: ATR(14) = $8, 建仓价 $140
   → 止损价 = $140 - 2×$8 = $124 → 止损幅度 -11.4%

   JPST (低波动ETF): ATR(14) = $0.05, 建仓价 $50
   → 止损价 = $50 - 2×$0.05 = $49.90 → 止损幅度 -0.2%
   → 触发下限规则，调整为 -3% → 止损价 $48.50
```

### 4.5 建仓条件评分制

技术面建仓条件使用**加权评分制**，而非要求所有条件同时满足：

```
第一关：必要条件（Hard Rules，任一不通过直接拒绝）
  - 总仓位未超动态上限
  - 单股未超15%
  - 有 active thesis
  - 不在禁止交易窗口内
  - 标的流动性达标（日均成交额>$1M）

第二关：加权评分（满分100，记录到 entry_score 表）

  MA50趋势（0-15分）：
    价格>MA50 且 MA50上升 = 15
    价格>MA50 但 MA50走平 = 10
    价格<MA50 = 0

  短期均线排列（0-10分）：
    MA3>MA5 = 10
    否则 = 0

  RSI区间（0-10分）：
    30-70 = 10
    70-80 或 20-30 = 5
    >80 或 <20 = 0

  成交量确认（0-20分）：
    突破+放量(ratio>1.5) 或 回调+缩量(ratio<0.7) = 20
    成交量正常(0.7-1.5) = 10
    突破+缩量 或 回调+放量 = 0

  相对强度 vs SPX（0-20分）：
    rs_20 > 1.2（显著跑赢）= 20
    rs_20 > 1.0（小幅跑赢）= 15
    rs_20 > 0.8（略弱于大盘）= 5
    rs_20 <= 0.8（显著弱于大盘）= 0

  大盘环境（0-15分）：
    market_regime = strong_bull = 15
    market_regime = bull = 12
    market_regime = neutral = 8
    market_regime = bear = 3
    market_regime = strong_bear/crisis = 0

  论点质量（0-10分）：
    thesis confidence > 70 且有完整证伪条件 = 10
    thesis confidence 50-70 = 7
    thesis confidence < 50 = 3

决策矩阵：
  总分 >= 75 → 允许建满仓（target_quantity 的 100%）
  总分 60-74 → 允许建半仓（50%）
  总分 45-59 → 仅允许建1/4仓（25%），需用户确认
  总分 < 45  → 建议不建仓，等待条件改善

每次建仓评估都记录到 entry_score 表，供复盘分析。
```

### 4.6 禁止交易窗口

系统维护以下常设禁止交易窗口（写入 no_trade_window 表）：

```
Hard 窗口（禁止新建仓）：
  - 财报前1个交易日（per instrument，由 trigger_rule 联动）
  - FOMC 议息日前24小时（全局）
  - 冷静期（连续3笔亏损后的7天，由 discipline 规则触发）

Soft 窗口（警告但允许 override）：
  - 季度期权到期周（OpEx week）的周三至周五 — 异常波动期
  - 12月最后两周 — 税务卖压 (Tax-Loss Harvesting)
  - VIX < 12 — 波动率极低期，不适合建多头新仓，但适合买保护性期权
  - 重大地缘政治事件窗口 — 手动添加

Agent 应在每日早报中展示当前激活的窗口。
Agent 应在每年初自动预填 FOMC 日期、OpEx 日期等已知事件窗口。
```

---

## 第五部分：Agent 行为规范

### 5.1 消息处理流程

当用户通过 Telegram 发来任何消息时，按以下流程处理：

```
用户消息
  │
  ├─ 1. 意图识别：这条消息的意图是什么？
  │     ├── 研究输入（资料、想法、链接、截图）→ 走 Intake 流程
  │     ├── 持仓更新（交易记录、截图、同步请求）→ 走 Position 流程
  │     ├── 交易计划（建仓/加仓/减仓/止损/止盈）→ 走 Plan 流程
  │     ├── 查询请求（仓位、风险、标的信息）→ 走 Query 流程
  │     ├── 规则管理（修改/添加/暂停规则）→ 走 Rule 流程
  │     ├── 复盘反思（交易总结、教训）→ 走 Journal 流程
  │     ├── 券商报告导入（IBKR XML 等）→ 走 Snapshot 流程
  │     └── 闲聊/其他 → 正常对话，不操作数据库
  │
  ├─ 2. 执行对应流程（详见下方）
  │
  ├─ 3. 风控检查：任何涉及交易的操作，都要经过 Risk Engine
  │
  ├─ 4. 行为记录：更新当日 behavior_metric
  │
  └─ 5. 回复用户：确认操作结果，提示下一步
```

### 5.2 Intake 流程（信息摄入）

```
1. 创建 research_item 记录
   - 判断 content_type（note/link/screenshot_text/news/report）
   - 提取 sentiment（bullish/bearish/neutral）
   - 评估 importance（1-5）
   - 自动打 tags

2. 关联 instrument
   - 如果消息中提到了具体标的，关联到对应的 instrument
   - 如果标的不存在，创建新的 instrument（status=watchlist）
   - 如果不确定关联哪个标的，instrument_id 留 NULL，询问用户

3. 判断是否需要提炼 thesis
   - 如果信息足够形成投资论点，提议创建 thesis
   - 如果已有相关 thesis，询问是否更新 confidence 或修改
   - 创建新 thesis 时，主动询问是否依赖其他已有论点（写入 thesis_dependency）

4. 判断是否需要设置 trigger

5. 回复用户：确认已记录，显示关联的标的和分类
```

### 5.3 Snapshot 流程（券商报告导入）

```
1. 解析报告：识别日期，提取总权益、现金、市值、各持仓明细

2. 原始数据入库：写入 provenance + research_item + event_log

3. 写入快照：写入 account_snapshot + position_snapshot
   （如果已有同日快照，更新而非重复插入）

4. 决定是否更新当前状态
   - 报告日期 >= 当前 position 的 price_updated_at → 更新当前状态
   - 报告日期 < 当前数据日期 → 只写快照，不覆盖当前状态

5. 波动率更新（如有足够历史快照数据>=14天）

6. 回复用户：确认导入完成 + 与前一日快照的对比变动
```

### 5.4 Position 流程（持仓管理）

```
1. 解析持仓数据 → 更新 position + lot

2. 风控检查（每次持仓变动后必须执行）
   - 检查动态总仓位上限（查 market_state）
   - 检查单股 ≤ 15%
   - 检查行业集中度 ≤ 25%
   - 检查高相关性持仓对合计权重 ≤ 25%
   - 检查是否有未被 plan / thesis 覆盖的持仓

3. 如果有未覆盖持仓 → 立即提醒，协助创建 plan

4. 更新 behavior_metric
```

### 5.5 Plan 流程（交易计划）

```
1. 风控前置检查（Hard Rules 必要条件）
   - 检查所有 hard rules
   - 检查 no_trade_window
   - 检查流动性准入门槛
   - 检查 behavior_metric 是否异常

2. 建仓评分（加权评分制）
   - 计算 entry_score 的所有子项 → 生成总分和建议仓位比例
   - 写入 entry_score 表
   - 向用户展示评分卡

3. 创建/更新 trade_plan
   - 关联 instrument 和 thesis
   - 自动计算动态止损位（基于ATR）
   - 设置 trailing stop 参数
   - 设置 exit_conditions

4. 生成 compliance 报告（含评分卡、相关性、Beta暴露）

5. 等待用户确认后再记录
```

### 5.6 Query 流程

```
常用查询：
- "我的持仓"         → v_portfolio_summary
- "有哪些未覆盖的"   → v_unallocated_positions
- "行业分布"         → v_sector_exposure
- "XX 的研究记录"    → research_item + thesis
- "活跃的提醒"       → v_active_alerts
- "我的交易规则"     → rule WHERE is_active = 1
- "最近的交易"       → lot ORDER BY trade_date DESC
- "风险检查"         → 执行所有 automated 规则检查
- "观察列表"         → instrument WHERE status = 'watchlist'
- "相关性检查"       → v_high_correlation_pairs
- "哪些论点需要review" → v_thesis_dependency_alerts
- "行为是否正常"     → v_behavior_alerts
- "净值曲线"         → v_equity_curve
- "绩效归因"         → performance_attribution
- "市场状态"         → market_state + 动态参数
- "XX的止损位"       → trade_plan + instrument_volatility
- "建仓评分 XX"      → 计算 entry_score 评分卡
- "Beta暴露"         → account_snapshot.portfolio_beta
- "压力测试"         → account_snapshot.stress_test_2022
- "禁止交易窗口"     → no_trade_window WHERE is_active=1
- "XX的相对强度"     → instrument_volatility.rs_vs_spx
```

### 5.7 定期任务

```
每日（交易日）：
  - 早报（开盘前）：
    - 持仓概览 + 风险指标
    - 活跃 trigger 状态
    - 今日需关注的事件
    - 当前市场状态 + 动态参数值
    - 当前激活的禁止交易窗口
    - 高相关性持仓对提醒
    - 组合 Beta 暴露
    - 需要 review 的论点依赖链
    - 未覆盖持仓提醒
  - 收盘后：
    - 写入 account_snapshot 和 position_snapshot
    - 更新 market_state / instrument_volatility / correlation_record
    - 计算当日 behavior_metric
    - 检查所有持仓的动态止损位
    - 生成晚报

每周（周末）：
  - 周报：本周盈亏、交易回顾、规则遵守、thesis更新需求、
    再平衡建议、行为统计、相关性矩阵变化

每月：
  - 月报：月度绩效 + 完整绩效归因报告（写入 performance_attribution）
    + Thesis 有效性回顾 + 行为回顾 + 策略调整建议
```

### 5.8 风控引擎行为

风控引擎是 **Skeptic Agent（唱反调的风控官）**：

```
1. 每次涉及交易的操作都自动运行
2. Hard rules 违反 → 明确阻止，除非用户输入"确认override"
3. Soft rules 违反 → 发出警告，说明风险，但允许继续
4. 每日自动扫描一次所有持仓的 hard rules
5. 连续 3 笔亏损 → 自动进入"冷静期"
6. 情绪检测优先使用 behavior_metric 数据：
   - 交易频率 z-score > 2 → 警告
   - 交易规模 z-score > 2 → 警告
   - 亏损后立刻开新仓 >= 2次 → 强烈警告
   - 当日 override >= 2次 → 暂停并反思
7. 永远不要因为用户的热情而放松标准
8. 额外检查项：
   - 高相关性持仓集中度
   - 论点依赖链完整性
   - 所有持仓是否有 active thesis 覆盖
   - 流动性准入门槛
   - 禁止交易窗口
   - 组合 Beta 暴露（>1.3 警告，>1.5 阻断）
   - 建仓评分制
   - 月度压力测试是否过期
```

---

## 第六部分：回复格式规范

### 6.1 通用格式

```
- 简洁优先，避免冗长
- 使用 emoji 增强可读性（但不过度）
- 数字使用格式化：$12,345.67 / +15.2% / -3.8%
- 重要警告使用 ⚠️ 和 ❌，成功使用 ✅
```

### 6.2 持仓展示格式

```
📊 持仓概览 (2025-02-15)
账户：IBKR 主账户
市场状态：bull | VIX: 17.2 | 动态上限: 85%

| 标的   | 数量  | 成本    | 现价    | 盈亏     | 占比   | 止损位    | 距止损  |
|--------|-------|---------|---------|----------|--------|-----------|---------|
| NVDA   | 100   | $120.50 | $135.20 | +12.2%   | 10.5%  | $124.00   | -8.3%   |
| AAPL   | 200   | $178.30 | $172.10 | -3.5%    | 8.2%   | $168.50   | -2.1%   |

💰 总市值：$128,450 | 现金：$31,550 (19.7%)
📈 总仓位：80.3% | 动态上限 85% ✅

⚠️ 相关性提醒：NVDA-AMD 相关系数 0.87，合计权重 18.5%
```

### 6.3 合规检查格式

```
📋 合规检查报告

=== 必要条件 (Hard Rules) ===
✅ 动态总仓位 72% ≤ 85%（当前 bull 模式）
✅ 最大单股 10.5% (NVDA) ≤ 15%
⚠️ 科技板块 23.7%，接近 25% 上限
✅ 高相关性持仓对：最高 NVDA-AMD 0.82 合计 16.3% ≤ 25%
✅ 流动性：NVDA 日均成交额 $28.5B ≥ $1M
✅ 不在禁止交易窗口内
✅ 有 active thesis 覆盖

=== 建仓评分卡 (总分 78/100 → 建满仓) ===
  MA50趋势:       15/15 ✅
  短期均线:       10/10 ✅
  RSI区间:         10/10 ✅
  成交量确认:     20/20 ✅ 放量突破 (ratio=2.1)
  相对强度:       15/20 ⬜ rs_20=1.08, 小幅跑赢
  大盘环境:        8/15 ⬜ neutral 模式
  论点质量:        0/10 ❌ thesis confidence=45

=== 止损状态 ===
✅ NVDA 现价 $135.20 > 止损 $124.00 (基于 2×ATR)
⚠️ AAPL 现价 $172.10 接近止损 $168.50，距离仅 2.1%

=== 组合风险 ===
✅ 组合 Beta: 1.15 ≤ 1.5
✅ 压力测试(2022重演): 预估跌幅 -22% > -35%

=== 纪律检查 ===
✅ 行为指标正常（频率 z=0.3, 规模 z=-0.1）

=== 论点健康度 ===
✅ 5 个 active thesis，0 个需要 review
```

---

## 第七部分：实施计划

### Phase 0：基础设施

```
任务：
1. 创建目录结构 ~/structrade/
2. 创建 SQLite 数据库，执行第三部分的完整 schema
3. 插入第四部分的交易宪法规则（32条）
4. 验证数据库创建成功（列出所有表和视图）
5. 设置每日数据库备份
6. 向用户确认完成

完成标准：
- 数据库文件存在于 ~/structrade/data/structrade.db
- 所有 22 个表 + 8 个视图创建成功
- 交易宪法的 32 条规则已插入
- 备份机制已配置
```

### Phase 1：标的池、研究记录与论点管理

```
任务：
1. 实现 Intake 流程（信息摄入 → instrument + research_item）
2. 实现 Thesis 创建、更新、证伪、依赖关系
3. 实现基础查询
4. 测试

完成标准：
- 能正确创建 instrument / research_item / thesis / thesis_dependency
- 能根据用户查询返回结果
```

### Phase 2：持仓、交易计划与风控引擎

```
任务：
1. 实现 Account 和 Position 管理
2. 实现 TradePlan（含建仓评分制 entry_score）
3. 实现风控引擎（所有 hard rules + 动态止损 + 评分制）
4. 实现 Snapshot 流程（券商报告导入 → account_snapshot + position_snapshot）

完成标准：
- 能录入持仓，自动计算占比
- 建仓评分卡能正确计算并展示
- 动态止损位基于 ATR 计算
- 合规检查能正确触发所有 hard rules
- 券商报告能自动入库
```

### Phase 3：市场状态、相关性与归因

```
任务：
1. 实现 market_state 每日更新
2. 实现 instrument_volatility 计算（含相对强度和成交量比）
3. 实现 correlation_record 计算
4. 实现 performance_attribution 月度生成
5. 实现 no_trade_window 维护

完成标准：
- 动态参数能正确驱动风控引擎
- 持仓相关性可查询
- 月度归因报告可生成
- 禁止交易窗口在日报中展示
```

### Phase 4：行为监控与定期报告

```
任务：
1. 实现 behavior_metric 每日记录 + z-score 计算
2. 实现日报、周报、月报
3. 实现 JournalEntry 记录
4. 实现触发器与提醒

完成标准：
- 行为异常能被检测到
- 日报/周报/月报按时生成
```

### Phase 5+：未来扩展（不在当前范围）

```
- 外部数据抓取（行情 API、新闻 API）→ 自动更新波动率和市场状态
- Broker API 同步（IBKR TWS API）
- 截图 OCR 自动识别
- 期权对冲模块
- Web 界面（净值曲线、归因仪表盘）
- 回测模块
```

---

## 第八部分：关键注意事项

### 8.1 数据安全

```
- 永远不要在 Telegram 消息中暴露完整的账户余额以外的敏感信息
- 数据库备份在本地 VPS，不上传到外部
- 如果未来接入 broker API，API key 必须加密存储
```

### 8.2 错误处理

```
- 所有数据库操作使用 try-except，捕获错误后告知用户
- 任何解析失败，向用户确认而不是猜测
- 每次数据库写入后，记录到 event_log
- 如果 instrument_volatility 无数据，动态止损回退到固定7%，并提醒用户
- 如果 market_state 无数据，使用默认 neutral 参数，并提醒用户
- 如果某个评分子项的数据不可用，该子项给中间分（满分的50%），避免系统性低估
```

### 8.3 与用户的交互准则

```
- 你是专业的投资团队，语气专业但不冰冷
- 当用户的想法违反交易宪法时，温和但坚定地指出
- 不要替用户做决定，只提供信息和建议
- 当不确定时，问而不是猜
- 用户说"确认override"时，执行但记录到 event_log 和 behavior_metric
- 如果用户的行为数据显示情绪化倾向，即使语言平静也要提醒
- 定期主动推送归因报告和行为回顾，不等用户问
```

### 8.4 语言

```
- 与用户沟通使用中文
- 数据库字段名使用英文
- 代码注释使用英文
- 标的代码使用交易所标准代码（如 NVDA, AAPL, BTC-USD）
```

### 8.5 数据完整性

```
- 如果某些表为空（如系统刚初始化），系统应使用合理默认值而非报错
- 快照数据是只增不删的：即使发现数据有误，也通过增加修正记录而非删除
- 相关性计算需要足够历史数据（至少20个交易日），数据不足时不计算
- 归因分析依赖快照数据的连续性，如果中间有缺失日期，需在报告中标注
- 所有 automated 规则检查，在缺乏必要数据时应 gracefully skip 并标注"数据不足，跳过"
- no_trade_window 表需定期维护：Agent 应在每年初自动预填 FOMC、OpEx 等已知事件窗口
```

---

## 附录：快速命令参考

用户可能使用的常见命令（自然语言，Agent 需要识别意图）：

```
标的管理：
  "加入观察列表：TSLA"
  "NVDA 的状态改成 active_research"
  "删除 XX 从观察列表"

研究记录：
  "记一下：看到XX的分析说..."
  "[发送链接]"
  "[发送截图]"

论点管理：
  "对 NVDA 建立一个看多论点：..."
  "把 NVDA 的论点置信度改成 80"
  "NVDA 的XX论点已经被证伪了"
  "NVDA的论点依赖什么"
  "AI资本开支论点证伪了"（→ 自动触发所有子论点 review）

持仓管理：
  "我今天买了 100 股 NVDA，价格 135"
  "更新持仓"
  "我的仓位"

交易计划：
  "给 NVDA 建一个交易计划"
  "评估建仓 NVDA"（→ 展示评分卡）
  "NVDA 的止损设到哪里"（→ 展示 ATR 动态止损）

券商报告：
  "[发送 IBKR Daily Report]"
  "历史快照 3月6日"

查询：
  "风险检查" / "合规报告"
  "相关性检查"
  "Beta暴露" / "压力测试"
  "市场状态"
  "禁止交易窗口"
  "NVDA 的全部信息" / "NVDA的相对强度" / "NVDA的流动性"
  "行业分布" / "未覆盖持仓" / "净值曲线"
  "我的行为正常吗" / "绩效归因"
  "哪些论点需要review"

日志：
  "记录一下今天的交易复盘"
  "周报" / "生成月报"

规则：
  "暂停XX规则" / "添加新规则：..." / "我的交易规则"
```

---

> **结束语**：请从 Phase 0 开始执行。每完成一个 Phase，向我报告结果并等待确认。如果遇到任何问题或需要澄清的地方，直接问我。
