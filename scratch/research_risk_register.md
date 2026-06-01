# Face 2 Face — Risk Register (30 Risks)

Scoring: Low=1, Medium=2, High=3, Critical=4. Score = Probability × Impact.

## CRITICAL PRIORITY (Score 9-12)

### R-001 | Product | Cold Start / Empty Map
- Prob: High (3) | Impact: Critical (4) | Score: 12
- Users see zero pins → delete in 60 seconds
- Mitigation: Launch city-by-city, seed with waitlisted businesses, guerrilla activations, "scheduled meetup" feature
- Warning: D1 retention <10%, sessions <30s, "no users" complaints >50%
- Contingency: Expand radius to 25km+, show "X users signed up this week" social proof

### R-002 | Operational | Solo Founder Burnout
- Prob: High (3) | Impact: Critical (4) | Score: 12
- Bus factor of 1. Zero development/moderation/support if founder unavailable
- Mitigation: Document runbooks, automate CI/CD, monitoring alerts, identify backup developers
- Warning: 80+ hour weeks for 3+ weeks, backlog growing faster than throughput
- Contingency: Pre-negotiate retainer with backup dev, auto-responder emails

### R-003 | Legal | Safety Incident Involving Users
- Prob: Medium (2) | Impact: Critical (4) | Score: 12 (elevated)
- Predator can physically see where targets are in real-time. One viral story kills app.
- Mitigation: Fuzzy location (500m radius), panic button, phone verification, block/report with 24hr SLA
- Warning: Any harassment/stalking report, spike in blocks, safety-related reviews
- Contingency: Disable accused account immediately, crisis PR template, cooperate with law enforcement

### R-004 | Financial | Runway Depletion
- Prob: High (3) | Impact: Critical (4) | Score: 12
- No revenue model implemented yet. Personal funds only.
- Mitigation: Implement freemium ASAP, monetize Business pillar first, keep burn <$200/mo pre-PMF
- Warning: Monthly burn >$500, savings dropping below 6-month emergency
- Contingency: Downgrade to free tier, monetize Business first, angel round if traction proven

### R-005 | Reputational | Safety Incident Goes Viral
- Prob: Medium (2) | Impact: Critical (4) | Score: 12 (elevated)
- TikTok/Twitter can generate millions of impressions calling F2F "the stalker app"
- Mitigation: Pre-draft crisis comms, build journalist relationships, quarterly safety reports
- Contingency: Founder goes on record immediately, announce improvements within 48hrs

## HIGH PRIORITY (Score 6-8)

### R-006 | Product | Data Breach Exposing Location
- Prob: Medium (2) | Impact: Critical (4) | Score: 8
- Raw lat/lng stored as plain numeric. Photos as base64 in DB. Stack traces leaked in errors.
- Mitigation: Encrypt DB at rest, move photos to S3/R2, encrypt lat/lng, remove stack trace leak

### R-007 | Growth | Chicken-and-Egg Across 3 Pillars
- Prob: High (3) | Impact: High (3) | Score: 9
- Each pillar needs own critical mass
- Mitigation: Launch ONE dominant pillar per market (Social first in Mexico)

### R-008 | Legal | Privacy Law Compliance
- Prob: Medium (2) | Impact: Critical (4) | Score: 8
- No privacy policy, no consent management, no data export/deletion API
- Mitigation: Bilingual privacy policy, consent checkboxes, "Download My Data" API

### R-009 | Product | App Store Rejection
- Prob: High (3) | Impact: High (3) | Score: 9
- Capacitor still says "Bump & Grind". Age gate allows 13+. Missing block/report flow.
- Mitigation: Update config, age gate 18+, implement block/report, add ToS/Privacy URLs

### R-010 | Market | Competitor Copies Live Map
- Prob: High (3) | Impact: High (3) | Score: 9
- Bumble/Tinder could add map feature with 100x engineering resources
- Mitigation: Deep community features, 3-pillar integration as moat, brand loyalty

### R-011 | Product | GPS Battery Drain
- Prob: High (3) | Impact: Medium (2) | Score: 6
- Continuous GPS polls drain battery 3-5x faster
- Mitigation: Adaptive update frequency, significant change monitoring, manual offline toggle

### R-012 | Growth | Gender Imbalance
- Prob: High (3) | Impact: High (3) | Score: 9
- Dating apps historically 70-80% male. Death spiral if women leave.
- Mitigation: Launch Social first, partner women-focused communities, rate-limit bumps

### R-013 | Financial | Server Cost Spikes
- Prob: Medium (2) | Impact: High (3) | Score: 6
- Base64 photos bloat DB. 10K users = 20K writes/min from location pings.
- Mitigation: Move photos to object storage, Redis for location caching, batch updates

### R-014 | Legal | COPPA Violation
- Prob: Medium (2) | Impact: Critical (4) | Score: 8
- Register schema allows age 13+. Minors on live map with adults.
- Mitigation: Raise minimum to 18 IMMEDIATELY, DOB verification, age gate screen

### R-015 | Product | Technical Debt
- Prob: High (3) | Impact: Medium (2) | Score: 6
- 744-line monolith routes.ts. No tests. No CI/CD. db:push in production.
- Mitigation: Add test coverage, GitHub Actions CI, refactor into domain modules

## MEDIUM PRIORITY (Score 3-5)

### R-016 | Market | Dating Market Contraction (Score: 4)
### R-017 | Financial | Failure to Monetize (Score: 6)
### R-018 | Financial | Exchange Rate MXN/USD (Score: 4)
### R-019 | Operational | Content Moderation at Scale (Score: 6)
### R-020 | Product | Platform Dependency Apple/Google (Score: 6)
### R-021 | Growth | User Churn After Finding Partner (Score: 6)
### R-022 | Growth | Geographic Density Limits (Score: 6)
### R-023 | Market | Well-Funded New Entrant (Score: 4)
### R-024 | Legal | Location Data Lawsuit (Score: 4)
### R-025 | Reputational | Hookup Culture Association (Score: 4)
### R-026 | Legal | Patent Troll Litigation (Score: 3)
### R-027 | Operational | Customer Support Overload (Score: 4)
### R-028 | Reputational | Competitor Astroturfing (Score: 3)
### R-029 | Market | Network Effects Favor Incumbents (Score: 6)
### R-030 | Product | Error Handling & Security (Score: 4)

---

## TOP 5 IMMEDIATE ACTIONS
1. **Raise minimum age to 18** in auth.ts registerSchema (COPPA)
2. **Update Capacitor config** — remove "Bump & Grind" references
3. **Remove stack trace leak** in routes.ts:100
4. **Move photos from base64-in-DB** to object storage
5. **Draft privacy policy** for LFPDPPP 2025 compliance

## PRIORITY SUMMARY
| Score | Count | Risk IDs |
|---|---|---|
| 12 (Critical) | 3 | R-001, R-002, R-004 |
| 9-11 (High-Critical) | 6 | R-003, R-005, R-007, R-009, R-010, R-012 |
| 6-8 (Medium-High) | 12 | R-006, R-008, R-011, R-013-R-015, R-017, R-019-R-022, R-029 |
| 3-5 (Medium) | 9 | R-016, R-018, R-023-R-028, R-030 |
