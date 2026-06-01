# Face 2 Face — Regulatory & Legal Compliance Landscape

## Architecture Context (from codebase analysis)
- **Location**: Stores latitude/longitude as numeric fields (persistent, not ephemeral)
- **Distance**: Haversine formula with 3-mile "bumping distance"
- **No biometric collection**: Profile photos as base64, no facial geometry
- **No algorithmic matching**: Live map, no swipe/match system
- **Content moderation**: Keyword-based blocked word filter
- **Age field**: Collects age (default 18) and DOB, no verification beyond self-declaration
- **Phone verification**: phoneNumber, isPhoneVerified, verificationCodes table
- **Open messaging**: Any user can message any other user

---

## 1. US PRIVACY LAWS

### California — CCPA/CPRA
- **Statute**: Cal. Civ. Code §1798.100–199.100
- Precise geolocation = sensitive PI → Must provide "Limit Use" mechanism
- Sexual orientation inferences from datingPreference field
- Rights: delete, know/access, Universal opt-out (GPC)
- **Penalties**: $2,500/unintentional, $7,500/intentional per violation

### Virginia — VCDPA
- **Statute**: Va. Code §59.1-575 et seq.
- Opt-in consent required for sensitive data (geolocation, sexual orientation)
- Data Protection Assessments mandatory
- **Penalties**: Up to $7,500 per violation

### Colorado — CPA + Dating App Safety Law (SB24-011)
- **Statute**: C.R.S. §6-1-1301 et seq.
- Opt-in consent, granular consent per purpose, GPC
- **SB24-011**: Published safety policy, misconduct reporting, annual AG reports
- **Penalties**: $20,000 per violation

### Connecticut — CTDPA
- **Statute**: Conn. Gen. Stat. §42-515 et seq.
- Opt-in for geolocation + **active geolocation indicator** required
- Online Safety Center mandatory for dating platforms
- **Penalties**: $5,000 per violation

### Texas — TDPSA
- **Statute**: Tex. Bus. & Com. Code §541.001 et seq.
- Precise geolocation (within 1,750 ft) = sensitive data
- **Penalties**: Up to $25,000 per violation

### New Jersey — Internet Dating Safety Act
- **Statute**: N.J.S.A. 56:8-171 et seq.
- Safety awareness notifications required
- Background check disclosure in **bold, capital letters, 12-point type**
- **Penalties**: Treble (3x) damages

### FTC Act — Section 5
- **Statute**: 15 U.S.C. §45
- Cannot make misleading privacy promises
- Recent enforcement: Match Group ($14M), OkCupid privacy action, Grindr ($20M)
- F2F: ✅ Naturally aligned with no-sharing philosophy

---

## 2. INTERNATIONAL PRIVACY LAWS

### GDPR (EU/EEA)
- Explicit consent for location data + sexual orientation
- Privacy by Design (Art. 25), DPIA (Art. 35) mandatory
- Right to erasure, data portability, 72-hour breach notification
- DPO required, SCCs for US servers
- **Penalties**: Up to €20M or 4% of global turnover

### PIPEDA (Canada)
- Meaningful consent, accountability, limiting collection
- Retention schedule required
- **Penalties**: Up to CAD $100,000 per violation

### LGPD (Brazil)
- Similar to GDPR, DPO ("Encarregado") required
- Explicit consent for sensitive data
- **Penalties**: Up to 2% of revenue (capped R$50M)

---

## 3. APP STORE REQUIREMENTS

### Apple App Store
- Must be rated **17+** for dating
- Privacy Nutrition Labels required
- Photo verification expected, safety documentation for review
- Guideline 4.3: Must offer unique features

### Google Play Store
- "Restrict Declared Minors" setting required (Jan 2026)
- Child Safety Standards compliance (March 2025)
- Safety point of contact designation required

---

## 4. AGE VERIFICATION

### COPPA (Federal)
- **Statute**: 15 U.S.C. §§6501-6506
- No under-13 registration allowed
- Verifiable parental consent required for under-13
- **Penalties**: $53,088 per violation (2026)

### State Laws (Utah, Florida, Arkansas)
- Various age verification + parental consent requirements
- Most in active litigation and enjoined
- F2F: Enforce 18+ minimum → low risk

---

## 5. SEX OFFENDER REGISTRY

- **No federal mandate** requiring checks
- NJ requires disclosure of whether checks are conducted
- Match Group: Garbo partnership for voluntary checks
- Industry standard: ToS prohibition + user reports
- **Recommendation**: Disclose non-screening, add ToS prohibition

---

## 6. LOCATION DATA CONSENT

| Jurisdiction | Consent Type |
|---|---|
| California | Opt-out (must provide mechanism) |
| Virginia, Colorado, Texas | Opt-in |
| Connecticut | Opt-in + visual signal |
| GDPR | Opt-in (explicit) |
| Canada, Brazil | Opt-in (informed/explicit) |

### Critical Recommendation: Make Location Ephemeral
1. Store live location only in memory/Redis
2. Auto-delete when user goes inactive
3. Just-in-time consent with plain-language explanation
4. Visible location indicator (CT requirement)
5. "Pause location" toggle

---

## 7. SAFETY FEATURES — Industry Standard Required

1. Block/Report functionality
2. Safety tips
3. In-app emergency contacts
4. Content moderation
5. Photo verification
6. Account verification
7. Safety center/hub
8. Misconduct response procedures

---

## 8. TERMS OF SERVICE — Required Clauses

- Mandatory arbitration + class action waiver
- Limitation of liability
- User conduct policies (18+, accurate info, prohibited activities)
- Section 230 protections
- CA-specific disclosures
- NJ background check disclosure
- Privacy policy integration
- GDPR rights (if serving EU)

---

## COMPLIANCE PRIORITY MATRIX

| Priority | Area | Status | Risk |
|---|---|---|---|
| 🔴 CRITICAL | Ephemeral location storage | Not implemented | EXTREME |
| 🔴 CRITICAL | Privacy Policy + ToS | Not drafted | EXTREME |
| 🔴 CRITICAL | Opt-in consent flow for location | Not implemented | HIGH |
| 🟠 HIGH | Age gate / verification (18+) | Self-declared only | HIGH |
| 🟠 HIGH | Block/Report functionality | Not in schema | HIGH |
| 🟠 HIGH | Safety policy / Safety center | Not built | HIGH |
| 🟡 MEDIUM | Background check disclosure (NJ) | Not present | MEDIUM |
| 🟡 MEDIUM | GDPR compliance (DPIA, DPO, SCCs) | Not started | MEDIUM |
| 🟢 LOW | Sex offender registry check | Not implemented | LOW |

## F2F Architecture Advantages
1. ✅ No algorithms = no profiling liability
2. ✅ No biometric collection = no BIPA exposure
3. ✅ No third-party data sharing = reduced FTC risk
4. ✅ Open messaging = no deceptive "fake match" practices
5. ✅ Content moderation = existing baseline
