
# Face 2 Face — Agent Working Agreement (AGENTS.md)

> This file governs all autonomous agents working on this codebase.
> Read this FIRST before modifying any file.

## Project Identity
- **App**: Face 2 Face (external brand) / Bump & Grind (internal / Capacitor bundle)
- **Bundle ID**: `com.bumpandgrind.app`
- **Web**: `bump.bluejax.ai`
- **Backend**: `face2face-production-11ee.up.railway.app` (Railway)
- **DB**: `turntable.proxy.rlwy.net:32022` (Railway Postgres)
- **Test user**: `edgar` / `Legolitas1!` (id=106)

## Architecture
```
client/src/          ← React + Vite web frontend
server/              ← Express.js API
shared/schema.ts     ← Drizzle ORM schema (source of truth for DB)
android/             ← Capacitor Android native shell
capacitor.config.ts  ← Mobile configuration
face2face-mobile/    ← Deprecated (empty, use /android instead)
```

## Non-Negotiable Rules for All Agents

### 1. NEVER modify these files without explicit user approval:
- `shared/schema.ts` (schema changes require DB migration)
- `capacitor.config.ts` (changing appId is permanent)
- `.env` / `.env.local` (contains production secrets)
- `android/app/google-services.json` (Firebase config)

### 2. Auth redirect is intentionally disabled
`App.tsx` lines 136–140 have the auth redirect commented out for testing.
Do NOT uncomment this without confirming with the user — it will break local dev access.

### 3. Always verify with the live URL
After any deploy, take a BrowserOS screenshot of `https://bump.bluejax.ai`
before marking a fix complete.

### 4. Build command
```bash
npm run build
# This runs: vite build + esbuild server + esbuild api + drizzle push
```
If drizzle push fails, the build may still succeed — check separately.

### 5. Deployment
- **Web**: `vercel --prod` (auto-deploys on git push to main via Vercel)
- **Backend**: Push to `main` triggers Railway redeploy automatically
- **Android**: `npx cap sync android && cd android && ./gradlew assembleDebug`

## Active CHAMP Loop
This project is under autonomous CHAMP (Continuous Heuristic Audit & Mission Progress)
agent supervision. Each loop iteration:
1. AUDITOR screenshots all screens on `bump.bluejax.ai`
2. Issues logged to `f2f_audit_log.md` (in antigravity brain dir)
3. BUILDER fixes issues in isolated branch workspace
4. Deploy + visual verify
5. Repeat

## Known Issues (Pre-Audit)
- Auth redirect disabled (intentional for now)
- `face2face-mobile/` directory is empty (mobile is Capacitor-based, in `/android`)
- Demo accounts prefixed `demo_` bypass 30-min location timeout

## Store Release Blockers
- [ ] App name decision (Face 2 Face vs Bump & Grind on stores)
- [ ] DUNS number (required for Apple — start application ASAP)
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25 one-time)
- [ ] Privacy Policy at a live URL
- [ ] Terms of Service at a live URL
- [ ] Content rating questionnaire
- [ ] All icon + splash screen sizes generated
