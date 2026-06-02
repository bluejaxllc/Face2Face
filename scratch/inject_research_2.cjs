const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'dashboard-deploy', 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

const newPanels = [];

newPanels.push({
  id: 'gamificationpsych',
  cat: 'research',
  label: '🧠 Gamification Psychology',
  color: 'var(--purple)',
  html: \`
<div class="tab-panel" id="tab-gamificationpsych">
  <div class="section-header">
    <h2>🧠 Gamification & Behavioral Psychology</h2>
    <p>Hook model loops, variable rewards, loss aversion, and behavioral economics of dating apps</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">3x</div><div class="stat-lbl">Engagement w/ Variable Rewards</div></div>
    <div class="stat-block"><div class="stat-val">2.5x</div><div class="stat-lbl">Loss Aversion Multiplier</div></div>
    <div class="stat-block"><div class="stat-val">7-10</div><div class="stat-lbl">Daily Sessions per User</div></div>
    <div class="stat-block"><div class="stat-val">72h</div><div class="stat-lbl">Habit Formation Window</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">🎣</span> The Hook Model (Nir Eyal) in F2F</h3>
      <table class="inf-table">
        <tr><th>Phase</th><th>App Application</th><th>Target Emotion</th></tr>
        <tr><td><strong>Trigger (Internal)</strong></td><td>Loneliness, boredom, curiosity</td><td>Alleviation of social isolation</td></tr>
        <tr><td><strong>Trigger (External)</strong></td><td>Push notification: "Someone bumped you"</td><td>Anticipation, FOMO</td></tr>
        <tr><td><strong>Action</strong></td><td>Opening app, opening map, bumping back</td><td>Low friction, high agency</td></tr>
        <tr><td><strong>Variable Reward</strong></td><td>Match reveal, who is nearby?</td><td>Dopamine hit (Skinner box effect)</td></tr>
        <tr><td><strong>Investment</strong></td><td>Sending a message, playing a game, uploading photo</td><td>Sunk cost, identity commitment</td></tr>
      </table>
    </div>
    <div class="card">
      <h3><span class="emoji">🎁</span> Variable Reward Structures</h3>
      <ul>
        <li><strong>The Slot Machine Effect:</strong> The map should obscure exact users until you get close. Unpredictability drives engagement.</li>
        <li><strong>Intermittent Reinforcement:</strong> Not every interaction should result in a match. A 15-20% match rate creates higher long-term engagement than a 50% rate.</li>
        <li><strong>Surprise Mechanics:</strong> "Random Match" game, hidden map Easter eggs, sudden "VIP" status drops.</li>
        <li><strong>Social Validation:</strong> The "Bump" is a micro-validation. Seeing the counter go up is intrinsically rewarding.</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag gold">Core Insight</span> The reward must remain uncertain. If users always know who is around, the magic dies.</p>
    </div>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">📉</span> Loss Aversion Mechanics</h3>
      <ul>
        <li><strong>Expiring Connections:</strong> Matches disappear if no message sent within 24h (Bumble/CMB style).</li>
        <li><strong>Steak Mechanics:</strong> "You're on a 5-day interaction streak." Losing it hurts more than gaining it feels good.</li>
        <li><strong>Scarcity:</strong> "Only 2 Bumps left today." Users value them more when limited.</li>
        <li><strong>Blurring/Fading:</strong> Profiles fade away if you move too far from them on the map.</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">🧪</span> Behavioral Economics Hacks</h3>
      <ul>
        <li><strong>Decoy Pricing:</strong> $4.99/mo vs $29.99/yr vs $99.99/lifetime. The middle option looks like a steal.</li>
        <li><strong>Endowed Progress Effect:</strong> Start users with a 20% full profile bar, not 0%. They are 34% more likely to finish.</li>
        <li><strong>Social Proof:</strong> "7 people bumped John today." Increases John's perceived value.</li>
        <li><strong>Reciprocity:</strong> If the app gives a "Free Super Bump", the user feels obligated to use it and return to the app.</li>
      </ul>
    </div>
  </div>
</div>\`
});

newPanels.push({
  id: 'dataanalytics',
  cat: 'tools',
  label: '📈 Analytics Map',
  color: 'var(--blue)',
  html: \`
<div class="tab-panel" id="tab-dataanalytics">
  <div class="section-header">
    <h2>📈 Data & Analytics Setup (PostHog/Mixpanel)</h2>
    <p>Event tracking taxonomy, core KPI dashboards, and data pipeline architecture</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">3</div><div class="stat-lbl">Core Funnels to Track</div></div>
    <div class="stat-block"><div class="stat-val">Real-time</div><div class="stat-lbl">PostHog Latency</div></div>
    <div class="stat-block"><div class="stat-val">AARRR</div><div class="stat-lbl">Metrics Framework</div></div>
    <div class="stat-block"><div class="stat-val">SQL</div><div class="stat-lbl">Custom Reporting</div></div>
  </div>

  <div class="card">
    <h3><span class="emoji">🗺️</span> Core Event Taxonomy</h3>
    <table class="inf-table">
      <tr><th>Event Name</th><th>Properties</th><th>Purpose</th></tr>
      <tr><td><code>App_Opened</code></td><td><code>source</code>, <code>is_first_session</code></td><td>Session tracking, retention baseline</td></tr>
      <tr><td><code>Signup_Completed</code></td><td><code>method</code> (Phone/Apple/Google)</td><td>Acquisition funnel</td></tr>
      <tr><td><code>Profile_Updated</code></td><td><code>fields_changed</code>, <code>completeness_pct</code></td><td>Activation tracking</td></tr>
      <tr><td><code>Map_Viewed</code></td><td><code>time_spent</code>, <code>users_visible</code></td><td>Core feature engagement</td></tr>
      <tr><td><code>Bump_Initiated</code></td><td><code>target_category</code>, <code>distance</code></td><td>Primary interaction metric</td></tr>
      <tr><td><code>Bump_Accepted</code></td><td><code>time_to_accept</code></td><td>Match rate calculation</td></tr>
      <tr><td><code>Message_Sent</code></td><td><code>is_first_message</code>, <code>game_type_attached</code></td><td>Conversation health</td></tr>
      <tr><td><code>Game_Started</code></td><td><code>game_id</code>, <code>opponent_id</code></td><td>Feature adoption</td></tr>
      <tr><td><code>Paywall_Viewed</code></td><td><code>trigger_source</code></td><td>Monetization funnel top</td></tr>
      <tr><td><code>Purchase_Completed</code></td><td><code>plan_id</code>, <code>revenue</code></td><td>LTV calculation</td></tr>
    </table>
  </div>

  <div class="grid-2" style="margin-top:1.5rem">
    <div class="card">
      <h3><span class="emoji">📊</span> Essential Dashboards to Build</h3>
      <ul>
        <li><strong>Executive KPI:</strong> DAU, MAU, WAU/MAU (stickiness), D1/D7/D30 Retention, ARPU.</li>
        <li><strong>Onboarding Funnel:</strong> Install → Auth → SMS Verify → Profile Photo → First Map View. Look for drop-offs &gt;20%.</li>
        <li><strong>Liquidity Dashboard:</strong> Matches per DAU, % of DAUs with 0 matches (zero-state), messages per match.</li>
        <li><strong>Monetization Funnel:</strong> Paywall views → Checkout starts → Successful conversions by plan.</li>
        <li><strong>Game Engagement:</strong> MAU% using games, most popular game, games-to-matches ratio.</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">🛠️</span> Data Pipeline Architecture</h3>
      <ul>
        <li><strong>Client (Capacitor/React):</strong> PostHog JS SDK for product analytics, session recording, feature flags.</li>
        <li><strong>Server (Express/Node):</strong> PostHog Node SDK for server-side events (purchases, webhooks) to bypass ad-blockers.</li>
        <li><strong>Database (Postgres):</strong> Primary source of truth. Connect to Metabase or Supabase dashboards for relational queries.</li>
        <li><strong>Attribution (AppsFlyer/Branch):</strong> Tracks which ad campaign drove the install, passing data to PostHog.</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag success">Recommendation</span> Use PostHog. It combines product analytics, session replay, and feature flags in one tool.</p>
    </div>
  </div>
</div>\`
});

newPanels.push({
  id: 'gtmplaybooks',
  cat: 'strategy',
  label: '🚀 GTM Playbooks',
  color: 'var(--orange)',
  html: \`
<div class="tab-panel" id="tab-gtmplaybooks">
  <div class="section-header">
    <h2>🚀 Go-to-Market (GTM) Playbooks</h2>
    <p>Ambassador programs, campus takeovers, local venue partnerships, and hyper-local launch strategies</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">Density</div><div class="stat-lbl">The #1 Success Metric</div></div>
    <div class="stat-block"><div class="stat-val">300</div><div class="stat-lbl">Active Users per 5km²</div></div>
    <div class="stat-block"><div class="stat-val">10x</div><div class="stat-lbl">ROI on Campus Reps</div></div>
    <div class="stat-block"><div class="stat-val">Zero</div><div class="stat-lbl">Value w/o Liquidity</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">🎓</span> The Campus Takeover Playbook</h3>
      <p>Dating apps fail when spread too thin. You must conquer one highly dense area at a time (e.g., TEC de Monterrey, UNAM, Ibero).</p>
      <ul>
        <li><strong>The Sorority/Fraternity Hack:</strong> Present at Greek life chapters. Require members to download to attend an exclusive sponsored party.</li>
        <li><strong>Student Ambassadors:</strong> Pay highly social students to acquire users. Structure: Base pay + $2 per verified sign-up.</li>
        <li><strong>Chalk/Flyer Guerrilla Marketing:</strong> Spray chalk on campus sidewalks ("Who is 500ft away? Check F2F").</li>
        <li><strong>Sponsor Tailgates/Bar Crawls:</strong> "Show your F2F profile for a free drink."</li>
      </ul>
      <p style="margin-top:0.75rem"><span class="tag danger">Tinder's Secret</span> Whitney Wolfe Herd visited sororities, got girls to sign up, then went to fraternities showing them the girls on the app. Immediate liquidity.</p>
    </div>
    <div class="card">
      <h3><span class="emoji">🍻</span> Local Venue Partnerships</h3>
      <p>Partner with highly trafficked venues to create F2F "Hotspots".</p>
      <ul>
        <li><strong>Coffee Shops (Business/Friends):</strong> "F2F Co-Working Tuesday" — 10% off if you show the app. Great for the Business/Networking pillar.</li>
        <li><strong>Bars/Clubs (Dating/Friends):</strong> F2F singles nights. The app's map naturally shines in crowded bar environments.</li>
        <li><strong>Gyms:</strong> High density of health-conscious individuals. F2F can act as a "looking for a workout buddy" tool.</li>
        <li><strong>In-App Venue Badges:</strong> Venues pay to have their logo on the F2F map, acting as sponsored geofences.</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">🔥</span> The "Thursday" App FOMO Strategy</h3>
    <div class="grid-3">
      <div>
        <p><strong>Manufactured Scarcity</strong></p>
        <p>Limit the app's functionality to certain times or areas. "F2F is only live in Polanco this weekend." Drives massive FOMO and media attention.</p>
      </div>
      <div>
        <p><strong>Waitlists</strong></p>
        <p>Don't let anyone in immediately. "You are #4,203 on the waitlist. Invite 3 friends to skip the line." Virality built-in.</p>
      </div>
      <div>
        <p><strong>Outrageous PR Stunts</strong></p>
        <p>People in morph suits holding signs: "Swiping is dead. Look up." Cheap, highly shareable on TikTok/Instagram Reels.</p>
      </div>
    </div>
  </div>
</div>\`
});

newPanels.push({
  id: 'financialmodels',
  cat: 'investor',
  label: '💸 Financial Models',
  color: 'var(--green)',
  html: \`
<div class="tab-panel" id="tab-financialmodels">
  <div class="section-header">
    <h2>💸 Financial Projections & Models</h2>
    <p>3-year P&L structure, LTV vs CAC models, and subscription revenue forecasting</p>
  </div>

  <div class="grid-4" style="margin-bottom:2rem">
    <div class="stat-block"><div class="stat-val">5%</div><div class="stat-lbl">Target Conversion</div></div>
    <div class="stat-block"><div class="stat-val">$3-5</div><div class="stat-lbl">Target CAC</div></div>
    <div class="stat-block"><div class="stat-val">$15-20</div><div class="stat-lbl">Target LTV</div></div>
    <div class="stat-block"><div class="stat-val">3.5x</div><div class="stat-lbl">LTV:CAC Ratio</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3><span class="emoji">📊</span> Revenue Model (Freemium)</h3>
      <table class="inf-table">
        <tr><th>Revenue Stream</th><th>% of Total</th><th>Margin</th></tr>
        <tr><td><strong>F2F+ Premium (Sub)</strong></td><td>65%</td><td>85% (post-app store)</td></tr>
        <tr><td><strong>Bump Packs (IAP)</strong></td><td>25%</td><td>85%</td></tr>
        <tr><td><strong>Local Ads/Sponsors</strong></td><td>10%</td><td>95%</td></tr>
      </table>
      <p style="margin-top:1rem"><strong>Unit Economics (Example):</strong></p>
      <ul>
        <li>10,000 MAU</li>
        <li>5% Conversion = 500 Paying Users</li>
        <li>ARPU = $9.99/mo</li>
        <li>MRR = $4,995/mo</li>
        <li>+ IAP/Ads = ~$6,000/mo Total Revenue</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="emoji">📉</span> Cost Structure (P&L Key Drivers)</h3>
      <ul>
        <li><strong>Customer Acquisition Cost (CAC):</strong> 40-50% of budget. Paid social, influencers, events.</li>
        <li><strong>Server/Infrastructure:</strong> ~10-15%. PostGIS, Redis, WebSockets, Maps API (Mapbox/Google).</li>
        <li><strong>App Store Fees:</strong> 15-30% "Apple Tax" (critical to push web/Stripe payments where possible).</li>
        <li><strong>Team/R&D:</strong> ~20-30%. Engineering, moderation, marketing.</li>
        <li><strong>Trust & Safety:</strong> ~5%. Automated moderation APIs, manual review tools.</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3><span class="emoji">📈</span> 3-Year Projection Milestones</h3>
    <div class="grid-3">
      <div>
        <p><strong>Year 1: Liquidity & PMF</strong></p>
        <p>Focus: Single city density (CDMX). Target: 50K MAU, $10K MRR. High burn rate on localized marketing and campus reps. Prove LTV &gt; CAC.</p>
      </div>
      <div>
        <p><strong>Year 2: Regional Expansion</strong></p>
        <p>Focus: Guadalajara, Monterrey, LATAM capitals. Target: 500K MAU, $200K MRR. Introduce advanced IAPs and local business venue sponsorships.</p>
      </div>
      <div>
        <p><strong>Year 3: Profitability & Scale</strong></p>
        <p>Focus: Brand dominance. Target: 2M+ MAU, $1M+ MRR. Optimize LTV through annual plans. Institutional Series A/B raise for US/Europe expansion.</p>
      </div>
    </div>
  </div>
</div>\`
});

const navItems = newPanels.map(p => {
  const style = p.color ? ' style="color:' + p.color + ';"' : '';
  return '        <li data-cat="' + p.cat + '"><button class="tab-btn" data-tab="' + p.id + '"' + style + '>' + p.label + '</button></li>';
}).join('\\n');

html = html.replace('    </ul>\\n</nav>', navItems + '\\n    </ul>\\n</nav>');

const panelContent = newPanels.map(p => p.html).join('\\n\\n');
html = html.replace('</main>', panelContent + '\\n\\n</main>');

fs.writeFileSync(SRC, html, 'utf8');
console.log('✅ Injected ' + newPanels.length + ' new panels into dashboard');
