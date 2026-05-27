// Mock data for demo. Mirrors the shape that lives in localStorage so the
// dashboard, chat view and totals all light up with realistic-looking content.

const TOKEN_PER_CHAR = 0.25
const ENERGY_PER_TOKEN_MWH = 0.00028
const CO2_PER_TOKEN_MG = 0.00011

function approxTokens(s) {
  return Math.max(1, Math.ceil(s.length * TOKEN_PER_CHAR))
}

// Deterministic pseudo-random so the chart looks stable across re-renders.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildExchange({ original, optimized, response, auditScore, bypassed = false, hoursAgo, rng }) {
  const pOrig = approxTokens(original)
  const pOpt = approxTokens(optimized)
  const tOut = approxTokens(response)

  // Sprinkle a little noise so the metrics don't look too uniform.
  const jitter = 0.85 + rng() * 0.3
  const eAct = (pOpt + tOut) * ENERGY_PER_TOKEN_MWH * jitter
  const cAct = (pOpt + tOut) * CO2_PER_TOKEN_MG * jitter

  const ratio = pOrig + tOut > 0 ? (pOrig + tOut) / (pOpt + tOut) : 1
  const ePot = eAct * ratio
  const cPot = cAct * ratio

  const userTs = new Date(Date.now() - hoursAgo * 3600e3).toISOString()
  const assistantTs = new Date(Date.now() - hoursAgo * 3600e3 + 4000).toISOString()

  return [
    {
      role: 'user',
      originalText: original,
      optimizedText: optimized,
      auditScore,
      auditBypassed: bypassed,
      timestamp: userTs,
    },
    {
      role: 'assistant',
      text: response,
      timestamp: assistantTs,
      metrics: {
        tokensInput: pOpt,
        tokensOutput: tOut,
        energyUsedMWh: eAct,
        co2EmissionsMg: cAct,
        energySavedMWh: Math.max(0, ePot - eAct),
        co2SavedMg: Math.max(0, cPot - cAct),
      },
    },
  ]
}

// ── Conversation templates ─────────────────────────────────────────────────────
// Each entry: { title, hoursAgo, exchanges: [{ original, optimized, response, auditScore, bypassed? }] }

const CONVERSATIONS = [
  {
    title: 'React form validation help',
    hoursAgo: 96,
    exchanges: [
      {
        original:
          "Hey there! So I was just wondering if you could possibly help me out with something. I'm working on a small React side project and I'd really love to add some basic form validation but honestly I'm not sure where to even start. Could you maybe show me a really simple example? Thanks so much in advance!",
        optimized: 'Show a simple React form validation example.',
        auditScore: 41,
        response:
          "Here's a minimal controlled form with inline validation:\n\n```jsx\nfunction SignupForm() {\n  const [email, setEmail] = useState('')\n  const [error, setError] = useState('')\n\n  const validate = () => {\n    if (!/^[^@]+@[^@]+\\.[^@]+$/.test(email)) {\n      setError('Enter a valid email address')\n      return false\n    }\n    setError('')\n    return true\n  }\n\n  return (\n    <form onSubmit={e => { e.preventDefault(); validate() }}>\n      <input value={email} onChange={e => setEmail(e.target.value)} />\n      {error && <p className='text-red-500'>{error}</p>}\n      <button>Submit</button>\n    </form>\n  )\n}\n```\n\nValidate on blur or submit — running it on every keystroke feels noisy.",
      },
      {
        original:
          "Okay great, that's actually really helpful! Now what I'd like to do next, if it's not too much trouble, is somehow add validation for multiple fields at once and show error messages for each one. Could you walk me through how that would work? I really appreciate it!",
        optimized: 'Extend it to validate multiple fields with per-field errors.',
        auditScore: 58,
        response:
          "Hold the errors in a single object keyed by field name:\n\n```jsx\nconst [values, setValues] = useState({ email: '', password: '' })\nconst [errors, setErrors] = useState({})\n\nconst validate = () => {\n  const next = {}\n  if (!/^[^@]+@[^@]+\\.[^@]+$/.test(values.email)) next.email = 'Invalid email'\n  if (values.password.length < 8) next.password = 'At least 8 characters'\n  setErrors(next)\n  return Object.keys(next).length === 0\n}\n```\n\nThis keeps validation declarative — one source of truth for which fields are broken.",
      },
      {
        original: 'Can you show how to integrate Zod for schema validation here?',
        optimized: 'Show how to integrate Zod for schema validation here.',
        auditScore: 92,
        response:
          "Define a schema and run `.safeParse` in your submit handler:\n\n```jsx\nimport { z } from 'zod'\n\nconst Schema = z.object({\n  email: z.string().email(),\n  password: z.string().min(8),\n})\n\nconst result = Schema.safeParse(values)\nif (!result.success) {\n  setErrors(result.error.flatten().fieldErrors)\n}\n```\n\n`flatten().fieldErrors` gives you `{ email: [...], password: [...] }` ready to render.",
      },
      {
        original:
          "One more quick thing — sorry to bother you again — but is there a way to make the error messages disappear when the user starts typing in that field again? That would be amazing.",
        optimized: 'Clear a field error when the user types in that field.',
        auditScore: 47,
        response:
          'Wipe that key on change:\n\n```jsx\nconst onChange = (field, v) => {\n  setValues(s => ({ ...s, [field]: v }))\n  setErrors(s => ({ ...s, [field]: undefined }))\n}\n```',
      },
    ],
  },
  {
    title: 'Climate essay feedback',
    hoursAgo: 168,
    exchanges: [
      {
        original:
          "Hi! Hope you're doing well! I've been working on a college essay about climate policy and I'd really love your honest feedback. I know you're busy and I really appreciate your time. The essay is about how individual carbon footprints have been overemphasized compared to systemic change. Anyway here's my opening paragraph — please tell me what you think, what's good, what's bad, what to change, anything really. Thanks!\n\n\"The conversation around climate change has long centered on personal responsibility...\"",
        optimized:
          'Review my essay opening on individual vs systemic climate responsibility:\n\n"The conversation around climate change has long centered on personal responsibility..."',
        auditScore: 52,
        response:
          "Your opening lands on a strong thesis but takes too long to get there. Two suggestions:\n\n1. **Tighten the first sentence.** \"Has long centered on\" buries the action — try \"For decades, the climate conversation has framed responsibility as personal.\"\n2. **Move the contrast earlier.** The systemic-change angle is the interesting part; let it surface in sentence two instead of paragraph two.\n\nThe argument itself is solid — just front-load it.",
      },
      {
        original:
          "Okay that makes a lot of sense, thank you so much! Now I'm a bit worried that my essay might be too one-sided. Do you think I should add a counterargument section where I acknowledge the other side? I'm not sure how to do that without weakening my main thesis though.",
        optimized: 'Should I add a counterargument section without weakening the thesis?',
        auditScore: 49,
        response:
          'Yes — but use a concession, not a debate. One paragraph that grants the strongest version of "personal action matters too," followed by why it\'s necessary but insufficient. This actually *strengthens* your thesis because you\'ve shown you considered the opposition rather than ignored it.',
      },
      {
        original:
          'Can you suggest three sources I can cite for the systemic-change argument?',
        optimized: 'Suggest three sources for the systemic-change argument.',
        auditScore: 95,
        response:
          "Three frequently-cited starting points:\n\n1. **The 2017 Carbon Majors Report** (CDP) — 100 companies linked to 71% of industrial emissions since 1988.\n2. **Mann, Michael E. *The New Climate War* (2021)** — argues the carbon-footprint frame was an industry PR move.\n3. **IPCC AR6 Working Group III (2022)** — chapters on policy and institutional levers.\n\nVerify the framing in each before citing — paraphrases vary.",
      },
    ],
  },
  {
    title: 'Python CSV cleanup',
    hoursAgo: 240,
    exchanges: [
      {
        original:
          "Hey! So I have this giant CSV file with like 50,000 rows of customer data and it's really messy — there's duplicate rows, missing values, inconsistent capitalization in the email column, weird whitespace everywhere, and some rows have prices stored as strings like '$1,200' instead of numbers. Could you help me write a Python script to clean it all up? I'm using pandas. Thanks so much!",
        optimized:
          'Pandas script to clean a customer CSV: dedupe rows, drop nulls, normalize email case, strip whitespace, parse "$1,200"-style prices to numbers.',
        auditScore: 38,
        response:
          "```python\nimport pandas as pd\n\ndf = pd.read_csv('customers.csv')\n\n# Whitespace + casing\ndf = df.apply(lambda c: c.str.strip() if c.dtype == 'object' else c)\ndf['email'] = df['email'].str.lower()\n\n# Prices: '$1,200' → 1200.0\ndf['price'] = (\n    df['price']\n    .str.replace(r'[$,]', '', regex=True)\n    .astype(float)\n)\n\n# Dedupe + drop fully-empty rows\ndf = df.drop_duplicates().dropna(how='all')\n\ndf.to_csv('customers_clean.csv', index=False)\n```\n\nIf `price` has stray whitespace inside strings, run `.str.strip()` before the regex.",
      },
      {
        original: 'How do I handle missing emails — drop them or keep them?',
        optimized: 'How do I handle rows with missing emails — drop or keep?',
        auditScore: 88,
        response:
          'Depends on downstream use:\n\n- **Drop** if email is the join key for anything (marketing, auth, dedupe). A null email is essentially an unusable row.\n- **Keep** if you want to count anonymous signups separately — in that case fill with a sentinel like `unknown@no-email.local` rather than `NaN`.',
      },
      {
        original:
          "I tried running the script but I'm getting a really weird error that says AttributeError: Can only use .str accessor with string values, do you know what that means and how to fix it?",
        optimized: "Getting AttributeError: Can only use .str accessor with string values. How do I fix it?",
        auditScore: 84,
        response:
          "That column isn't typed as string — likely it's `object` with mixed types or already numeric. Coerce first:\n\n```python\ndf['price'] = df['price'].astype(str).str.replace(r'[$,]', '', regex=True).astype(float)\n```\n\nOr wrap the cleanup in a `try/except` if some rows are genuinely numeric already.",
      },
      {
        original:
          "Awesome thanks!! That worked perfectly. Last question — how can I make this script reusable for similar files I get every month? Should I turn it into a function or a class or what?",
        optimized: 'Make this script reusable across monthly imports.',
        auditScore: 61,
        response:
          "Function is enough — a class is overkill for stateless transformation:\n\n```python\ndef clean(path, out):\n    df = pd.read_csv(path)\n    df = df.apply(lambda c: c.str.strip() if c.dtype == 'object' else c)\n    df['email'] = df['email'].str.lower()\n    df['price'] = df['price'].astype(str).str.replace(r'[$,]', '', regex=True).astype(float)\n    df.drop_duplicates().dropna(how='all').to_csv(out, index=False)\n```\n\nIf the schema changes between months, accept a config dict instead of hard-coding columns.",
      },
    ],
  },
  {
    title: 'Japan trip itinerary',
    hoursAgo: 384,
    exchanges: [
      {
        original:
          "Hi!! I'm super excited because I'm planning my first ever trip to Japan and I'd really love some help! I'll be there for about 10 days in October and I really want to see Tokyo, Kyoto, and maybe Osaka. I love food, traditional culture, and also some modern stuff like anime and gaming. Could you help me plan a rough itinerary? I'm not picky about hotels but I'd prefer mid-range. Thanks so so much!",
        optimized:
          '10-day October Japan itinerary: Tokyo, Kyoto, Osaka. Interests: food, traditional culture, anime/gaming. Mid-range hotels.',
        auditScore: 44,
        response:
          '**Days 1–4: Tokyo** — Asakusa + Senso-ji (traditional), Akihabara (gaming/anime), tsukiji outer market for breakfast, Shibuya/Shinjuku evenings.\n\n**Days 5–7: Kyoto** (shinkansen ~2h 15m) — Fushimi Inari at sunrise, Arashiyama bamboo, Gion for kaiseki dinner, Nishiki market.\n\n**Days 8–9: Osaka** (45m from Kyoto) — Dotonbori street food crawl, Osaka Castle, day trip to Nara for the deer.\n\n**Day 10:** Back to Tokyo for departure — leave a buffer day before flying.\n\nBook shinkansen seats in advance during October; foliage season fills trains fast.',
      },
      {
        original: 'What about a Japan Rail Pass — worth it for this itinerary?',
        optimized: 'Is a JR Pass worth it for this itinerary?',
        auditScore: 91,
        response:
          'For a single Tokyo↔Kyoto↔Osaka loop, probably not anymore — the 2023 price hike made the 7-day pass cost roughly the same as buying those exact tickets separately. Worth it only if you add side trips (Hiroshima, Kanazawa, Sapporo).',
      },
      {
        original:
          "Got it. Could you also recommend a really nice ramen place in Tokyo that locals actually go to, not just the touristy spots that everyone knows about already from instagram and stuff",
        optimized: 'Recommend a locals-favorite ramen spot in Tokyo.',
        auditScore: 53,
        response:
          'Try **Menya Itto** in Shin-Koiwa (tsukemen) or **Konjiki Hototogisu** in Shinjuku (clam-based shio). Both have Michelin Bib recognition but stay genuinely packed with locals — go before 11:30am or after 2pm to skip the worst lines.',
      },
    ],
  },
  {
    title: 'Marketing email - SaaS launch',
    hoursAgo: 480,
    exchanges: [
      {
        original:
          "Hey! I really need your help with something important. We're launching a new SaaS product next week — it's a project management tool for small remote teams — and I need to write a launch email that we'll send to our 5000+ person waitlist. It needs to be exciting but not too salesy, it should highlight that we have an early-bird discount, and it should drive people to sign up for a free trial. Could you draft something for me? I'd really appreciate it!!!",
        optimized:
          'Draft a launch email for a project-management SaaS to a 5000-person waitlist. Tone: exciting, not salesy. Include early-bird discount + free trial CTA.',
        auditScore: 57,
        response:
          "**Subject:** It's here — your project tool, ready to try\n\nHi {first_name},\n\nYou signed up months ago. Today we open the doors.\n\n[Product] is the project tool we wish we'd had running our last team — fast, opinionated, no busywork. As a thank-you for waiting, your first three months are 40% off if you start your trial this week.\n\n→ [Start your free trial]\n\nNo credit card. Cancel anytime. We'll be in the in-app chat if you want to say hi.\n\n— {sender_name}\n\nKeep the postscript link visible above the fold on mobile.",
      },
      {
        original: 'Make it shorter and add a subject line A/B option.',
        optimized: 'Make it shorter and add a subject line A/B option.',
        auditScore: 98,
        response:
          "**Subject A:** It's launch day\n**Subject B:** Your free trial is ready, {first_name}\n\nWe open the doors today. Your three-month early-bird discount (40% off) is live — just start your trial this week.\n\n→ [Start your free trial]\n\nNo card needed. Reply if you have questions.",
      },
    ],
  },
  {
    title: 'Explain Dijkstra simply',
    hoursAgo: 600,
    exchanges: [
      {
        original:
          "Hey, I have a CS exam coming up and I'm really struggling to wrap my head around Dijkstra's shortest path algorithm. I've watched a bunch of YouTube videos and read the textbook chapter twice and I still don't really get it. Could you explain it to me like I'm 12 years old? With a really simple example if possible? I'd really appreciate it!",
        optimized: "Explain Dijkstra's shortest path algorithm like I'm 12, with a simple example.",
        auditScore: 51,
        response:
          "Imagine you're at home (node A) and want to reach school (node E) via streets with different travel times. Dijkstra finds the cheapest path:\n\n1. Mark every place's distance as ∞ except home (0).\n2. Visit the place with the smallest known distance. Update each neighbor: if going through here is cheaper than what they had, update it.\n3. Mark the current place as \"done\" — you've found its shortest distance.\n4. Repeat until school is marked done.\n\nKey insight: once a node is marked done, its distance can't get any shorter — that's why we always pick the smallest-distance unvisited node next.",
      },
      {
        original: 'Why does it only work with non-negative edge weights?',
        optimized: 'Why does it only work with non-negative edge weights?',
        auditScore: 99,
        response:
          "Because step 3 assumes \"finalized\" distances. If a future edge had a *negative* weight, you might later find a cheaper path through an already-finalized node — but Dijkstra never revisits it. For negative edges you need Bellman-Ford, which iterates V-1 times specifically to allow that re-checking.",
      },
      {
        original: "What's the time complexity using a min-heap?",
        optimized: "What's the time complexity using a min-heap?",
        auditScore: 99,
        response:
          'O((V + E) log V). Each of V extractions costs log V, and each of E edge relaxations may push a new entry (also log V). With a Fibonacci heap you can get O(E + V log V), but the constants are bad and nobody uses them in practice.',
      },
    ],
  },
  {
    title: 'Resume rewrite',
    hoursAgo: 720,
    exchanges: [
      {
        original:
          "Hi! I'm applying for software engineering jobs and I'd really really love your help making my resume sound stronger. I've been working as a backend engineer for 3 years at a fintech company and I built a bunch of microservices and stuff but I'm not sure how to phrase any of it well. Here's my current bullet: 'Worked on payment processing service and made it faster.' Can you help me make this sound better and more impressive? Thanks so much!",
        optimized: "Improve this resume bullet: 'Worked on payment processing service and made it faster.'",
        auditScore: 46,
        response:
          'Lead with impact, then technique:\n\n> **Reduced p99 latency of the payments service by 62% (480ms → 180ms)** by introducing connection pooling and replacing a synchronous fraud-check call with an async queue.\n\nThree things this does that yours didn\'t: quantifies the win, names the specific techniques, and signals you understand which latency percentile matters.',
      },
      {
        original: "What about: 'Helped onboard new team members.'",
        optimized: "Improve: 'Helped onboard new team members.'",
        auditScore: 94,
        response:
          '> **Onboarded 4 engineers across 18 months**, authoring the team\'s service-architecture doc and pairing on their first three PRs each — new hires shipped to prod within 9 days on average (team prior: 21).',
      },
    ],
  },
  {
    title: 'SQL query optimization',
    hoursAgo: 840,
    exchanges: [
      {
        original:
          "Hello! I really hope you can help me. I have this SQL query that's running incredibly slowly in production — like 30 seconds slow — and I have absolutely no idea why. It's joining 3 tables and there's a WHERE clause and a GROUP BY. Could you help me figure out what's wrong and how to make it faster? I can paste the query if you want!",
        optimized: 'Help diagnose a 30s production SQL query joining 3 tables with WHERE + GROUP BY.',
        auditScore: 55,
        response:
          "Run `EXPLAIN ANALYZE` first — that's the only way to know whether it's a missing index, a bad join order, or a full scan. The usual suspects:\n\n1. **Missing index** on the WHERE column or the join keys.\n2. **Function on indexed column** (e.g., `WHERE DATE(created_at) = ...`) — kills the index.\n3. **GROUP BY on a non-indexed column** forces a sort.\n\nPaste the query and the EXPLAIN output and I can pinpoint it.",
        bypassed: true,
      },
    ],
  },
  {
    title: 'Quick recipe idea',
    hoursAgo: 24,
    exchanges: [
      {
        original: 'quick dinner idea using chicken thighs, lemon, and whatever pantry stuff',
        optimized: 'Quick dinner using chicken thighs and lemon.',
        auditScore: 76,
        response:
          "**Lemon-garlic chicken thighs, 25 min:**\n\n1. Pat 4 thighs dry, salt heavily, sear skin-side down in olive oil 8 min until golden.\n2. Flip, add 4 smashed garlic cloves and zest+juice of one lemon, finish in oven at 200°C/400°F for 12 min.\n3. Spoon pan juices over before serving.\n\nServe with rice or crusty bread to soak up the sauce.",
      },
      {
        original: 'can I do this in an air fryer instead',
        optimized: 'Can I do this in an air fryer?',
        auditScore: 89,
        response:
          'Yes — 200°C / 400°F for 18–20 min, skin-up. Squeeze the lemon and add the garlic for the last 5 min only, otherwise the garlic burns. Skin stays crispier than oven-finishing.',
      },
    ],
  },
]

export function generateMockChats() {
  const rng = mulberry32(42)
  return CONVERSATIONS.map((conv, i) => {
    const messages = []
    let offset = 0
    for (const ex of conv.exchanges) {
      const [u, a] = buildExchange({
        ...ex,
        hoursAgo: conv.hoursAgo - offset,
        rng,
      })
      messages.push(u, a)
      offset -= 0.05 // newer messages within the chat
    }
    return {
      id: `mock-chat-${i + 1}`,
      title: conv.title,
      createdAt: new Date(Date.now() - conv.hoursAgo * 3600e3).toISOString(),
      messages,
    }
  })
}

export function computeMockTotals(chats) {
  const totals = {
    cumulativeEnergyUsedWh: 0,
    cumulativeEnergySavedWh: 0,
    cumulativeCo2EmissionsMg: 0,
    cumulativeCo2SavedMg: 0,
  }
  for (const c of chats) {
    for (const m of c.messages) {
      if (!m.metrics) continue
      totals.cumulativeEnergyUsedWh += m.metrics.energyUsedMWh / 1000
      totals.cumulativeEnergySavedWh += m.metrics.energySavedMWh / 1000
      totals.cumulativeCo2EmissionsMg += m.metrics.co2EmissionsMg
      totals.cumulativeCo2SavedMg += m.metrics.co2SavedMg
    }
  }
  return totals
}

// ── Behavioral progression (year-long simulation) ──────────────────────────────
// Square-root ramp from ~55% to ~95% efficiency over 52 weeks, with realistic
// dips during high-activity periods (finals, project deadlines, etc).

export function generateBehavioralProgression() {
  const rng = mulberry32(7)
  const weeks = 52

  // High-activity periods (week index, magnitude in efficiency points lost)
  const dips = [
    { week: 7, magnitude: 8, spread: 2.5, label: 'finals' },
    { week: 19, magnitude: 10, spread: 3, label: 'launch sprint' },
    { week: 30, magnitude: 6, spread: 2, label: 'travel' },
    { week: 42, magnitude: 9, spread: 2.5, label: 'project deadline' },
  ]

  const data = []
  const now = new Date()
  const startMs = now.getTime() - (weeks - 1) * 7 * 86400e3

  for (let i = 0; i < weeks; i++) {
    const t = i / (weeks - 1)
    const baseEff = 55 + 40 * Math.sqrt(t)

    let dipEffect = 0
    for (const d of dips) {
      const dist = Math.abs(i - d.week)
      if (dist < d.spread) {
        dipEffect += d.magnitude * Math.exp(-(dist * dist) / (d.spread * d.spread * 0.6))
      }
    }

    const noise = (rng() - 0.5) * 2.4
    const efficiency = Math.max(35, Math.min(99, baseEff - dipEffect + noise))

    // Energy per prompt mirrors efficiency inversely
    // High eff = low energy use per prompt. Range roughly 0.12 → 0.04 mWh
    const baseEnergy = 0.13 - 0.085 * Math.sqrt(t)
    const energyNoise = (rng() - 0.5) * 0.008
    const energyPerPrompt = baseEnergy + dipEffect * 0.004 + energyNoise

    const d = new Date(startMs + i * 7 * 86400e3)
    data.push({
      week: i + 1,
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      efficiency: parseFloat(efficiency.toFixed(1)),
      energyPerPromptMWh: parseFloat(Math.max(0.02, energyPerPrompt).toFixed(4)),
    })
  }
  return data
}
