/**
 * inject_research.cjs — Injects new research panels into the F2F dashboard
 * Run: node scratch/inject_research.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'dashboard-deploy', 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

// ──────────────────────────────────────────────
// 1. Define all new panels (tab-id, category, nav label, HTML content)
// ──────────────────────────────────────────────

const newPanels = [];

// =============================================
// PANEL: Cohort Analysis & Retention
// =============================================
newPanels.push({
  id: 'cohortanalysis',
  cat: 'research',
  label: '📊 Cohort Analysis',
  color: 'var(--teal)',
  html: `
<div class="tab-panel" id="tab-cohortanalysis">
  <div class="section-header">
    <h2>📊 Cohort Analysis & Retention Frameworks</h2>
    <p>Retention benchmarks, churn prediction models, engagement scoring, and LTV calculation for dating apps</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">~35%</div><div class="stat-lbl">Tinder D1 Retention</div></div>
    <div class="stat-block"><div class="stat-val">~15%</div><div class="stat-lbl">Dating App D7 Avg</div></div>
    <div class="stat-block"><div class="stat-val">3:1</div><div class="stat-lbl">Min LTV:CAC</div></div>
    <div class="stat-block"><div class="stat-val">5-8%</div><div class="stat-lbl">Freemium Conv</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📈</span> Retention Benchmarks by Category</h3>
      <table class="inf-table">
        <tr><th>Metric</th><th>Dating Apps</th><th>Social Apps</th><th>All Apps</th></tr>
        <tr><td>D1</td><td>25-35%</td><td>30-40%</td><td>22-26%</td></tr>
        <tr><td>D7</td><td>10-18%</td><td>15-25%</td><td>10-13%</td></tr>
        <tr><td>D14</td><td>6-12%</td><td>10-18%</td><td>6-8%</td></tr>
        <tr><td>D30</td><td>4-10%</td><td>8-15%</td><td>4-6%</td></tr>
        <tr><td>D60</td><td>3-7%</td><td>5-10%</td><td>2-4%</td></tr>
        <tr><td>D90</td><td>2-5%</td><td>4-8%</td><td>1-3%</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🔮</span> Churn Prediction Signals</h3>
      <ul>
        <li><strong>Reduced swipe activity:</strong> 40%+ drop in daily swipes → 85% churn probability within 7 days</li>
        <li><strong>Message response time:</strong> Response latency &gt;24h → high churn risk</li>
        <li><strong>Session frequency drop:</strong> From daily to &lt;3x/week → warning signal</li>
        <li><strong>Profile staleness:</strong> No photo/bio updates in 30+ days</li>
        <li><strong>Match-to-chat ratio:</strong> Matches without messages → disengagement</li>
      </ul>
      <p style="margin-top:1rem"><span class="tag success">Best ML Models</span> Survival analysis (Cox) for time-to-churn, Random Forest for binary churn, Logistic Regression for interpretability</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">⚡</span> Engagement Scoring Framework</h3>
    <div class="grid-3">
      <div>
        <p><strong>Profile Completeness (20%)</strong></p>
        <ul>
          <li>Photos uploaded (0-9)</li>
          <li>Bio filled</li>
          <li>Prompts answered</li>
          <li>Verification completed</li>
        </ul>
      </div>
      <div>
        <p><strong>Activity (40%)</strong></p>
        <ul>
          <li>Daily active time</li>
          <li>Swipes/bumps per session</li>
          <li>Messages sent/received ratio</li>
          <li>Matches made weekly</li>
        </ul>
      </div>
      <div>
        <p><strong>Outcomes (40%)</strong></p>
        <ul>
          <li>Real-world meetups scheduled</li>
          <li>Chat conversation depth</li>
          <li>Return visits same day</li>
          <li>Feature exploration (games, groups)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🔄</span> Reactivation Strategies</h3>
      <ul>
        <li><strong>Push timing:</strong> Tuesdays & Sundays 7-9 PM = peak engagement</li>
        <li><strong>"Someone liked you":</strong> Most effective win-back hook (3-5x CTR vs generic)</li>
        <li><strong>Profile boost incentive:</strong> "Come back and get a free Boost" — 15-25% reactivation rate</li>
        <li><strong>New feature announcements:</strong> Effective for 30-60 day churned users</li>
        <li><strong>Seasonal campaigns:</strong> Valentine's, New Year, summer = natural re-engagement windows</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">💰</span> LTV Calculation</h3>
      <p><strong>Formula:</strong> LTV = ARPPU × (1/Monthly Churn Rate)</p>
      <ul>
        <li><strong>ARPPU:</strong> $15-25/month (US dating apps)</li>
        <li><strong>Average subscriber lifetime:</strong> 3-6 months</li>
        <li><strong>Subscription + IAP blend:</strong> $45-150 LTV per paying user</li>
        <li><strong>Including ads:</strong> Add $0.50-2.00/user/month for free tier</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag gold">Target</span> LTV:CAC &gt; 3:1 minimum, 5:1+ ideal for sustainability</p>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: LATAM Market Deep-Dive
// =============================================
newPanels.push({
  id: 'latammarket',
  cat: 'research',
  label: '🌎 LATAM Market',
  color: 'var(--warning)',
  html: `
<div class="tab-panel" id="tab-latammarket">
  <div class="section-header">
    <h2>🌎 LATAM Dating App Market — Mexico Focus</h2>
    <p>Market sizing, city-level analysis, cultural norms, payment infrastructure, and growth opportunities</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">$343M</div><div class="stat-lbl">Mexico by 2030</div></div>
    <div class="stat-block"><div class="stat-val">7.2%</div><div class="stat-lbl">CAGR (Fastest LATAM)</div></div>
    <div class="stat-block"><div class="stat-val">$1.26B</div><div class="stat-lbl">LATAM Total by 2030</div></div>
    <div class="stat-block"><div class="stat-val">22M</div><div class="stat-lbl">CDMX Metro Pop</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📊</span> Top Apps in Mexico (Downloads)</h3>
      <table class="inf-table">
        <tr><th>App</th><th>Position</th><th>Key Strength</th></tr>
        <tr><td>Tinder</td><td>#1</td><td>Brand awareness, largest user base</td></tr>
        <tr><td>Badoo</td><td>#2</td><td>Free messaging, strong in LATAM</td></tr>
        <tr><td>Bumble</td><td>#3</td><td>Women-first, professional demographic</td></tr>
        <tr><td>Facebook Dating</td><td>#4</td><td>Free, leverages FB social graph</td></tr>
        <tr><td>Grindr</td><td>#5</td><td>LGBTQ+ dominant</td></tr>
        <tr><td>Chispa</td><td>#6</td><td>Match Group's Latino-focused app</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🏙️</span> City-Level Analysis</h3>
      <ul>
        <li><strong>Mexico City (22M metro):</strong> Highest density, tech-savvy, cosmopolitan. ~65% smartphone penetration. Primary launch market.</li>
        <li><strong>Guadalajara (5M):</strong> Mexico's Silicon Valley. Young, educated demographic. Strong startup culture.</li>
        <li><strong>Monterrey (5M):</strong> Wealthiest per-capita. Business networking potential. Conservative dating culture.</li>
        <li><strong>Puebla (3M):</strong> University city. Large 18-25 demographic. Price-sensitive.</li>
        <li><strong>Tijuana (2M):</strong> Cross-border dynamics. Bilingual users. Unique US-Mexico overlap.</li>
      </ul>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🇲🇽</span> Cultural Dating Norms</h3>
      <ul>
        <li><strong>Group dating:</strong> Common for initial meetings — design for group events</li>
        <li><strong>Family involvement:</strong> Earlier than US — consider "meet the family" features</li>
        <li><strong>WhatsApp-first:</strong> Users quickly move to WhatsApp — optimize for handoff</li>
        <li><strong>Machismo considerations:</strong> Women's safety features = critical differentiator</li>
        <li><strong>Religiosity:</strong> Catholic values influence dating expectations</li>
        <li><strong>Bilingual UX:</strong> Spanish primary, but code-switching common in CDMX/Monterrey</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">💳</span> Payment Infrastructure</h3>
      <ul>
        <li><strong>OXXO (cash):</strong> 40%+ of e-commerce payments. Must integrate for mass adoption</li>
        <li><strong>SPEI (bank transfer):</strong> Growing fast. Low friction for banked users</li>
        <li><strong>Credit cards:</strong> ~30% penetration. Higher-income segment only</li>
        <li><strong>Pricing sensitivity:</strong> Subscriptions at 40-60% of US pricing ($3-8/mo sweet spot)</li>
        <li><strong>App Store billing:</strong> Simplest but higher fees (30%)</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag danger">Critical</span> Without OXXO integration, you lose 40%+ of potential paying users in Mexico</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">🚀</span> Growth Opportunities</h3>
    <div class="grid-3">
      <div><span class="tag success">Underserved</span><p style="margin-top:0.5rem">Professional networking in dating (no local competitor). F2F's three-pillar model uniquely positioned.</p></div>
      <div><span class="tag purple">LGBTQ+</span><p style="margin-top:0.5rem">Growing acceptance, especially in CDMX. Grindr dominates but limited to gay men. Opportunity for inclusive platform.</p></div>
      <div><span class="tag gold">Events</span><p style="margin-top:0.5rem">Thursday's model adapted to Mexico City's vibrant nightlife scene. Venue partnerships with bars/restaurants.</p></div>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: Pricing & Paywall Strategy
// =============================================
newPanels.push({
  id: 'pricingstrategy',
  cat: 'strategy',
  label: '💲 Pricing Intel',
  color: 'var(--gold)',
  html: `
<div class="tab-panel" id="tab-pricingstrategy">
  <div class="section-header">
    <h2>💲 Pricing & Paywall Strategy Deep-Dive</h2>
    <p>Competitor pricing analysis, optimal paywall placement, IAP strategy, and revenue diversification</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">5-8%</div><div class="stat-lbl">Tinder Conv Rate</div></div>
    <div class="stat-block"><div class="stat-val">15-20%</div><div class="stat-lbl">Hinge Conv Rate</div></div>
    <div class="stat-block"><div class="stat-val">$15-25</div><div class="stat-lbl">ARPPU/Month (US)</div></div>
    <div class="stat-block"><div class="stat-val">$499</div><div class="stat-lbl">Tinder Select/Mo</div></div>
  </div>

  <div class="card">
    <h3><span class="emoji">💰</span> Competitor Pricing Matrix</h3>
    <table class="inf-table">
      <tr><th>App</th><th>Free</th><th>Tier 1</th><th>Tier 2</th><th>Tier 3</th><th>Key IAPs</th></tr>
      <tr><td>Tinder</td><td>Limited likes</td><td>Plus ~$25/mo</td><td>Gold ~$40/mo</td><td>Platinum ~$50/mo</td><td>Boosts $6, Super Likes $5</td></tr>
      <tr><td>Bumble</td><td>Basic swiping</td><td>Boost ~$20/mo</td><td>Premium ~$40/mo</td><td>Premium+ ~$50/mo</td><td>SuperSwipes, Spotlights</td></tr>
      <tr><td>Hinge</td><td>8 likes/day</td><td>Hinge+ ~$33/mo</td><td>HingeX ~$50/mo</td><td>—</td><td>Roses (1 free/week), Boosts</td></tr>
      <tr><td>Grindr</td><td>Ads + grid</td><td>XTRA ~$23/mo</td><td>Unlimited ~$45/mo</td><td>EDGE $80-220/wk(!)</td><td>Boosts, Extra Taps</td></tr>
      <tr><td>CMB</td><td>Daily bagels</td><td>Premium ~$15-35/mo</td><td>—</td><td>—</td><td>Beans currency</td></tr>
      <tr><td>Feeld</td><td>Basic</td><td>Majestic ~$30/mo</td><td>—</td><td>—</td><td>Pings</td></tr>
      <tr><td>FB Dating</td><td>100% FREE</td><td>—</td><td>—</td><td>—</td><td>None</td></tr>
    </table>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🚪</span> Optimal Paywall Placement</h3>
      <p><strong>Highest conversion features:</strong></p>
      <ul>
        <li><span class="tag gold">#1</span> <strong>See Who Liked You</strong> — Highest conversion driver across all apps</li>
        <li><span class="tag gold">#2</span> <strong>Unlimited Likes/Bumps</strong> — Core engagement limiter</li>
        <li><span class="tag">#3</span> <strong>Advanced Filters</strong> (age, distance, height, education)</li>
        <li><span class="tag">#4</span> <strong>Rewind/Undo</strong> — Loss aversion psychology</li>
        <li><span class="tag">#5</span> <strong>Read Receipts</strong> — Anxiety-driven purchase</li>
        <li><span class="tag">#6</span> <strong>Incognito/Invisible Mode</strong> — Privacy premium</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">🇲🇽</span> Mexico Pricing Strategy</h3>
      <ul>
        <li><strong>PPP adjustment:</strong> 40-60% of US pricing</li>
        <li><strong>Free tier sweet spot:</strong> $0 with 15-20 daily bumps, basic filters</li>
        <li><strong>Basic tier:</strong> $3.99-5.99/mo (MXN ~$79-119)</li>
        <li><strong>Premium tier:</strong> $7.99-9.99/mo (MXN ~$159-199)</li>
        <li><strong>Annual discount:</strong> 40-50% off monthly</li>
        <li><strong>IAP boosts:</strong> $0.99-2.99 each (MXN ~$19-59)</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag warning">Key Insight</span> Annual subscribers have 2-3x higher LTV even at discount</p>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: User Acquisition
// =============================================
newPanels.push({
  id: 'useracquisition',
  cat: 'growth',
  label: '🎯 UA Strategy',
  color: 'var(--accent)',
  html: `
<div class="tab-panel" id="tab-useracquisition">
  <div class="section-header">
    <h2>🎯 User Acquisition Strategy</h2>
    <p>CPI benchmarks, channel strategies, LATAM-specific tactics, and budget allocation frameworks</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">$2-5</div><div class="stat-lbl">Meta CPI (US)</div></div>
    <div class="stat-block"><div class="stat-val">$1-3</div><div class="stat-lbl">TikTok CPI (US)</div></div>
    <div class="stat-block"><div class="stat-val">60%</div><div class="stat-lbl">Cheaper in LATAM</div></div>
    <div class="stat-block"><div class="stat-val">3-6 mo</div><div class="stat-lbl">Payback Period</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📊</span> CAC by Channel</h3>
      <table class="inf-table">
        <tr><th>Channel</th><th>CPI (US)</th><th>CPI (Mexico)</th><th>Quality</th></tr>
        <tr><td>Meta/Facebook</td><td>$2-5</td><td>$0.80-2</td><td>⭐⭐⭐⭐</td></tr>
        <tr><td>TikTok Ads</td><td>$1-3</td><td>$0.50-1.50</td><td>⭐⭐⭐</td></tr>
        <tr><td>Google UAC</td><td>$3-7</td><td>$1.20-3</td><td>⭐⭐⭐⭐⭐</td></tr>
        <tr><td>Apple Search Ads</td><td>$2-4</td><td>$1-2.50</td><td>⭐⭐⭐⭐⭐</td></tr>
        <tr><td>Influencer</td><td>$1-4</td><td>$0.30-1</td><td>⭐⭐⭐</td></tr>
        <tr><td>Organic/ASO</td><td>$0</td><td>$0</td><td>⭐⭐⭐⭐</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">💡</span> Organic Growth Levers</h3>
      <ul>
        <li><strong>ASO:</strong> 65-70% of installs come from app store search. Optimize keywords aggressively.</li>
        <li><strong>Campus strategy:</strong> Tinder's playbook — saturate one university at a time. Free pizza + branded events.</li>
        <li><strong>Referral loops:</strong> "Invite 3 friends, get a free Boost" — targeting 1.2+ K-factor</li>
        <li><strong>Content/UGC:</strong> TikTok dating stories, "I met my partner on F2F" — highest organic reach</li>
        <li><strong>PR/Press:</strong> "The anti-swipe dating app" narrative — 5-10x ROI vs paid ads</li>
        <li><strong>Waitlist/FOMO:</strong> Thursday's model — limited access creates viral demand</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">💸</span> Budget Allocation Framework</h3>
    <div class="grid-3">
      <div>
        <p><strong>$5K/mo (Seed)</strong></p>
        <ul>
          <li>60% Meta Ads ($3K)</li>
          <li>20% TikTok ($1K)</li>
          <li>15% Influencer ($750)</li>
          <li>5% ASO tools ($250)</li>
        </ul>
      </div>
      <div>
        <p><strong>$25K/mo (Series A)</strong></p>
        <ul>
          <li>40% Meta ($10K)</li>
          <li>25% TikTok ($6.25K)</li>
          <li>15% Google ($3.75K)</li>
          <li>10% Apple Search ($2.5K)</li>
          <li>10% Influencer ($2.5K)</li>
        </ul>
      </div>
      <div>
        <p><strong>$50K/mo (Growth)</strong></p>
        <ul>
          <li>35% Meta ($17.5K)</li>
          <li>20% TikTok ($10K)</li>
          <li>15% Google ($7.5K)</li>
          <li>10% Apple ($5K)</li>
          <li>10% Influencer ($5K)</li>
          <li>10% Events/PR ($5K)</li>
        </ul>
      </div>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: A/B Test Playbook
// =============================================
newPanels.push({
  id: 'abtestplaybook',
  cat: 'tools',
  label: '🧪 Test Playbook',
  color: 'var(--accent-secondary)',
  html: `
<div class="tab-panel" id="tab-abtestplaybook">
  <div class="section-header">
    <h2>🧪 A/B Test Playbook — Proven Experiments</h2>
    <p>Battle-tested experiments from Tinder, Bumble, Hinge, and CMB with specific percentage lifts</p>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📱</span> Onboarding Flow Tests</h3>
      <ul>
        <li><strong>Photo-first vs bio-first:</strong> Photo-first increases completion by 15-25% (Hinge data)</li>
        <li><strong>3 steps vs 7 steps:</strong> 3-step = 40% higher completion but lower profile quality. Sweet spot: 5 steps.</li>
        <li><strong>Progressive profiling:</strong> Ask for more data post-signup → 2x profile completeness vs upfront ask</li>
        <li><strong>Skip options:</strong> Adding "Skip for now" on optional fields increases completion by 20-30%</li>
        <li><strong>Social login:</strong> Phone # sign-up outperforms email by 35% in dating apps</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">💬</span> Messaging Tests</h3>
      <ul>
        <li><strong>First-message prompts:</strong> Pre-written icebreakers increase first messages by 40% (Hinge)</li>
        <li><strong>Women-message-first:</strong> Bumble's model → 60% higher response rates than open messaging</li>
        <li><strong>Voice notes in chat:</strong> 3x longer conversations vs text-only (Bumble data)</li>
        <li><strong>Chat expiration:</strong> CMB's 7-day timer → 2x meetup rate vs unlimited chat</li>
        <li><strong>Read receipts (premium):</strong> 12% subscription conversion driver (CMB)</li>
      </ul>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🔔</span> Notification Optimization</h3>
      <ul>
        <li><strong>Peak engagement:</strong> Tuesdays & Sundays 7-9 PM local time</li>
        <li><strong>"Someone liked you":</strong> 3-5x CTR vs "Check out new profiles"</li>
        <li><strong>Personalized copy:</strong> "[Name] liked your photo" → 2x open rate vs generic</li>
        <li><strong>Frequency cap:</strong> Max 3-5 pushes/day before opt-out spike</li>
        <li><strong>Rich notifications:</strong> Profile photo preview → 25% higher tap rate</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">💰</span> Paywall Experiments</h3>
      <ul>
        <li><strong>Hard vs soft paywall:</strong> Soft paywall (limited free + upgrade prompt) → 2-3x more revenue than hard gate</li>
        <li><strong>Free trial (3d vs 7d):</strong> 7-day trials convert 15-20% higher but cost more in revenue delay</li>
        <li><strong>Annual price anchoring:</strong> Show monthly price first, then annual discount → 30% more annual subs</li>
        <li><strong>Time-limited offers:</strong> "50% off for next 2 hours" → 3x conversion spike</li>
        <li><strong>Feature bundling:</strong> "See Likes + Boosts + Rewind" bundle → higher ARPU than à la carte</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">📐</span> Statistical Methodology</h3>
    <div class="grid-3">
      <div>
        <p><strong>Sample Size</strong></p>
        <p>Dating apps need larger samples due to variable engagement. Target 10K-50K users per variant for paywall tests, 5K-15K for UX tests.</p>
      </div>
      <div>
        <p><strong>Bayesian vs Frequentist</strong></p>
        <p>Bayesian preferred for dating — faster decisions with smaller samples. Use Thompson Sampling for multi-armed bandits on feature rollouts.</p>
      </div>
      <div>
        <p><strong>MDE Targets</strong></p>
        <p>Primary metrics: ±5% retention, ±10% conversion. Guard-rail metrics: session length, match quality. Run tests 2-4 weeks minimum.</p>
      </div>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: Privacy & LFPDPPP
// =============================================
newPanels.push({
  id: 'privacylfpdppp',
  cat: 'technical',
  label: '🔐 Privacy/LFPDPPP',
  color: 'var(--danger)',
  html: `
<div class="tab-panel" id="tab-privacylfpdppp">
  <div class="section-header">
    <h2>🔐 Privacy & LFPDPPP Compliance — Mexico</h2>
    <p>Mexico's data protection law, INAI requirements, consent management, and cross-border transfer rules</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">2010</div><div class="stat-lbl">LFPDPPP Enacted</div></div>
    <div class="stat-block"><div class="stat-val">$1.6M</div><div class="stat-lbl">Max Fine (MXN)</div></div>
    <div class="stat-block"><div class="stat-val">INAI</div><div class="stat-lbl">Regulator</div></div>
    <div class="stat-block"><div class="stat-val">Art. 9</div><div class="stat-lbl">Sensitive Data</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">⚖️</span> LFPDPPP Key Requirements</h3>
      <ul>
        <li><strong>Aviso de Privacidad (Privacy Notice):</strong> MANDATORY before collecting any data. Must specify: data controller identity, purposes, data types, recipients, rights (ARCO).</li>
        <li><strong>Consent:</strong> Explicit written consent required for sensitive data (sexual orientation, biometrics). Implicit consent allowed for non-sensitive data with proper notice.</li>
        <li><strong>ARCO Rights:</strong> Access, Rectification, Cancellation, Opposition — users can exercise within 20 business days.</li>
        <li><strong>Data minimization:</strong> Only collect what's necessary for stated purposes.</li>
        <li><strong>Purpose limitation:</strong> Cannot use data for purposes beyond what's stated in the notice.</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">⚠️</span> Sensitive Data (Art. 9) — Dating App Risk</h3>
      <ul>
        <li><span class="tag danger">HIGH RISK</span> <strong>Sexual orientation</strong> — Dating preferences directly reveal this</li>
        <li><span class="tag danger">HIGH RISK</span> <strong>Biometric data</strong> — Profile photos, selfie verification</li>
        <li><span class="tag warning">MEDIUM</span> <strong>Religious beliefs</strong> — If collected in profile fields</li>
        <li><span class="tag warning">MEDIUM</span> <strong>Health data</strong> — HIV status, disability (if collected)</li>
        <li><span class="tag">LOW</span> <strong>Location data</strong> — Not explicitly "sensitive" under LFPDPPP but requires consent</li>
      </ul>
      <p style="margin-top:0.75rem"><strong>Requirement:</strong> All sensitive data needs EXPLICIT written/digital consent (checkbox, not pre-ticked).</p>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🌐</span> Cross-Border Data Transfer</h3>
      <ul>
        <li><strong>Art. 36-37:</strong> International transfers permitted if recipient provides "equivalent protection"</li>
        <li><strong>US servers (AWS/Vercel/Neon):</strong> Allowed with contractual safeguards (data processing agreements)</li>
        <li><strong>User consent:</strong> Privacy notice must explicitly state data will be stored outside Mexico</li>
        <li><strong>Exceptions:</strong> User consent overrides transfer restrictions</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag success">Action</span> Add "Data stored on US servers" to your Aviso de Privacidad + get explicit consent checkbox</p>
    </div>
    <div class="card">
      <h3><span class="emoji">🔄</span> GDPR vs LFPDPPP Comparison</h3>
      <ul>
        <li><strong>Similar:</strong> Both require consent, data minimization, purpose limitation, breach notification</li>
        <li><strong>LFPDPPP stricter:</strong> Explicit consent for ALL sensitive data (GDPR allows "substantial public interest" exceptions)</li>
        <li><strong>GDPR stricter:</strong> Higher fines (4% revenue), DPO requirement, 72h breach notification</li>
        <li><strong>Conclusion:</strong> GDPR compliance ≈ 80% LFPDPPP compliant. Still need: Aviso de Privacidad format, ARCO process, INAI registration</li>
      </ul>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: Mobile Migration Strategy
// =============================================
newPanels.push({
  id: 'mobilemigration',
  cat: 'technical',
  label: '📱 Migration',
  color: 'var(--accent-secondary)',
  html: `
<div class="tab-panel" id="tab-mobilemigration">
  <div class="section-header">
    <h2>📱 Mobile Migration — Capacitor → React Native (Expo)</h2>
    <p>Performance benchmarks, migration timeline, cost analysis, and ecosystem comparison</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">60 FPS</div><div class="stat-lbl">RN Map Performance</div></div>
    <div class="stat-block"><div class="stat-val">6-9 mo</div><div class="stat-lbl">Migration Timeline</div></div>
    <div class="stat-block"><div class="stat-val">60-80%</div><div class="stat-lbl">Code Sharing</div></div>
    <div class="stat-block"><div class="stat-val">$150-250K</div><div class="stat-lbl">Total Cost Est</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">🐌</span> Capacitor Pain Points (Current)</h3>
      <ul>
        <li><span class="tag danger">CRITICAL</span> <strong>Map performance:</strong> WebView renders Mapbox at 15-25 FPS. Native achieves 60 FPS.</li>
        <li><span class="tag danger">CRITICAL</span> <strong>Background location:</strong> Unreliable wake-ups, battery drain 3-5x higher than native</li>
        <li><span class="tag warning">HIGH</span> <strong>Camera/photo:</strong> Web Camera API limitations — no portrait mode, slower processing</li>
        <li><span class="tag warning">HIGH</span> <strong>Push notifications:</strong> pushToken exists but not implemented. Capacitor Push plugin has edge cases.</li>
        <li><span class="tag">MEDIUM</span> <strong>Real-time:</strong> Socket.io through WebView adds 50-100ms latency vs native sockets</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">🚀</span> React Native (Expo) Advantages</h3>
      <ul>
        <li><span class="tag success">60 FPS</span> <strong>react-native-maps:</strong> Native MapKit/Google Maps rendering</li>
        <li><span class="tag success">Background</span> <strong>expo-location:</strong> Reliable background geofencing with minimal battery</li>
        <li><span class="tag success">Camera</span> <strong>react-native-vision-camera:</strong> 30+ FPS processing, ML-ready</li>
        <li><span class="tag success">Push</span> <strong>expo-notifications:</strong> FCM/APNs with EAS build pipeline</li>
        <li><span class="tag success">OTA</span> <strong>EAS Update:</strong> Over-the-air JS updates without app store review</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">📅</span> Migration Roadmap</h3>
    <div class="timeline">
      <div class="timeline-item">
        <div class="phase-tag" style="background:rgba(59,130,246,0.15);color:var(--accent)">PHASE 1 — Month 1-2</div>
        <h4>Foundation & Shared Core</h4>
        <p>Monorepo setup (Turborepo), shared business logic extraction, API client, state management (Zustand), authentication flow.</p>
      </div>
      <div class="timeline-item">
        <div class="phase-tag" style="background:rgba(16,185,129,0.15);color:var(--success)">PHASE 2 — Month 3-4</div>
        <h4>Core Features</h4>
        <p>Map view (react-native-maps), profile system, bump/match flow, messaging (Socket.io native), push notifications.</p>
      </div>
      <div class="timeline-item">
        <div class="phase-tag" style="background:rgba(139,92,246,0.15);color:var(--accent-secondary)">PHASE 3 — Month 5-6</div>
        <h4>Advanced Features</h4>
        <p>Games system, groups/communities, photo verification (selfie), location services (background), three-pillar switching.</p>
      </div>
      <div class="timeline-item">
        <div class="phase-tag" style="background:rgba(245,158,11,0.15);color:var(--warning)">PHASE 4 — Month 7-9</div>
        <h4>Polish & Launch</h4>
        <p>Performance optimization, App Store/Play Store submission, beta testing, A/B test infrastructure, analytics integration.</p>
      </div>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: Competitor Intelligence
// =============================================
newPanels.push({
  id: 'competitorintel',
  cat: 'research',
  label: '🏆 Comp Intel',
  color: 'var(--danger)',
  html: `
<div class="tab-panel" id="tab-competitorintel">
  <div class="section-header">
    <h2>🏆 Competitor Intelligence — Full Feature Matrix</h2>
    <p>12-app deep-dive with gap analysis showing what F2F has that no competitor has</p>
  </div>

  <div class="card">
    <h3><span class="emoji">⚔️</span> Critical Missing Features</h3>
    <table class="inf-table">
      <tr><th>Missing Feature</th><th>Who Has It</th><th>Priority</th></tr>
      <tr><td>Photo verification (selfie)</td><td>Tinder, Bumble, Hinge, Badoo, Happn</td><td><span class="tag danger">CRITICAL</span></td></tr>
      <tr><td>Multiple profile photos (3-9)</td><td>ALL competitors</td><td><span class="tag danger">CRITICAL</span></td></tr>
      <tr><td>Push notifications</td><td>All (F2F has pushToken but not implemented)</td><td><span class="tag danger">CRITICAL</span></td></tr>
      <tr><td>Voice notes in chat</td><td>Bumble, Grindr</td><td><span class="tag warning">HIGH</span></td></tr>
      <tr><td>Video calls</td><td>Bumble, Badoo, Grindr, The League</td><td><span class="tag warning">HIGH</span></td></tr>
      <tr><td>AI-powered matching</td><td>Tinder, Bumble, Hinge, Grindr, FB Dating</td><td><span class="tag warning">HIGH</span></td></tr>
      <tr><td>Subscription monetization</td><td>ALL (except FB Dating)</td><td><span class="tag warning">HIGH</span></td></tr>
      <tr><td>Incognito/Invisible mode</td><td>Tinder, Bumble, Grindr, Feeld, Badoo</td><td><span class="tag warning">HIGH</span></td></tr>
      <tr><td>Travel mode / Passport</td><td>Tinder, Bumble, Grindr, FB Dating</td><td><span class="tag">MEDIUM</span></td></tr>
      <tr><td>Prompts/questions system</td><td>Hinge, Bumble, CMB</td><td><span class="tag">MEDIUM</span></td></tr>
    </table>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">🌟</span> F2F Unique Advantages — NO Competitor Has These</h3>
    <div class="grid-3">
      <div class="case-card info-card">
        <div class="case-name">🎮 10 Proximity Games</div>
        <div class="case-detail">Bump Battle, Trivia Clash, Two Truths, King of the Hill, Proximity Tag, Turf Wars, Emoji Decode, Random Match, Ice Breaker, Leaderboard. <strong>No dating app has gamified proximity games.</strong></div>
      </div>
      <div class="case-card info-card">
        <div class="case-name">🎯 Three-Pillar Model</div>
        <div class="case-detail">Dating (rose) + Business (blue) + Friendships (green) integrated on same map. Bumble has BFF/Bizz but as SEPARATE modes. F2F unifies them.</div>
      </div>
      <div class="case-card info-card">
        <div class="case-name">🧭 Directional Arrows</div>
        <div class="case-detail">Real-time arrows pointing toward nearby users. No competitor has this real-time directional guidance on the map.</div>
      </div>
      <div class="case-card info-card">
        <div class="case-name">👊 Bump Interaction</div>
        <div class="case-detail">Unique proximity-based bump → bump-back → reveal flow. Alternative to swiping that no competitor offers.</div>
      </div>
      <div class="case-card info-card">
        <div class="case-name">💼 Business Profiles</div>
        <div class="case-detail">Menu data, booking URLs, hiring status, LinkedIn integration, portfolio. No dating/social app offers this depth of business profiles.</div>
      </div>
      <div class="case-card info-card">
        <div class="case-name">🗺️ Map Game Arena</div>
        <div class="case-detail">The map itself becomes a competitive arena — Turf Wars territories, Proximity Tag ranges, King of the Hill zones.</div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">📋</span> Strategic Recommendation</h3>
    <div class="grid-2">
      <div>
        <p><span class="tag danger">Phase 1 (Critical)</span></p>
        <ul><li>Multi-photo profiles</li><li>Photo verification</li><li>Push notifications</li></ul>
      </div>
      <div>
        <p><span class="tag warning">Phase 2 (Revenue)</span></p>
        <ul><li>Subscription tiers</li><li>Boosts/Super Bumps</li><li>Premium filters</li></ul>
      </div>
    </div>
    <p style="margin-top:1rem"><span class="tag success">KEY</span> Double down on games + three-pillar + map-first as THE differentiator. Add "table stakes" features to compete.</p>
  </div>
</div>`
});

// =============================================
// PANEL: VC & Investor Landscape
// =============================================
newPanels.push({
  id: 'vclandscape',
  cat: 'investor',
  label: '📈 VC Tracker',
  color: 'var(--gold)',
  html: `
<div class="tab-panel" id="tab-vclandscape">
  <div class="section-header">
    <h2>📈 VC & Investor Landscape — Dating/Social Apps</h2>
    <p>Active investors, recent deals, LATAM-focused VCs, angels, accelerators, and objection handling</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">$13B</div><div class="stat-lbl">Global TAM by 2030</div></div>
    <div class="stat-block"><div class="stat-val">$343M</div><div class="stat-lbl">Mexico by 2030</div></div>
    <div class="stat-block"><div class="stat-val">7.2%</div><div class="stat-lbl">Mexico CAGR</div></div>
    <div class="stat-block"><div class="stat-val">30+</div><div class="stat-lbl">YC Dating Alumni</div></div>
  </div>

  <div class="card">
    <h3><span class="emoji">💰</span> Recent Deals (2023-2026)</h3>
    <table class="inf-table">
      <tr><th>Company</th><th>Round</th><th>Amount</th><th>Lead Investor</th><th>Year</th></tr>
      <tr><td>Known</td><td>Seed+</td><td>$9.7-10M+</td><td>Forerunner, NFX, PearVC</td><td>2025</td></tr>
      <tr><td>Smitten</td><td>Series A</td><td>€13M</td><td>Makers Fund</td><td>2022-25</td></tr>
      <tr><td>Pie</td><td>Series A</td><td>$24M total</td><td>Forerunner Ventures</td><td>2024</td></tr>
      <tr><td>Sniffies (Match investment)</td><td>Strategic</td><td>$100M</td><td>Match Group</td><td>Apr 2026</td></tr>
      <tr><td>Amata</td><td>Pre-Seed</td><td>$6M</td><td>Undisclosed</td><td>2023</td></tr>
      <tr><td>Gigi</td><td>Seed Ext</td><td>$8M total</td><td>Khosla, Sequoia</td><td>2025</td></tr>
      <tr><td>Corner</td><td>Seed</td><td>$3.75M</td><td>Abstract, Tapestry</td><td>2025</td></tr>
    </table>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🇲🇽</span> LATAM-Focused VCs</h3>
      <table class="inf-table">
        <tr><th>Firm</th><th>HQ</th><th>Check Size</th></tr>
        <tr><td><strong>Kaszek</strong></td><td>Buenos Aires/CDMX</td><td>$500K-$50M+</td></tr>
        <tr><td><strong>ALLVP / Hi Ventures</strong></td><td>Mexico City</td><td>$500K-$10M</td></tr>
        <tr><td><strong>Dila Capital</strong></td><td>CDMX/Miami</td><td>$1M-$5M</td></tr>
        <tr><td><strong>SoftBank LATAM</strong></td><td>São Paulo</td><td>$20M-$100M+</td></tr>
        <tr><td><strong>Magma Partners</strong></td><td>Santiago</td><td>$250K-$3M</td></tr>
        <tr><td><strong>Platanus Ventures</strong></td><td>Santiago</td><td>$100K-$200K</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🎯</span> What VCs Want to See</h3>
      <table class="inf-table">
        <tr><th>Metric</th><th>Target</th></tr>
        <tr><td>30-Day Retention</td><td>&gt;25%</td></tr>
        <tr><td>DAU/MAU Ratio</td><td>20-25%+</td></tr>
        <tr><td>LTV:CAC Ratio</td><td>&gt;3:1</td></tr>
        <tr><td>Free-to-Paid Conversion</td><td>4-7%</td></tr>
        <tr><td>Message Response Rate</td><td>Higher = better</td></tr>
      </table>
      <p style="margin-top:0.75rem"><span class="tag gold">Frame as</span> "AI-powered social discovery" — NOT "dating app"</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">🛡️</span> Objection Handling</h3>
    <div class="grid-2">
      <div>
        <p><strong>"Success = delete" churn</strong></p>
        <p>Counter: Community features, events, friendships, relationship coaching. Retention through social graph, not just matching.</p>
      </div>
      <div>
        <p><strong>"Winner-take-all market"</strong></p>
        <p>Counter: Niche focus (Mexico/LATAM, three-pillar model) that incumbents can't serve. Feeld proves alternatives work (£49M rev on $550K raised).</p>
      </div>
    </div>
  </div>
</div>`
});

// =============================================
// PANEL: Geofencing & Location Strategy
// =============================================
newPanels.push({
  id: 'geofencingstrategy',
  cat: 'technical',
  label: '🗺️ Geofencing',
  color: 'var(--success)',
  html: `
<div class="tab-panel" id="tab-geofencingstrategy">
  <div class="section-header">
    <h2>🗺️ Geofencing & Location Strategy</h2>
    <p>Proximity optimization, location fuzzing, PostGIS benchmarks, venue partnerships, and map UX patterns</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">~2ms</div><div class="stat-lbl">ST_DWithin (5M rows)</div></div>
    <div class="stat-block"><div class="stat-val">±5m</div><div class="stat-lbl">GPS Accuracy</div></div>
    <div class="stat-block"><div class="stat-val">10-15mi</div><div class="stat-lbl">Urban Sweet Spot</div></div>
    <div class="stat-block"><div class="stat-val">S2 L7/L8</div><div class="stat-lbl">Tinder Geo-sharding</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📡</span> Technology Comparison</h3>
      <table class="inf-table">
        <tr><th>Tech</th><th>Accuracy</th><th>Battery</th><th>Best For</th></tr>
        <tr><td>GPS</td><td>±5m</td><td>🔴 High</td><td>Outdoors</td></tr>
        <tr><td>Wi-Fi</td><td>±10-50m</td><td>🟡 Medium</td><td>Indoors/Urban</td></tr>
        <tr><td>BLE Beacons</td><td>±1-5m</td><td>🟢 Very Low</td><td>Venue proximity</td></tr>
        <tr><td>Cell Tower</td><td>±100-500m</td><td>🟢 Very Low</td><td>Rural/Fallback</td></tr>
        <tr><td>Fused (Android)</td><td>Adaptive</td><td>🟡 Variable</td><td>All environments</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🔒</span> Location Fuzzing (Security)</h3>
      <ul>
        <li><strong>Grid snapping:</strong> 500m × 500m cells — snap coordinates to cell center (Tinder's approach)</li>
        <li><strong>Random noise:</strong> ±200m urban, ±1km rural. Regenerate offset periodically.</li>
        <li><strong>Neighborhood display:</strong> Show "Condesa" instead of exact coordinates</li>
        <li><strong>Distance bucketing:</strong> Show "< 1 km", "1-5 km" instead of exact — prevents trilateration</li>
        <li><strong>k-Anonymity:</strong> Every displayed location represents ≥5 users</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag danger">CRITICAL</span> Never expose exact distance in API responses. Server-side fuzzing only.</p>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">🏗️</span> PostGIS Architecture at Scale</h3>
      <table class="inf-table">
        <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
        <tr><td>Hot cache</td><td>Redis GEOSEARCH</td><td>Sub-ms proximity (active users)</td></tr>
        <tr><td>Warm storage</td><td>PostgreSQL + PostGIS</td><td>Complex spatial queries + filters</td></tr>
        <tr><td>Geospatial index</td><td>Google S2 Geometry</td><td>Geosharding, pyramid expansion</td></tr>
        <tr><td>Search</td><td>Elasticsearch</td><td>Multi-attribute filtering in shard</td></tr>
        <tr><td>Events</td><td>Apache Kafka</td><td>Async swipe/match processing</td></tr>
        <tr><td>Connection pool</td><td>PgBouncer</td><td>Handle 100K+ connections</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🔋</span> Battery-Efficient Location Strategy</h3>
      <ul>
        <li><strong>Foreground (app open):</strong> Full GPS accuracy — kCLLocationAccuracyNearestTenMeters</li>
        <li><strong>Background (app closed):</strong> Significant Location Change only (cell-tower based, very low power)</li>
        <li><strong>Geofences:</strong> Set around detected venues/hotspots — wake app on entry</li>
        <li><strong>Stationary detection:</strong> Accelerometer → pause ALL location if not moving</li>
        <li><strong>Batch uploads:</strong> Queue location updates → send every 5-15 min</li>
        <li><strong>iOS:</strong> pausesLocationUpdatesAutomatically = true</li>
      </ul>
    </div>
  </div>
</div>`
});

// ──────────────────────────────────────────────
// 2. INJECT into the HTML
// ──────────────────────────────────────────────

// A) Add tab nav items — inject right before </ul> in the tab-list
const navItems = newPanels.map(p => {
  const style = p.color ? ` style="color:${p.color};"` : '';
  return `        <li data-cat="${p.cat}"><button class="tab-btn" data-tab="${p.id}"${style}>${p.label}</button></li>`;
}).join('\n');

html = html.replace('    </ul>\n</nav>', navItems + '\n    </ul>\n</nav>');

// B) Add panel content — inject right before </main>
const panelContent = newPanels.map(p => p.html).join('\n\n');
html = html.replace('</main>', panelContent + '\n\n</main>');

// C) Write output
fs.writeFileSync(SRC, html, 'utf8');
console.log(`✅ Injected ${newPanels.length} new panels into dashboard`);
console.log('Panels added:', newPanels.map(p => p.id).join(', '));
