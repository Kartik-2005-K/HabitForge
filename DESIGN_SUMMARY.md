# HabitForge 2.0: Design Summary & Quick Reference

## 📋 Document Index

This architecture is documented across **5 comprehensive guides**:

1. **ARCHITECTURE.md** - System design, schemas, folder structure
2. **TYPES_AND_CONFIG.md** - TypeScript types & game balance configs
3. **AI_COACH_IMPLEMENTATION.md** - Gemini API integration guide
4. **MONGODB_MODELS.md** - Database models & setup
5. **IMPLEMENTATION_ROADMAP.md** - Week-by-week build plan

---

## 🎮 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HabitForge 2.0 Architecture                 │
└─────────────────────────────────────────────────────────────────┘

USER INTERFACE (Next.js + React)
├── Authentication (NextAuth.js)
├── Dashboard (Stats, Habits, Progress)
├── Habit Tracker (Daily check-ins)
├── AI Coach (Weekly recommendations)
└── 3D Avatar Island (Three.js/R3F)

STATE MANAGEMENT (Zustand)
├── Auth Store (User session)
├── Game Store (XP, level, multiplier)
├── Habit Store (User's habits)
└── Avatar Store (3D customizations)

API LAYER (Next.js Route Handlers)
├── /api/auth/* (Authentication)
├── /api/habits/* (CRUD & completion)
├── /api/logs/* (Habit logging)
├── /api/ai-coach/* (Gemini integration)
├── /api/gamification/* (XP & stats)
└── /api/user/* (Profile & preferences)

DATABASE (MongoDB)
├── Users (stats, preferences, auth)
├── Habits (definition, frequency, xp)
├── HabitLogs (daily completions)
└── AILogs (weekly action plans)

EXTERNAL SERVICES
├── Google Gemini AI (Weekly analysis)
├── MongoDB Atlas (Data persistence)
└── NextAuth.js (Secure authentication)
```

---

## 🧬 Data Flow Diagram

### Habit Completion Flow
```
User clicks "Complete Habit"
    ↓
HabitTracker component
    ↓
POST /api/habits/[id]/complete {value, mood, difficulty}
    ↓
Server validates request + authenticates
    ↓
Create HabitLog entry
    ↓
Calculate XP earned (with multipliers)
    ↓
Update User.stats (XP, level, streak)
    ↓
Check for level up
    ↓
Response with: {xpEarned, levelUp?, multiplier}
    ↓
Zustand store updates (useGameStore.addXP)
    ↓
UI updates: XP bar, level, notifications
    ↓
Animation plays (particle burst, scale increase)
```

### Weekly AI Coach Flow
```
Sunday 9 PM (user's timezone)
    ↓
Cron job triggers
    ↓
Fetch last 7 days of habit logs
    ↓
Calculate analytics (completion rate, trends, mood)
    ↓
Build UserAnalytics object
    ↓
Send to Gemini API with structured prompt
    ↓
Receive JSON action plan
    ↓
Validate & sanitize response
    ↓
Save AILog to database
    ↓
Send notification (in-app + email)
    ↓
Display ActionPlanCard on dashboard
```

---

## 🏆 Gamification System Deep Dive

### XP Calculation Formula
```
Base XP = Habit XP Reward (10-20 per category)

Multipliers Applied:
1. Streak Multiplier = 1.0 + (streak_days × 0.05) [CAP: 2.0x]
   - 7-day streak = 1.35x
   - 14-day streak = 1.70x
   - 30-day streak = 2.0x (max)

2. Active Multiplier = 1.0x - 3.0x
   - Based on consecutive days completed
   - Resets on missed day

3. Difficulty Modifier:
   - Easy (0.8x)
   - Normal (1.0x)
   - Hard (1.5x)

4. Consistency Bonus = 1.1x (if all habits completed today)

TOTAL XP = Base × Streak × Multiplier × Difficulty × Consistency
```

### Level Progression
```
Level | XP Threshold | Cumulative XP | Rewards
-----|--------------|---------------|------------------
1    | 0            | 0             | -
2    | 100          | 100           | 🌸 Flower decoration
3    | 150          | 250           | 🔥 Multiplier +0.1x
4    | 225          | 475           | 🏅 Week Warrior badge
5    | 338          | 813           | 🌳 Tree decoration
...  | ...          | ...           | ...
50   | 1000000+     | 10000000+     | 🏆 Legendary Master

XP Curve: Each level requires 1.5x more XP than previous
```

### Streak System
```
Day 1 ──→ Streak = 1
Day 2 ──→ Streak = 2 [Multiplier: 1.1x]
Day 3 ──→ Streak = 3 [Multiplier: 1.15x]
...
Day 7 ──→ Streak = 7 [Multiplier: 1.35x] ⭐ UNLOCK
Day 30 ──→ Streak = 30 [Multiplier: 2.0x MAX]

Missed Day → Streak RESETS to 0
             Multiplier drops to 1.0x
             Encouragement notification sent
```

---

## 🤖 AI Coach System

### Weekly Analysis Components

```
USER ANALYTICS COLLECTED:
├── Habit Performance
│   ├── Completion rate per habit
│   ├── 7-day trend (improving/stable/declining)
│   └── Streak data
├── Mood & Difficulty
│   ├── Average mood rating (great/good/okay/bad)
│   └── Reported difficulty per completion
└── Metrics
    ├── Total XP earned
    ├── Consistency score (0-100)
    └── Days with perfect completion

GEMINI API PROMPT STRUCTURE:
├── User's level, XP, streak
├── Each habit's 7-day performance
├── Mood distribution
└── Request for: insights, recommendations, predictions

RESPONSE JSON:
├── motivationalMessage (2-3 sentences)
├── keyInsights[] (performance per habit)
├── recommendations[] (actionable changes)
├── scheduleAdjustments[] (suggested times)
├── weeklyChallenge (bonus XP opportunity)
└── predictions (level/XP forecasts)
```

### Recommendation Types
```
1. Schedule Adjustment
   "Move Morning Run from 7 PM to 7 AM"
   Why: 85% completion rate in morning vs 45% at night

2. Habit Change
   "Consider doing meditation with breathing exercises"
   Why: Similar users found this increases consistency

3. Encouragement
   "You're on fire! 3-day streak incoming 🔥"
   Why: Positive reinforcement for trending improvements

4. Challenge Creation
   "Perfect Week: Complete all 7 habits for 7 days"
   Reward: 100 bonus XP + special badge
```

---

## 🎨 3D Avatar Island System

### Growth Stages

```
┌─ LEVEL 1-5: SEEDLING STAGE
│  Model: /3d-models/avatars/seedling.glb
│  Scale: 1.0x
│  Animations: [idle_small, pulse]
│  Decorations: None
│  Color: Green sprout
│
├─ LEVEL 6-15: SPROUT STAGE  
│  Model: /3d-models/avatars/sprout.glb
│  Scale: 1.2x
│  Animations: [idle_medium, sway, grow]
│  Decorations: [butterfly, leaf_glow]
│  Color: Growing green
│
├─ LEVEL 16-30: MATURE TREE STAGE
│  Model: /3d-models/avatars/tree.glb
│  Scale: 1.5x
│  Animations: [idle_large, wind_sway]
│  Decorations: [birds, fruit, flowers]
│  Color: Strong green
│
└─ LEVEL 31-50: ANCIENT MAGICAL TREE
   Model: /3d-models/avatars/ancient_tree.glb
   Scale: 1.8x
   Animations: [idle_epic, pulse_magic]
   Decorations: [castle, waterfall, magical_aura]
   Color: Golden/mystical glow
```

### Island Themes
```
DEFAULT THEME:
- Sky: #87CEEB (light blue)
- Ground: #90EE90 (light green)
- Water: #4A90E2 (blue)
- Lighting: 0.8 intensity

NIGHT THEME:
- Sky: #1a1a2e (dark blue)
- Ground: #16213e (dark)
- Water: #0f3460 (dark blue)
- Lighting: 0.4 intensity (moonlit)

AUTUMN THEME:
- Sky: #FFB347 (orange)
- Ground: #CD853F (brown)
- Water: #8B4513 (dark brown)
- Lighting: 0.7 intensity (warm)
```

### Level-Up Animation Sequence
```
Timeline (2.5 seconds):
0.0s ──→ Pause animations
0.1s ──→ Particle burst (yellow/gold)
0.2s ──→ Scale bloom (1.0 → 1.2 → 1.0)
0.3s ──→ Play growth animation
0.5s ──→ Play sound effect (chime)
1.0s ──→ Decorations appear (fade in)
1.5s ──→ Camera zoom effect
2.0s ──→ Confetti particle shower
2.5s ──→ Resume normal animations

USER FEELS: Victory, progress, achievement 🎉
```

---

## 📊 Database Schema Quick Reference

### User Document
```javascript
{
  _id: ObjectId,
  email: "user@example.com" (indexed),
  username: "john_doe" (indexed),
  passwordHash: "$2b$10$...", // bcrypt
  displayName: "John Doe",
  stats: {
    level: 5,
    totalXP: 2450,
    currentXP: 150,
    xpThreshold: 700,
    streakCurrent: 12,
    multiplier: 1.5
  },
  avatar3D: {
    type: "island",
    growthStage: 2,
    customizations: [{type: "color", value: "#FF5733"}]
  },
  preferences: {
    timezone: "America/New_York",
    notifications: {email: true, reminders: true}
  },
  createdAt: 2024-01-15T10:30:00Z
}
```

### Habit Document
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  name: "Morning Run",
  category: "fitness",
  icon: "💪",
  color: "#FF6347",
  frequency: {
    type: "daily",
    daysOfWeek: [1,3,5,6,0] // M,W,F,Sa,Su
  },
  target: {
    value: 5,
    unit: "km",
    type: "duration"
  },
  xpReward: 20,
  streakBonus: 5,
  isActive: true,
  streak: {
    current: 12,
    record: 45,
    lastCompletedDate: 2024-03-26T06:15:00Z
  },
  createdAt: 2024-01-20T14:00:00Z
}
```

### HabitLog Document
```javascript
{
  _id: ObjectId,
  habitId: ObjectId (indexed),
  userId: ObjectId (indexed),
  date: "2024-03-26", // YYYY-MM-DD
  completedAt: 2024-03-26T06:45:00Z,
  value: 5.2, // km completed
  isCompleted: true,
  notes: "Felt great! Ran extra lap.",
  xpEarned: 28, // 20 base × 1.35 streak × 1.05 consistency
  multiplierApplied: 1.05,
  mood: "great",
  difficulty: "normal",
  createdAt: 2024-03-26T06:46:00Z
}
```

---

## 🔐 Security Checklist

```
✅ Authentication
  - NextAuth.js for session management
  - bcrypt password hashing
  - HTTP-only secure cookies
  - CSRF protection

✅ Authorization
  - userId check on all protected routes
  - Middleware verification
  - Role-based access (future: admin panel)

✅ Data Validation
  - Zod schemas on all inputs
  - Sanitize before saving
  - Type checking with TypeScript

✅ API Security
  - Rate limiting (100 req/min per user)
  - Input length limits
  - SQL injection prevention (Mongoose)
  - XSS protection (React escaping)

✅ XP Anti-Cheat
  - All XP calculations server-side
  - Validate completions vs user's habits
  - Timestamp validation
  - Prevent duplicate submissions
```

---

## 📈 Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| **Page Load** | < 2 sec | Code split, image optimization |
| **API Response** | < 200ms | Database indexes, caching |
| **3D Scene Load** | < 3 sec | Model pre-loading, LOD system |
| **Animation FPS** | 60 FPS | Optimized shaders, batching |
| **Database Query** | < 100ms | Compound indexes, aggregation |
| **Bundle Size** | < 150KB | Tree-shaking, minification |

---

## 🚀 Tech Stack Summary

```
Frontend:
├── Next.js 16 (App Router)
├── React 19
├── Tailwind CSS
├── shadcn/ui components
└── TypeScript

State Management:
├── Zustand (client state)
└── SWR (data fetching)

3D Graphics:
├── Three.js
├── React Three Fiber
└── drei (helpers)

Backend:
├── Next.js API Routes
├── Node.js runtime
└── TypeScript

Database:
├── MongoDB
├── Mongoose ODM
└── MongoDB Atlas (cloud)

AI:
├── Google Gemini API
└── Prompt engineering

Authentication:
├── NextAuth.js
├── bcrypt (password hashing)
└── JWT (sessions)

Validation:
├── Zod schemas
└── TypeScript types

Deployment:
├── Vercel (hosting)
├── GitHub (version control)
└── MongoDB Atlas (database)
```

---

## 📱 Key Component Tree

```
app/layout.tsx
├── Header
│   ├── Logo
│   ├── UserMenu
│   │   ├── Profile
│   │   ├── Settings
│   │   └── Logout
│   └── StatsBar
│       ├── LevelDisplay
│       ├── XPBar
│       └── StreakBadge
├── Sidebar
│   ├── Nav Items
│   ├── QuickStats
│   └── Shortcuts
└── Main Content
    ├── page.tsx (Dashboard)
    │   ├── StatsOverview
    │   ├── HabitList
    │   ├── RecentActivity
    │   └── QuickStats
    │
    ├── habits/page.tsx
    │   ├── HabitList
    │   │   └── HabitCard[]
    │   └── DailyCheckin
    │       └── HabitTracker[]
    │
    ├── island-avatar/page.tsx
    │   ├── IslandScene (3D)
    │   ├── GrowthStats
    │   └── CustomizationPanel
    │
    ├── ai-coach/page.tsx
    │   ├── ActionPlanCard
    │   ├── InsightsList
    │   ├── RecommendationItem[]
    │   └── WeeklyChallenge
    │
    └── settings/page.tsx
        ├── UserProfile
        ├── Preferences
        └── AchievementShowcase
```

---

## 🎯 Success Metrics

### Day 30 Targets
- **Retention**: 40%+ day 7 return rate
- **Engagement**: 60%+ complete ≥1 habit daily
- **Monetization Ready**: Premium cosmetics system designed
- **Stability**: 99.9% uptime, <200ms API response

### Month 3 Targets
- **Users**: 10,000+ registered
- **DAU**: 3,000+ daily active users
- **Content**: 50,000+ habits created
- **Leaderboards**: Top 1,000 players featured

---

## 🔧 How to Use This Documentation

### For Frontend Devs:
1. Read **ARCHITECTURE.md** → Folder structure & components
2. Read **TYPES_AND_CONFIG.md** → TypeScript types
3. Read **IMPLEMENTATION_ROADMAP.md** → Week-by-week tasks

### For Backend/API Devs:
1. Read **MONGODB_MODELS.md** → Database setup
2. Read **ARCHITECTURE.md** → API route specs
3. Read **AI_COACH_IMPLEMENTATION.md** → Gemini integration

### For 3D/Graphics Devs:
1. Read **ARCHITECTURE.md** → 3D Dashboard Strategy
2. Read **TYPES_AND_CONFIG.md** → Avatar growth config
3. Read **DESIGN_SUMMARY.md** → Growth stages & animations

### For Project Managers:
1. Read **IMPLEMENTATION_ROADMAP.md** → Phases & timeline
2. Read **DESIGN_SUMMARY.md** → System overview
3. Check success metrics & deliverables per phase

---

## 📞 Getting Started

### Step 1: Setup
```bash
git clone https://github.com/yourusername/habitforge-2.0.git
cd habitforge-2.0
npm install
cp .env.example .env.local
```

### Step 2: Environment
Edit `.env.local`:
```
MONGODB_URI=<your-mongodb-atlas-url>
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GEMINI_API_KEY=<your-api-key>
```

### Step 3: Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Step 4: Build & Deploy
```bash
npm run build
npm start
# Deploy to Vercel: vercel --prod
```

---

## 📚 Additional Resources

- **Next.js Docs**: nextjs.org
- **Mongoose**: mongoosejs.com
- **Gemini API**: ai.google.dev
- **Three.js/R3F**: threejs.org, r3f.docs.pmnd.rs
- **Zustand**: github.com/pmndrs/zustand
- **shadcn/ui**: ui.shadcn.com

---

**Last Updated**: March 2026
**Status**: Ready for Implementation
**Target Launch**: 6 weeks from start

🚀 Happy building!
