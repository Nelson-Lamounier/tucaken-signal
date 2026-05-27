# Mock — medium-signal repo (mid production_saas)

Input: GitHub Actions deploy + Docker + some README structure + no diagram +
no ADRs + no AI usage doc.

Expected preview output:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   RECRUITER PREVIEW — 55 second simulated scan              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

── 0:00–0:30  Above-the-fold ────────────────────────────────
  Title:        my-saas
  Pitch:        A web app for tracking habits.
  Status:       absent
  Demo link:    absent
  Tech badges:  absent

  Recruiter first impression:
    "Reads as production saas. Need to scroll to gauge depth."

── 0:30–2:00  Scroll + section scan ─────────────────────────
  Top sections seen:
    • Getting Started
    • Tech Stack
  Architecture diagram: no — depth invisible
  Deployment evidence:  visible (IaC / CI)
  AI transparency:      absent (2026 risk: undisclosed-AI assumption)

── 2:00+  Deep-dive (only top ~20% of recruiters reach here) ─
  ADRs:    missing
  Runbook: missing
  Tests:   present
```

Virality check: this is the *most useful* mock — the engineer sees
"my deployment work is invisible" and immediately knows what to fix.
The gap between what they did and what shows is the share trigger.
