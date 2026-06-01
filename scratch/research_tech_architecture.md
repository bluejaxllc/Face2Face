# Face 2 Face — Technical Architecture

## CURRENT STACK
- Frontend: React (Vite) + Capacitor (Android wrapper)
- Backend: Express.js + Drizzle ORM + PostgreSQL (Neon serverless)
- Auth: Session-based (scrypt hashing, express-session + connect-pg-simple)
- Map: Leaflet (react-leaflet) — WebView-based
- Location: Raw lat/lng as numeric columns, Haversine in JS, NO PostGIS
- Real-time: `ws` dependency exists but NOT wired up
- Mobile: Capacitor plugins (geolocation, camera, push, haptics)
- Hosting: Railway (Dockerfile + nixpacks)

## CRITICAL ARCHITECTURE GAPS
1. No PostGIS — nearby query does full table scan
2. Photos stored as base64 in PostgreSQL (no CDN)
3. No WebSocket broadcast — clients must poll
4. No Redis caching layer
5. No spatial indexing
6. Session-cookie auth (won't work for native mobile)

---

## 1. TECH STACK COMPARISON

### Capacitor vs React Native vs Flutter
| Factor | Capacitor (Current) | React Native + Expo | Flutter |
|---|---|---|---|
| Dev Speed | Fastest (reuse web) | Fast (OTA, hot reload) | Fast (Dart learning curve) |
| Map Performance | WebView Leaflet (sluggish) | Native MapView (60fps) | Native MapView (60fps) |
| Background Location | Limited by WebView | Excellent (expo-location) | Excellent (native) |
| Battery Efficiency | Poor (WebView always running) | Good (native modules) | Best (compiled ARM) |
| **Recommendation** | Ship v1, migrate at 1K+ DAU | Correct migration target | Not recommended (Dart) |

### Supabase vs Firebase vs Custom
| Factor | Supabase | Firebase | Current Express |
|---|---|---|---|
| Geospatial | PostGIS native ✅ | Geohashing workarounds | Manual Haversine |
| Real-time | Postgres WAL Realtime | Best-in-class | Manual WebSocket |
| SQL Joins | Full relational ✅ | None (NoSQL) | Full (Drizzle) |
| Pricing | Predictable | Per-read (expensive!) | Server cost only |
| Vendor Lock-in | Low (open-source PG) | High (proprietary) | None |
| **Recommendation** | Ideal middle ground → migrate | Too expensive at scale | Good foundation |

### PostGIS: Why It's Essential
Current: Full table scan + JS filtering (O(n))
PostGIS: GiST spatial index (O(log n))
```sql
SELECT *, ST_DistanceSphere(
  ST_MakePoint(longitude, latitude),
  ST_MakePoint($userLon, $userLat)
) as distance
FROM users
WHERE ST_DWithin(geography(...), geography(...), $radiusMeters)
AND is_active = true
ORDER BY distance;
```

### WebSocket vs SSE → Use Hybrid
- HTTP POST for sending location updates (batchable)
- Supabase Realtime (WebSocket) for receiving nearby updates + chat
- Avoid managing raw WebSocket infrastructure

## 2. SCALABILITY ARCHITECTURE

### Scaling by User Count
| Scale | Architecture | Cost/mo |
|---|---|---|
| 10K | Supabase Pro + single server | $25-75 |
| 100K | + Redis cache + CDN | $200-500 |
| 1M | + Redis Cluster + dedicated DB | $2K-5K |
| 10M | Custom PG cluster + Kafka + K8s | $20K-50K |

### Geospatial Indexing
1. **R-Trees (PostGIS GiST)**: Primary — use now. O(log n) queries.
2. **Geohashing (Redis GEOSEARCH)**: Hot cache at 100K+ users.
3. **H3 Hexagons (Uber)**: Analytics at 1M+ users.

### Caching Architecture
```
User opens map → Redis GEOSEARCH (sub-ms)
                    ↓ miss?
                  PostGIS query → populate Redis (TTL 30s)
```
Redis: $0 free tier (30MB) → $7/mo (250MB)

### CDN / Image Pipeline
Current: base64 in PostgreSQL (terrible)
Recommended:
1. Compress on-device (max 500KB)
2. Upload to Supabase Storage
3. Serve via Cloudflare CDN (free)
4. WebP format (30% smaller), AVIF for modern
5. Generate thumbnails: 64x64, 128x128, 512x512
Moving photos out = 80%+ DB size reduction

## 3. REAL-TIME LOCATION PATTERNS

### Precedents
- **Grindr**: Snap-to-grid (variable resolution by density)
- **Uber**: GPS every 3-5s → Kafka → Redis GEOADD → H3 dispatch → WebSocket push
- **Pokémon GO**: GKE K8s + Cloud Spanner (1M TPS) + Redis Enterprise + spatial sharding

### GPS Polling (F2F Recommendation)
| State | Interval | Battery |
|---|---|---|
| Foreground, map visible | 10-15 seconds | Moderate |
| Foreground, other screen | 30-60 seconds | Low |
| Background, active | 2-5 minutes | Minimal |
| Background, stationary | Geofence trigger only | Near-zero |
| Inactive | Stop tracking | Zero |

### Client-Side Filtering
1. Viewport culling (only visible area)
2. Delta updates (changed positions only)
3. Category filtering locally (Social/Business/Love)
4. Distance bands with decreasing refresh rates

## 4. PRIVACY-FIRST ARCHITECTURE

### Location Fuzzing
1. Precision reduction (2 decimal places = ~1.1km)
2. Random offset (±200m noise)
3. Distance bands ("< 1 mile" not "0.3 miles")
4. Never expose exact distances

### Anti-Trilateration Defenses
1. Show distance bands only ("Nearby", "< 1 mi")
2. Add random noise changing per query
3. Rate limit distance queries (1 per 30s)
4. Cache displayed distances for 5 minutes
5. Minimum display distance of 500m

### E2E Encryption Options
1. Signal Protocol (gold standard, complex)
2. Matrix/Olm (open standard, easier SDK)
3. Simple AES + Diffie-Hellman (MVP)
4. **Start with**: Supabase RLS + TLS (not E2EE but sufficient for MVP)

### Data Minimization
- No historical location storage (only current)
- Auto-expire after 30 min inactivity
- No third-party location sharing
- One-click deletion purges everything

## 5. SECURITY

### Auth: Migrate to JWT
| Current | Recommended |
|---|---|
| Username/password + cookies | Phone OTP + JWT |
| GHL SMS (custom) | Supabase Auth (built-in) |
| No social login | Google, Apple Sign-In |
| Cookie unreliable in native | JWT in headers (excellent) |

### Rate Limiting (Expand)
- /api/auth/register: 5/hour/IP
- /api/auth/login: 10/15min/IP
- /api/users/location: 1/10s/user
- /api/users/nearby: 1/30s/user
- /api/bumps: 20/hour/user
- /api/messages: 60/min/user

### Content Moderation Pipeline
```
Upload → Automated (sub-200ms)
  ├── Image: NSFW detection (Vision API / NudeNet)
  ├── Text: Profanity + scam patterns
  └── Behavior: Spam detection
→ High confidence → Auto-block
→ Medium → Human review queue
→ Low → Allow with monitoring
```

### Photo Verification Options (by cost)
1. Manual selfie match (free)
2. AWS Rekognition ($1/1K images)
3. face-api.js on Edge Functions (free, open source)
4. Jumio/Onfido ($2-5/verification)
5. iOS Vision / Android ML Kit (free, on-device)

## 6. COST OPTIMIZATION

### Supabase Tiers
| Tier | Price | Limits |
|---|---|---|
| Free | $0 | 500MB, 50K MAU, auto-pause 7 days |
| Pro | $25/mo | 8GB, 100K MAU, no pause ✅ LAUNCH HERE |
| Team | $599/mo | Read replicas, SOC2 |

### Startup Credits
| Program | Credits | Requirements |
|---|---|---|
| AWS Activate Founders | $1,000 | No VC needed |
| AWS Activate Portfolio | Up to $100K | VC/accelerator |
| Google for Startups | $2K-$200K | Website + domain |
| Google AI Startups | Up to $350K | AI-first |
| Microsoft Founders Hub | Up to $150K | Any startup |

## 7. SIMPLICITY AS ADVANTAGE

### POF: 1.5B Pageviews on <10 Servers
- No frameworks, everything from scratch
- 2 web servers + 3 DB servers
- CDN for images (Akamai)
- RAM caching, gzip everything
- Result: $10M/yr, sold for $575M, never raised VC

### Boring Technology Thesis
F2F's 3 innovation tokens:
1. Real-time location map (core differentiator)
2. Three-pillar system (Social/Business/Love)
3. "Bump" interaction model
Everything else should be boring: Postgres, React, Express

### No-Algorithm = 10-100x Compute Savings
- Tinder: ML per-swipe + A/B testing + engagement loops = $0.001-0.01/user/day
- F2F: Single PostGIS query per refresh = $0.0001/user/day

## 8. MOBILE CONSIDERATIONS

### Battery Optimization
- Android: Foreground Service + BALANCED_POWER_ACCURACY + 2min batch
- iOS: Significant Location Change + distanceFilter:100 + batch
- F2F: 30s foreground, significant-change background is sufficient

### Push Notifications
Architecture: Backend event → FCM (free, handles iOS+Android) → Deep link
Types:
1. "Someone bumped you!" → bump screen
2. "New message" → chat thread
3. "3 people nearby" → map (max 1/hour)

### Deep Linking
```
face2face://profile/{userId}
face2face://event/{eventId}
face2face://chat/{userId}
https://face2face.app/join → store/waitlist
```

---

## IMMEDIATE ACTION ITEMS
1. Move photos out of DB → Supabase Storage (biggest win)
2. Enable PostGIS → spatial index on users table
3. Migrate auth to JWT → Supabase Auth phone OTP
4. Add Supabase Realtime → replace polling
5. Apply for startup credits → Microsoft + AWS (free money)
6. Implement location fuzzing → never expose exact coords
7. Add Redis cache → GEOSEARCH for hot queries
8. Plan React Native migration → Capacitor bottlenecks map
