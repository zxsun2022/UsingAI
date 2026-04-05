---
name: axiom-extractor
description: Extract a person's core axioms, beliefs, principles, or worldview from a large corpus of writings using an incremental read-and-update workflow. Use when the user asks to extract axioms from writings, find core beliefs in a corpus, distill principles from notes, or analyze a directory of text files, including Chinese requests such as "提炼这些文章的底层信念" or "从这批笔记里抽取核心原则".
---

# Axiom Extractor

Extract a person's core axioms by incrementally reading their writings and maintaining a living axiom document.

## Core concept

Instead of batch processing, this skill works like a careful reader:

1. Start with an empty axiom document
2. Read one file at a time from the corpus
3. After each file, update the axiom document - add, merge, strengthen, weaken, or remove axioms
4. The axiom document evolves with each file read, converging toward the author's true beliefs

This mirrors how a thoughtful reader would form an understanding of someone's worldview by reading their collected works sequentially.

## What counts as an axiom

An axiom is a fundamental belief the author has arrived at through experience - not a goal, aspiration, or motivational slogan.

Test for a real axiom:
- Does the author BUILD on this belief to reach other conclusions? (load-bearing)
- Could a reasonable person disagree with it? (falsifiable)
- Does it appear in multiple writings, possibly in different words? (recurrent)
- Did it come from experience or deep reflection, not from copying others? (hard-won)

Counter-examples that are NOT axioms:
- "Work hard and stay positive" -> generic aspiration
- "AI is transforming the world" -> obvious observation
- "I want to be more disciplined" -> aspiration, not held belief

## Instructions for the agent

### Phase 1: Setup

1. Ask the user for:
   - The directory path containing the corpus
   - The author's name
   - Brief context about the author (profession, background, interests)
   - Preferred output language (or bilingual)

2. List all readable files in the directory (`.txt`, `.md`, `.html`, `.org`, `.rst`, `.json`, `.csv`). Sort them - if filenames contain dates, sort chronologically; otherwise sort alphabetically.

3. Count total files and estimate total characters. Report this to the user.

4. Create the initial axiom document at `axioms.md` in the working directory with this structure:

```markdown
# [Author Name]'s Axioms
_Work in progress - extracted from [0/N] files_

## Axioms

(none yet)

## Graveyard
_Axioms that were considered but later removed or downgraded_

## Processing Log
| # | File | Chars | Axioms added | Axioms modified | Notes |
|---|------|-------|-------------|----------------|-------|
```

### Phase 2: Incremental reading

For each file in the corpus, do the following:

**Step A - Read the file.**
Read the full content. If the file exceeds 80,000 characters, split it into segments and process each segment as a sub-step.

**Step B - Extract insights.**
While reading, look for:
- Explicit belief statements ("I believe...", "The truth is...", "我认为...")
- Recurring metaphors or frameworks the author uses to explain things
- Conclusions drawn from personal experience
- Judgments that go against conventional wisdom
- Patterns the author keeps returning to across topics
- Tensions between what the author says and what they report doing

**Step C - Update the axiom document.**
Open `axioms.md` and apply one or more of these operations:

| Operation | When to use | How |
|-----------|------------|-----|
| **ADD** | A genuinely new insight not covered by existing axioms | Add a new axiom entry |
| **STRENGTHEN** | An existing axiom is confirmed by new evidence | Increment the recurrence count, add evidence |
| **REFINE** | An existing axiom needs better wording based on new evidence | Rewrite the axiom statement, note why |
| **MERGE** | Two existing axioms turn out to be the same insight | Combine into one, keep the stronger formulation |
| **WEAKEN** | New text contradicts an existing axiom | Note the contradiction, lower confidence |
| **SPLIT** | An axiom turns out to contain two distinct insights | Create two separate axioms |
| **DEMOTE** | An axiom turns out to be aspirational, not actually held | Move to a separate "Aspirational" section |
| **KILL** | An axiom was a misreading or is clearly wrong | Move to Graveyard with explanation |

Each axiom entry in the document should look like:

```markdown
### A[N]. [Short title]
> [Concise axiom statement - 1-2 sentences max]

- **Recurrence**: [N] files
- **Confidence**: high | medium | low
- **Domain**: [epistemology | product | investment | identity | spirituality | career | creativity | relationships | meta-cognition | culture | technology | other]
- **Key evidence**: [1-3 short notes referencing specific files/passages]
- **First seen**: [filename]
- **Status**: active | aspirational | tension
```

**Step D - Update the processing log.**
Add a row to the log table with the file name, character count, number of axioms added/modified, and any notable observations.

**Step E - Save and continue.**
Save `axioms.md` and move to the next file.

### Phase 3: Synthesis (after all files are processed)

Once all files have been read, do a final synthesis pass on `axioms.md`:

1. Sort by recurrence. Axioms that appeared in many files should be at the top.

2. Assign tiers.
   - **Tier 1 - Core**: Recurrence >= 3, high confidence, consistent behavior evidence -> the author's non-negotiable beliefs
   - **Tier 2 - Framework**: Recurrence >= 2, used as analytical tools -> intellectual scaffolding the author relies on
   - **Tier 3 - Emerging**: Recurrence 1-2, recent or domain-specific -> may become core over time

3. Identify tensions. Find 2-4 pairs of axioms that contradict or sit in productive tension with each other. These are often the most revealing parts of someone's belief system.

4. Write a meta-axiom if one exists - an overarching pattern about the author's relationship to their own thinking (e.g., "values analysis over action", "trusts experience over theory").

5. Clean up. Remove the processing log from the final document (or move it to an appendix). Rewrite the header to reflect the final state.

### Final output format

```markdown
# [Author Name]'s Axioms
_Distilled from [N] texts, [total chars] characters_

## Tier 1: Core Axioms
_Non-negotiable beliefs verified by repeated experience_

### A1. [Title]
> [Axiom statement]

Recurrence: [N]x | Domain: [domain]
Evidence: [brief notes]

...

## Tier 2: Framework Axioms
_Intellectual tools the author relies on_

...

## Tier 3: Emerging Axioms
_Recently formed beliefs, not yet fully tested_

...

## Tensions & Contradictions
_Where the author's axioms conflict - often the most interesting part_

1. **[Axiom X] vs [Axiom Y]**: [explanation of the tension]
...

## Meta-Axiom
> [If one exists]

## Aspirational Beliefs
_Things the author writes about wanting to be true, but doesn't consistently practice_

...
```

## Important guidelines

- Read the author charitably. Assume they mean what they say unless there's clear evidence otherwise.
- Distinguish voice from quotation. If the author quotes someone else approvingly, that's weaker evidence than the author stating something in their own voice.
- Track evolution. If the author's beliefs change over time (especially in a chronologically sorted corpus), note the evolution rather than just keeping the latest version.
- Respect the author's language. If they write in Chinese, keep axioms bilingual. Don't flatten their voice into generic English.
- Quality over quantity. A final set of 10-20 strong axioms is better than 50 weak ones. Be ruthless about what qualifies.
- The graveyard matters. Killed axioms tell you what the author is NOT - this is also valuable information.

## Handling large corpora

For corpora over 100 files:
- Process in batches of 20-30 files
- After each batch, do a mini-synthesis: review and consolidate the axiom document before continuing
- This prevents the axiom document from getting unwieldy mid-process

For individual files over 80,000 characters:
- Split into ~40,000 character segments with ~2,000 character overlap
- Process each segment as a sub-step within the same file

## Example session

```text
User: Extract axioms from ~/writings/ - that's my blog posts from 2020-2025.
      I'm a product manager interested in AI, investing, and Buddhist philosophy.

Agent: [Lists 87 .md files, ~450K total chars]
       Creating axioms.md...
       Reading file 1/87: 2020-01-investment-thesis.md (3,200 chars)...
       -> Added A1: "Productive assets capture human labor; non-productive assets don't"
       -> Added A2: "Invest with the crowd's money against the crowd's opinion"

       Reading file 2/87: 2020-03-career-reflections.md (5,100 chars)...
       -> Added A3: "The analytical world is safe; action is irreversible and dangerous"
       -> Strengthened A1 (new evidence about compound effects)

       ...

       Reading file 87/87: 2025-12-year-review.md (8,400 chars)...
       -> Strengthened A3 (recurrence: 12x - clearly core)
       -> Killed A15 (author explicitly renounced this view)

       Running final synthesis...
       Done. 17 axioms across 3 tiers, 4 tensions identified.
```
