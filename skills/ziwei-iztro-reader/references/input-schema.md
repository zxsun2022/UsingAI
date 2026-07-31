# 输入 JSON 结构

`iztro_runner.mjs` 接收一个 JSON 文件路径参数。

## 示例

```json
{
  "birth": {
    "confirmed": true,
    "calendar": "solar",
    "date": "2000-1-1",
    "timeIndex": 7,
    "gender": "female",
    "birthplace": "Shanghai, China",
    "isLeapMonth": false,
    "fixLeap": true,
    "language": "zh-CN"
  },
  "query": {
    "timezone": "Asia/Shanghai",
    "baseDate": "today",
    "outputMode": "focused",
    "futureDates": ["2026-03-01", "2026-06-18"]
  }
}
```

## 字段说明

- `birth.calendar`：`solar` 或 `lunar`
- `birth.confirmed`：必须为 `true`，表示出生信息已被用户确认
- `birth.date`：`YYYY-M-D`
- `birth.timeIndex`：`0..12`
- `birth.gender`：`male` 或 `female`
- `birth.birthplace`：必填，必须显式提供非空字符串（如 `Shanghai` 或 `Shanghai, China`）；runner 会拒绝空值
- `birth.isLeapMonth`：农历闰月标记，仅 `lunar` 模式生效
- `birth.fixLeap`：传给 iztro 的闰月修正开关；默认且推荐固定为 `true`
- `birth.language`：可选，默认 `zh-CN`
- `query.timezone`：当前所在地 IANA 时区，用于解析 today
- `query.baseDate`：`today` 或 `YYYY-MM-DD`
- `query.outputMode`：`chart-only`、`focused` 或 `full`；可选，默认 `focused`
- `query.futureDates`：未来日期数组，用于辅助趋势判断
- `query.debug.includeIndexMapping`：可选，默认 `false`；仅开发调试时设为 `true`

## 输出核心字段

- `normalizedInput`：标准化输入与日期解析结果
  - `baseDateDayOfWeek`：基准日期的星期几（如 `"Wednesday"`）
- `outputPolicy`：输出策略与免责声明；原始盘面数据保持完整，默认解读档位为 `focused`
- `natalSummary`：命盘元数据（命主、身主、五行局、干支、星座、生肖等，不含逐宫数据）
- `currentDetailed`：当前日期的详细分层快照，含逐宫合并明细
- `futureDetailed[]`：未来日期的详细分层快照，含逐宫合并明细

## `currentDetailed` / `futureDetailed[]` 顶层字段

- `targetSolarDate`：该快照对应的公历日期
- `targetLunarDate`：该快照对应的农历日期（中文格式）
- `dayOfWeek`：星期几（英文，如 `"Wednesday"`）
- `dateSummary`：干支日期摘要
  - `yearlyGanZhi`：流年干支（如 `"丙午"`）
  - `monthlyGanZhi`：流月干支（如 `"庚寅"`）
  - `monthlyHeavenlyStem`：流月天干（如 `"庚"`）
  - `dailyGanZhi`：流日干支（如 `"丁丑"`）
  - `dailyHeavenlyStem`：流日天干（如 `"丁"`）

## `currentDetailed.palaces[]` 关键字段

- `palaceIndex`：固定宫位索引（0..11）
- `palaceName` / `palaceAlias` / `palaceDisplayName`
- `heavenlyStem` / `earthlyBranch`
- `natal.majorStars[]` / `natal.minorStars[]` / `natal.adjectiveStars[]`
- `flowStarsByRole.*`：按"宫位角色名称"映射后的流星（默认用于解读）
- `flowStarsByIndex.*`：按"固定宫位索引"映射后的流星（仅调试模式输出）
- `flowRoleAtIndex.*`：该索引宫位在对应层级下扮演的角色名（仅调试模式输出）
- `yearlyDecStar.suiqian12` / `yearlyDecStar.jiangqian12`
- `yearlyDecStarByIndex.suiqian12` / `yearlyDecStarByIndex.jiangqian12`（仅调试模式输出）
- `changsheng12` / `boshi12` / `jiangqian12` / `suiqian12`

星曜对象会附带：
- `tags`：例如 `本命禄`、`大限权`、`流年科`、`流月忌` 等

### 宫位角色映射

- iztro 各流运层的 `palaceNames[]` 按固定索引排列：数组位置 `i` 对应 `palaceIndex = i`。
- runner 必须先用 `palaceIndex` 取得该层角色名称，再将流星写入 `flowStarsByRole[角色名]`；不得按 `palaceNames` 重排逐宫数据。
- 解读默认读取 `flowStarsByRole`。`flowStarsByIndex` 与 `flowRoleAtIndex` 仅用于核对映射。

## 默认输出约束

- runner 始终生成完整盘面数据；`outputPolicy.detailLevel` 记录请求的解读档位。
- 默认解读档位为 `focused`；只有用户明确要求完整解读时设置 `full`。
- 用户要求完整盘面数据但不要求解读时设置 `chart-only`，盘面仍可包含全部 12 宫。
- `chart-only` 只用于盘面展示，不作命理解读。
- 当 `birth.confirmed !== true` 时，脚本直接报错并停止输出。
- 默认只输出 `byRole` 口径；除非显式开启 `query.debug.includeIndexMapping`。
