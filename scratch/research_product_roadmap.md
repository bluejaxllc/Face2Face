# Face 2 Face — Product Roadmap

## CURRENT STATE (Already Built)
- ✅ Live Map (Leaflet) with nearby users
- ✅ 3-pillar profiles (Dating, Business, Friendships)
- ✅ Phone verification (OTP)
- ✅ Open messaging (WebSocket)
- ✅ Bump system (likes/pokes with multi-status flow)
- ✅ Content moderation (blocked words EN+ES, tag enforcement)
- ✅ Safety modal + acknowledgment
- ✅ Filter system
- ✅ Profile photos + banner
- ✅ Location-based games (8 games!)
- ✅ Community groups
- ✅ Push notification tokens (Capacitor ready)
- ✅ Subscription tier fields (schema prepared)
- ✅ Dating events system
- ✅ Leaderboard
- ✅ Capacitor Android app
- ✅ GHL integration

## GAPS (Not Yet Built)
- ❌ Block/Report system
- ❌ Age gate enforcement
- ❌ Photo/liveness verification
- ❌ Account deletion flow
- ❌ iOS build
- ❌ Payment/subscription processing
- ❌ Venue check-in / hotspot system
- ❌ Safety center

---

## v1.0 MVP — Day 1 Launch (2-3 weeks remaining)

### Must Have (Ship or Die)
| Feature | Status | Effort | Priority |
|---|---|---|---|
| Live Map | ✅ Built | — | P0 |
| Registration + Phone OTP | ✅ Built | — | P0 |
| 3-Pillar Profiles | ✅ Built | — | P0 |
| Open Messaging | ✅ Built | — | P0 |
| Bump System | ✅ Built | — | P0 |
| Age Gate (18+) | 🔨 Partial | 2-3 days | P0 |
| Block User | ❌ Missing | 3-5 days | P0 |
| Report User | ❌ Missing | 3-5 days | P0 |
| Privacy: Pause Location | 🔨 Partial | 2-3 days | P0 |
| Account Deletion | ❌ Missing | 2-3 days | P0 |
| Privacy Policy + ToS | ❌ Missing | 1-2 days | P0 |

### Cut from v1 (Ship Faster)
- All 8 Map Games (re-enable in v1.5)
- Leaderboard, Community Groups
- Dating Events system
- Business-specific fields (menu, hiring)
- Directional Arrow, Banner Photos

---

## v1.5 — Month 2-3

| Feature | Effort | ICE Score |
|---|---|---|
| Push Notifications | 3-5 days | 8.7 |
| Activity Status ("Active Now") | 2-3 days | 8.3 |
| Re-enable Map Games | Already built | 8.3 |
| Improved Onboarding | 3-5 days | 8.0 |
| Photo Verification | 1-2 weeks | 7.7 |
| Read Receipts | 1-2 days | 7.7 |
| Enhanced Profiles | 1 week | 7.3 |
| Profile Completion Nudges | 2-3 days | 7.3 |
| Basic Analytics | 1 week | 6.3 |

---

## v2.0 — Month 4-6

| Feature | Effort |
|---|---|
| Premium Subscription (Stripe/RevenueCat) | 2-3 weeks |
| iOS Build | 2-3 weeks |
| Events/Meetups Creation | 2-3 weeks |
| Venue Check-ins & Hotspot System | 2-3 weeks |
| Group Activities ("Squads") | 2 weeks |
| Safety Center | 1 week |
| Photo Moderation (automated) | 1-2 weeks |

### Premium Features (Conversion Drivers)
| Feature | Why It Converts |
|---|---|
| See Who Bumped You | #1 conversion driver industry-wide |
| Profile Boost | Highlighted marker on map for 30 min |
| Extended Range | 10mi → 50mi |
| Unlimited Bumps | Free: 10/day; Premium: unlimited |
| Advanced Filters | Filter by pillar-specific fields |
| Incognito Mode | Browse without appearing on map |
| Priority Messages | Gold indicator, top of inbox |

Pricing: $9.99/mo or $59.99/year

---

## v3.0 — Month 7-12

| Feature | Effort |
|---|---|
| B2B Venue Dashboard | 3-4 weeks |
| Business Networking (digital cards, LinkedIn) | 2-3 weeks |
| In-App Event Ticketing | 3-4 weeks |
| Reputation/Trust Scoring | 2-3 weeks |
| Community Moderation Tools | 2 weeks |
| Gamified Onboarding Streaks | 1 week |

---

## Future Vision — Year 2+
- Multi-City Expansion Tools
- API for Venue Partners
- AR Features
- International Expansion (i18n)
- AI-Powered Safety
- Web App (PWA)

---

## DEVELOPMENT BENCHMARKS

| App | Concept → Launch | Team | Funding |
|---|---|---|---|
| Tinder | ~7 months | 5-6 (Hatch Labs) | IAC/Match Group backed |
| Bumble | ~3-4 months | Small + Badoo infra | $10M |
| Grindr | ~6-8 months | Solo + volunteers | $5K personal |
| POF | Solo → 5 years solo | 1 person | $0 bootstrapped |

### Solo Dev Timeline for F2F
| Phase | Duration |
|---|---|
| MVP Gap Closure | 2-3 weeks |
| Android Store Submission | 1-2 weeks |
| iOS Build + Submission | 3-4 weeks |
| v1.5 (Push, Verification, Games) | 4-6 weeks |
| v2.0 (Events, Venues, Premium) | 8-12 weeks |
| v3.0 (B2B, Ticketing, Trust) | 12-16 weeks |

### Stack: Capacitor vs React Native
- Ship v1.0 with Capacitor (already built)
- If 1,000+ DAU, evaluate React Native for v2.0 (6-8 week migration)
- Native map performance worth the investment at scale

### CRITICAL: Update Capacitor Config
- Current: `com.bumpandgrind.app` / "Bump & Grind"
- Change to: `com.face2face.app` / "Face 2 Face"

---

## FEATURE PRIORITY FRAMEWORK

### Retention Impact Ranking
1. Push Notifications (#1 retention lever)
2. Activity Status ("Active Now")
3. Map Games (already built!)
4. Block/Report (safety = retention)
5. Photo Verification
6. Events/Meetups
7. "See Who Bumped You"
8. Group/Squad Feature

### Premium Conversion Ranking
1. See Who Bumped You (industry #1)
2. Profile Boost
3. Extended Range
4. Advanced Filters
5. Incognito Mode
