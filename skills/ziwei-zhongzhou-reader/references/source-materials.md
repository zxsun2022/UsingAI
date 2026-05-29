# Source Materials Policy

本 Skill 的公开仓库只保存整理后的规则、索引和摘要，不保存 `books/` 中的原始书籍或转换全文。`books/` 是本地审校来源，已被 `.gitignore` 忽略。

## Local Sources

| 本地文件 | 主要用途 | 融合策略 |
|----------|----------|----------|
| `紫微斗数讲义星曜性质 (陆斌兆,王亭之) .epub` | 十四正曜、十二宫、星曜性质 | 作为 `star-*.md` 的主来源；只保留精炼规则和现代化转译 |
| `中州派紫微斗数深造讲义` | 六十星系、辅佐煞曜、宫垣论、疾厄征验 | 作为 `star-systems.md`、`palace-method.md`、`flow-rules.md` 的进阶来源 |
| `王亭之谈紫微斗数.pdf` | 总论、星系观念、格局论、辅佐煞曜 | 作为 `general-principles.md`、`patterns-part*.md`、`auxiliary-stars.md` 的审校来源 |
| `安星法及推断实例` | 安星口径、推断技巧、案例 | 当前仅作校验参考；排盘仍以 `iztro_runner.mjs` 输出为准 |

## Public Reference Rules

- 不把整书正文、长篇段落或 OCR 原文复制进 Skill。
- 每条知识应整理为：适用条件、证据字段、推断方向、现代转译。
- 与脚本输出有关的日期、四化、农历、星期几，一律以 `iztro_runner.mjs` 输出为准。
- 书中绝对化、古代化、性别化判断必须转译为现代语境，并避免宿命断语。
- 医疗、法律、投资等领域只做文化参考和风险提醒，不给专业结论。

## Local Conversion Notes

本地已生成：

- `books/converted/ziwei-doushu-jiangyi-xingyao-xingzhi/book.clean.md`
- `books/converted/ziwei-doushu-jiangyi-xingyao-xingzhi/book.stars.md`
- `books/converted/ziwei-doushu-jiangyi-xingyao-xingzhi/stars/*.md`
- `books/converted/zhongzhoupai-shenzao-jiangyi/book.md`
- `books/converted/anxingfa-tuanduan-shili/book.md`
- `books/converted/wangtingzhi-tan-ziwei-doushu/book.txt`

这些文件仅供本地审校，不进入 git。
