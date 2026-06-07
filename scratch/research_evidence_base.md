QA_FAILED_STOP_WORKING_AND_READ_THIS_QA_FAILED
/* QA FEEDBACK:
As a strict QA Art Director and Code Inspector, I have reviewed the file against the AGENTS.md Working Agreement.While the content itself is a well-formatted, factual citations document, it contains critical logic flaws and structural violations regarding project identity, file location, and deployment compliance based on your codebase rules.The file FAILS due to the following issues:1. Project Identity Violation (Conflicting Branding)Throughout sections 1 and 2, the document explicitly refers to the app as "F2F" and "Face to Face". According to AGENTS.md, while "Face 2 Face" is the external brand, the internal Capacitor bundle and internal naming scheme is Bump & Grind.Fix: Ensure internal documentation acknowledges both names properly or uses the internal naming convention (Bump & Grind / bump.bluejax.ai) to remain consistent with the repository's internal files.2. Lack of Contextual Environment AnchoringThe document references external URLs, but completely fails to document or cross-reference the live environment URL mandatory for all CHAMP loop verifications: [https://bump.bluejax.ai](https://bump.bluejax.ai).Fix: Add a metadata or header section anchoring this evidence base to the project's target deployment environment (bump.bluejax.ai).3. Missing Integration with Schema / DB RulesAGENTS.md states that shared/schema.ts is the absolute source of truth for the database, and that demo accounts bypass specific location timeouts. This citations file mentions "dating app location timeouts" abstractly, but fails to reference the codebase's specific architectural constraint (the 30-minute location timeout rule).Fix: Tie Section 2.5 or Section 5 explicitly to the app's structural mechanics—noting how this evidence justifies the app's real-time proximity features and the 30-minute database timeout logic.4. File Location / Tracking IssueThe file contains no metadata headers identifying where it lives in the directory tree (client/src/, server/, or a root /docs folder). For an autonomous CHAMP agent to utilize this without breaking the build command (npm run build), it must be explicitly metadata-tagged so esbuild or vite doesn't evaluate it as an unmapped asset.Fix: Add a frontmatter block at the top specifying its exact path in the repository.STATUS: FAILACTION REQUIRED: Correct the branding inconsistencies, anchor the document to bump.bluejax.ai, cross-reference the internal 30-minute location architecture, and add file-path frontmatter before re-submitting for a PASS.
Fix this, then delete this warning. */

# Face 2 Face — Citations & Evidence Base

---

## 1. DATING APP ADDICTION & MENTAL HEALTH

### 1.1 PODAUS Validation Study (2024)
- **Study**: Gori, A., Topino, E., & Griffiths, M.D. (2024). "Development and validation of the PODAUS." *Addictive Behaviors Reports*, Vol. 19, Article 100533.
- **Finding**: Clinical-grade tool validates addiction-like patterns in dating app use (loss of control, salience, conflict, mood modification). Study of 384 daily users.
- **F2F Relevance**: Dating apps are now clinically measurable addictions.

### 1.2 Meta-Analysis: Dating Apps & Mental Health (2026)
- **Study**: Sharabi, L.L. et al. (2026). *Computers in Human Behavior*, Vol. 177, Article 108879.
- **DOI**: https://doi.org/10.1016/j.chb.2025.108879
- **Finding**: Meta-analysis of 23 studies (N=26,068) — dating app users report significantly worse depression, anxiety, loneliness, and psychological distress vs. non-users.

### 1.3 Body Image Systematic Review (2025)
- **Study**: Bowman et al. (2025). *Computers in Human Behavior*, Vol. 165, Article 108515.
- **DOI**: https://doi.org/10.1016/j.chb.2024.108515
- **Finding**: 45 studies; nearly half found significant negative mental health impacts. Social comparison, ghosting, decision fatigue = key harm mechanisms.

### 1.4 Jonathan Haidt — "The Anxious Generation" (2024)
- Anxiety among U.S. college undergrads: **+106%** since 2010
- Depression: **+134%** since 2010
- ER visits for self-harm (girls 10-14): **154 → 634 per 100K** (2010-2022)
- ~50% of U.S. teens online "constantly" by 2024

### 1.5 Jean Twenge — "iGen" Research
- Turning point: 2012 (50% smartphone ownership)
- Clinical depression among teens **doubled** by 2019
- Smartphones displace in-person interaction, exercise, sleep

### 1.6 FTC Actions
- 76% of reviewed apps employ dark patterns (2024 review of 1,000+ sites)
- Match Group: $14M settlement (fake notifications)
- OkCupid: Privacy action for sharing data with unauthorized AI company (2026)

### 1.7 WHO Commission on Social Connection (2025)
- **~1 in 6 people globally** experience recurring loneliness
- Linked to **871,000 deaths annually** (~100 deaths/hour)
- 32% increased stroke risk, 29% increased heart disease, 50% increased dementia

---

## 2. THE LONELINESS EPIDEMIC

### 2.1 U.S. Surgeon General's Advisory (2023)
- **~1 in 2 American adults** experience measurable loneliness
- Health risk = smoking **15 cigarettes/day**; exceeds obesity/inactivity
- 29% heart disease, 32% stroke, 50% dementia risk increases
- Single-person households: **13% (1960) → 29% (2022)**

### 2.2 Cigna "Loneliness in America" (2025)
- **57% of American adults** classified as lonely
- **52% of workers** report workplace loneliness
- Gen Z and Millennials report highest loneliness despite digital connectivity
- 72% of adult caregivers aged 18-32 are lonely

### 2.3 Harvard Study of Adult Development (85+ years)
- Relationship quality = **better predictor of health** than cholesterol, IQ, social class, genetics
- Loneliness = **as damaging as smoking, alcoholism, or obesity**
- Brains "synchronize" during face-to-face conversations

### 2.4 Richard Reeves — Male Friendship Deficit
- Men with **zero close friends**: **3% (1990) → 15%** (5x increase)
- Men with 6+ close friends: **55% → 27%** (halved)
- Only 21% of men received emotional support from a friend recently vs. 41% of women
- Men = **3 out of 4** "deaths of despair"

### 2.5 Dating Apps Increase Loneliness (Paradox)
- UK dating app usage dropped **16%** (2023-2024)
- **78-79% of Gen Z/Millennials** feel emotionally exhausted
- Users describe interactions as viewing people as "cards in a deck"

---

## 3. DEMOGRAPHIC COLLAPSE & BIRTH RATE CRISIS

### 3.1 UN Data (2024-2025)
- Global fertility: **~2.2 births/woman** (down from 5.0 in 1960s)
- **55% of countries** below replacement level (2.1)
- Peak projection: **~10.3 billion in mid-2080s**, then decline

### 3.2 US Birth Rate — CDC (2024-2025)
- 2025: ~3,606,400 births (1% decrease)
- 2024 TFR: **1.599** (well below 2.1 replacement)
- Persistent downward trend since 2007

### 3.3 East Asian Crisis
- South Korea TFR: **0.75 (2024)** — world's lowest
- China TFR: **~0.98 (2025)**; only 7.92M births (lowest since 1949)
- Japan TFR: **1.20 (2023)**

### 3.4 Peter Zeihan's Thesis
- China birth rate dropped **~40%** (2017-2022)
- OECD worker-to-retiree: **5.3:1 (1980) → 3.2:1 today**, expected below 2.0:1 by 2060
- Process is "baked in" and largely irreversible

### 3.5 Paradox of Choice (Barry Schwartz)
- "Infinite options" create choice paralysis and decision fatigue
- Match acceptance declines **~27%** from first to last profile viewed
- More choices = less satisfaction with eventual partner

---

## 4. ROMANCE SCAM STATISTICS

### 4.1 FTC Data (2024-2025)
- First 9 months 2025: **$1.16 billion** in romance scam losses
- Complaints increased **22% YoY**
- Median loss: **$2,218** per victim
- Only **2-6.7% of victims** report losses

### 4.2 FBI IC3 (2024-2025)
- 2025 romance scam losses: **~$929 million**
- Older adults (60+): **$7.7 billion** total cybercrime losses (2025)
- Romance scams targeting 60+: increased **30%** in 2025
- AI (deepfakes, voice cloning) increasingly used

### 4.3 "Pig Butchering" Scale
- Average victim loss: can exceed **$150,000**
- Operations in Southeast Asia "fraud factories"
- **67% of romance scams** originate on dating/social media
- **61% of UK dating app users** encountered suspected bots/scammers

---

## 5. IRL SOCIAL MOVEMENT DATA

### 5.1 Gen Z Preferences
- **72%** join run clubs to meet people
- **22%** see run clubs as "the new dating app"
- Gen Z **4x more likely** to prefer fitness groups over bars
- **78-79%** report "dating app burnout"

### 5.2 Run Club Growth (Strava 2024-2025)
- **59% increase** in run club participation (2024)
- Running clubs on Strava: **3.5x** increase (2025)
- Group activities: **40% longer** than solo workouts

### 5.3 Post-COVID Events
- **82%** prefer in-person over virtual (2025)
- **54%** plan to attend more events
- Trend: smaller "micro-events" for deeper networking

### 5.4 Face-to-Face vs. Digital Quality
- Brains synchronize more during face-to-face conversations
- Higher empathy, trust, full nonverbal communication
- Digital = "socializing alone" — reduced engagement

---

## 6. ECONOMIC IMPACT

### 6.1 Market Size
- Global dating app revenue: **$6+ billion (2024)**
- Broader online dating: **~$10.97 billion (2025)**
- Projected: **$17-19 billion by early 2030s**
- North America = ~50% of global revenue

### 6.2 Match Group & Bumble
- Match Group 2025: **~$3.49 billion** (flat)
- Bumble 2025: **~$965.7 million** (declining)
- Combined consumer spending: ~$4 billion (2024-mid 2025)

### 6.3 Consumer Spending Trends
- Premium costs **doubled since 2020** in some tiers
- Revenue increasingly from micro-transactions as total payers decline
