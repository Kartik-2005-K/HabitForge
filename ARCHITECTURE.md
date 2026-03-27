# HabitForge 2.0: Comprehensive Architecture & Design Document

## Table of Contents
1. [MongoDB Schema Design](#mongodb-schema-design)
2. [Folder Structure](#folder-structure)
3. [AI Coach Logic](#ai-coach-logic)
4. [Gamification System](#gamification-system)
5. [3D Dashboard Strategy](#3d-dashboard-strategy)
6. [Tech Stack Integration](#tech-stack-integration)
7. [API Route Specifications](#api-route-specifications)
8. [Component Architecture](#component-architecture)

---

## 1. MongoDB Schema Design

### User Schema
```javascript
{
  _id: ObjectId,
  
  // Auth & Identity
  email: String (unique, indexed),
  username: String (unique),
  passwordHash: String, // bcrypt hashed
  
  // Profile
  displayName: String,
  avatar: {
    url: String,
    uploadsAt: Date
  },
  
  // Gamification Stats
  stats: {
    level: Number (default: 1),
    totalXP: Number (default: 0),
    currentXP: Number (default: 0), // XP towards next level
    xpThreshold: Number (default: 100), // XP needed for next level
    
    streakCurrent: Number (default: 0),
    streakRecord: Number (default: 0),
    
    totalHabitsCompleted: Number (default: 0),
    consecutiveDays: Number (default: 0),
    
    multiplier: Number (default: 1.0), // 1.0 - 3.0x
    multiplierExpiresAt: Date // when multiplier resets
  },
  
  // 3D Avatar/Island State
  avatar3D: {
    type: String, // 'island' | 'garden' | 'castle'
    growthStage: Number, // 1-10 based on levels
    customizations: [
      {
        type: String, // 'color', 'decoration', 'theme'
        value: String
      }
    ],
    lastUpdated: Date
  },
  
  // Preferences
  preferences: {
    theme: String, // 'light' | 'dark'
    notifications: {
      email: Boolean,
      push: Boolean,
      reminders: Boolean,
      reminderTimes: [String] // ['09:00', '14:00', '21:00']
    },
    timezone: String (default: 'UTC')
  },
  
  // Timestamps
  createdAt: Date (indexed),
  updatedAt: Date,
  lastActiveAt: Date
}
```

### Habits Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  
  // Basic Info
  name: String,
  description: String,
  category: String, // 'health', 'fitness', 'learning', 'productivity', 'mindfulness'
  icon: String, // emoji or icon name
  color: String, // hex color
  
  // Frequency & Schedule
  frequency: {
    type: String, // 'daily' | 'weekly' | 'custom'
    daysOfWeek: [Number], // [0=Sun, 1=Mon, ...] for weekly
    timesPerWeek: Number, // for weekly habits
    customDays: [String] // ISO date strings for custom frequency
  },
  
  // Target & Metrics
  target: {
    value: Number, // e.g., 8 for 8 glasses of water
    unit: String, // 'glasses', 'miles', 'minutes', 'count'
    type: String, // 'count' | 'duration' | 'yes_no'
  },
  
  // XP & Rewards
  xpReward: Number (default: 10), // base XP
  streakBonus: Number (default: 5), // additional XP per streak day
  
  // Status
  isActive: Boolean (default: true),
  isArchived: Boolean (default: false),
  
  // Streaks & History
  streak: {
    current: Number (default: 0),
    record: Number (default: 0),
    lastCompletedDate: Date
  },
  
  // Timestamps
  createdAt: Date (indexed),
  updatedAt: Date,
  archivedAt: Date
}
```

### Habit Logs Schema (Daily Entries)
```javascript
{
  _id: ObjectId,
  habitId: ObjectId (indexed),
  userId: ObjectId (indexed),
  
  // Completion Data
  completedAt: Date,
  date: String (ISO format: YYYY-MM-DD, indexed with userId),
  
  // Performance
  value: Number, // actual value completed (e.g., 7 of 8 glasses)
  isCompleted: Boolean,
  notes: String,
  
  // XP Earned
  xpEarned: Number,
  multiplierApplied: Number (default: 1.0),
  
  // Metadata
  mood: String, // 'great' | 'good' | 'okay' | 'bad' (optional)
  difficulty: String, // 'easy' | 'normal' | 'hard' (optional)
  
  createdAt: Date
}
```

### AI Logs Schema (Weekly Action Plans)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  
  // Week Info
  weekStartDate: Date (indexed),
  weekEndDate: Date,
  
  // Analysis
  analysis: {
    // 7-day history summary
    completionRate: Number, // 0-100
    bestDay: String, // YYYY-MM-DD
    worstDay: String,
    totalXPEarned: Number,
    habitsTracked: Number,
    consistencyScore: Number, // 0-100
    
    // Insight Analysis
    insights: [
      {
        habitId: ObjectId,
        habitName: String,
        performance: String, // 'excellent' | 'good' | 'needs_work'
        completionRate: Number,
        trend: String, // 'improving' | 'stable' | 'declining'
        reason: String // AI-generated reason
      }
    ]
  },
  
  // AI-Generated Action Plan
  actionPlan: {
    motivationalMessage: String,
    keyRecommendations: [
      {
        type: String, // 'schedule_adjustment' | 'habit_change' | 'encouragement'
        habitId: ObjectId,
        habitName: String,
        action: String, // Specific recommendation
        reasoning: String,
        difficulty: String // 'easy' | 'medium' | 'hard'
      }
    ],
    
    // Suggested schedule adjustments
    scheduleAdjustments: [
      {
        habitId: ObjectId,
        habitName: String,
        currentTime: String,
        suggestedTime: String,
        reason: String
      }
    ],
    
    // XP & Streak Predictions
    predictions: {
      nextWeekXPProjection: Number,
      potentialStreakGain: Number,
      nextLevelETA: String // "3-4 weeks"
    },
    
    // Challenge for the week
    weeklyChallenge: {
      name: String,
      description: String,
      targetCompletion: Number, // percentage
      reward: Number // bonus XP
    }
  },
  
  // Status
  isRead: Boolean (default: false),
  
  // Timestamps
  generatedAt: Date (indexed),
  expiresAt: Date
}
```

---

## 2. Folder Structure

```
habitforge-2.0/
│
├── apps/
│   ├── web/                    # Next.js Frontend + API Routes
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── page.tsx
│   │   │   │
│   │   │   ├── (auth)/         # Auth routes group
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   │
│   │   │   ├── (protected)/    # Protected routes group
│   │   │   │   ├── layout.tsx  # Auth middleware
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── habits/
│   │   │   │   │   ├── page.tsx       # View all habits
│   │   │   │   │   ├── [id]/page.tsx  # Habit detail
│   │   │   │   │   └── create/page.tsx
│   │   │   │   ├── ai-coach/
│   │   │   │   │   ├── page.tsx       # AI Coach Dashboard
│   │   │   │   │   └── [weekId]/page.tsx
│   │   │   │   ├── island-avatar/page.tsx
│   │   │   │   ├── leaderboard/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   │
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       │   ├── [...nextauth]/route.ts
│   │   │       │   └── verify-email/route.ts
│   │   │       │
│   │   │       ├── habits/
│   │   │       │   ├── route.ts             # GET/POST habits
│   │   │       │   ├── [id]/route.ts        # GET/PUT/DELETE specific habit
│   │   │       │   ├── [id]/complete/route.ts
│   │   │       │   └── [id]/stats/route.ts
│   │   │       │
│   │   │       ├── logs/
│   │   │       │   ├── route.ts             # GET habit logs (filtered by date)
│   │   │       │   └── [habitId]/route.ts   # POST new log entry
│   │   │       │
│   │   │       ├── ai-coach/
│   │   │       │   ├── generate-plan/route.ts    # Gemini API
│   │   │       │   ├── analyze-week/route.ts
│   │   │       │   └── [weekId]/route.ts
│   │   │       │
│   │   │       ├── gamification/
│   │   │       │   ├── xp/route.ts              # Award XP
│   │   │       │   ├── multiplier/route.ts      # Get/apply multiplier
│   │   │       │   ├── avatar/route.ts          # Get avatar state
│   │   │       │   └── leaderboard/route.ts
│   │   │       │
│   │   │       └── user/
│   │   │           ├── profile/route.ts
│   │   │           ├── preferences/route.ts
│   │   │           └── stats/route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn components
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   │
│   │   │   ├── habits/
│   │   │   │   ├── HabitCard.tsx
│   │   │   │   ├── HabitList.tsx
│   │   │   │   ├── HabitForm.tsx
│   │   │   │   ├── HabitTracker.tsx
│   │   │   │   └── DailyCheckin.tsx
│   │   │   │
│   │   │   ├── gamification/
│   │   │   │   ├── XPBar.tsx
│   │   │   │   ├── LevelUpNotification.tsx
│   │   │   │   ├── StreakBadge.tsx
│   │   │   │   ├── MultiplierDisplay.tsx
│   │   │   │   └── AchievementUnlocked.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsOverview.tsx
│   │   │   │   ├── RecentActivity.tsx
│   │   │   │   ├── HabitCalendar.tsx
│   │   │   │   └── QuickStats.tsx
│   │   │   │
│   │   │   ├── island-avatar/
│   │   │   │   ├── IslandScene.tsx        # Three.js component
│   │   │   │   ├── AvatarController.tsx
│   │   │   │   ├── GrowthAnimations.tsx
│   │   │   │   └── CustomizationPanel.tsx
│   │   │   │
│   │   │   ├── ai-coach/
│   │   │   │   ├── ActionPlanCard.tsx
│   │   │   │   ├── InsightsList.tsx
│   │   │   │   ├── RecommendationItem.tsx
│   │   │   │   ├── WeeklyChallenge.tsx
│   │   │   │   └── CoachMessage.tsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── NavBar.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts              # Session management
│   │   │   ├── useHabits.ts            # Habit CRUD operations
│   │   │   ├── useGamification.ts      # XP, levels, multipliers
│   │   │   ├── useHabitLogs.ts         # Log entries
│   │   │   └── useActionPlan.ts        # AI Coach interaction
│   │   │
│   │   ├── lib/
│   │   │   ├── mongodb.ts              # MongoDB connection & utilities
│   │   │   ├── auth.ts                 # NextAuth config & helpers
│   │   │   ├── gemini-ai.ts            # Gemini API client
│   │   │   ├── xp-calculator.ts        # XP logic
│   │   │   ├── streak-calculator.ts    # Streak logic
│   │   │   ├── multiplier-logic.ts     # Multiplier system
│   │   │   ├── avatar-growth.ts        # Avatar/Island progression
│   │   │   ├── validation.ts           # Input validation schemas
│   │   │   └── utils.ts                # General utilities
│   │   │
│   │   ├── store/
│   │   │   ├── useAuthStore.ts         # Zustand - Auth state
│   │   │   ├── useHabitStore.ts        # Zustand - Habits state
│   │   │   ├── useGameStore.ts         # Zustand - Gamification state
│   │   │   ├── useUIStore.ts           # Zustand - UI state
│   │   │   └── useAvatarStore.ts       # Zustand - Avatar state
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── habits.ts
│   │   │   ├── user.ts
│   │   │   ├── gamification.ts
│   │   │   ├── ai-coach.ts
│   │   │   └── three-d.ts
│   │   │
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── 3d-models/
│   │   │   │   ├── island-base.glb
│   │   │   │   ├── island-decorations/
│   │   │   │   └── avatars/
│   │   │   └── images/
│   │   │
│   │   ├── next.config.mjs
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── .env.local
│
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── xp-config.ts
│   │   │   ├── categories.ts
│   │   │   └── ui-config.ts
│   │   ├── utils/
│   │   │   ├── calculations.ts
│   │   │   └── formatters.ts
│   │   └── package.json
│   │
│   └── database/
│       ├── schemas/
│       │   ├── user.schema.ts
│       │   ├── habit.schema.ts
│       │   ├── habitLog.schema.ts
│       │   └── aiLog.schema.ts
│       ├── models/
│       │   ├── User.ts
│       │   ├── Habit.ts
│       │   ├── HabitLog.ts
│       │   └── AILog.ts
│       └── package.json
│
├── docs/
│   ├── API_ROUTES.md
│   ├── GAMIFICATION_LOGIC.md
│   ├── AI_COACH_FLOW.md
│   ├── 3D_AVATAR_GUIDE.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── pnpm-workspace.yaml
├── tsconfig.json
└── package.json
```

---

## 3. AI Coach Logic

### Weekly Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WEEKLY AI COACH FLOW                     │
└─────────────────────────────────────────────────────────────┘

1. TRIGGER (Every Sunday 9 PM in user's timezone)
   └─> Call /api/ai-coach/generate-plan

2. DATA COLLECTION (Last 7 days)
   └─> Fetch user's habit logs
   └─> Calculate:
       - Completion rate per habit
       - Total XP earned
       - Streak changes
       - Consistency patterns
       - Best/worst habits

3. GEMINI API ANALYSIS
   └─> Send structured prompt with user data
   └─> Receive JSON Action Plan

4. GENERATE ACTION PLAN
   └─> Parse AI response
   └─> Create insights array
   └─> Generate recommendations
   └─> Predict next week performance
   └─> Save to AILog collection

5. NOTIFY USER
   └─> Email notification
   └─> In-app notification
   └─> Badge/flag on dashboard
```

### Gemini Prompt Template

```javascript
const generateCoachPrompt = (userData: UserAnalytics) => {
  return `You are HabitForge AI Coach, an expert habit strategist. Analyze this user's 
7-day habit performance and generate actionable insights.

USER STATS (Week of ${userData.weekStart}):
- Total Habits: ${userData.totalHabits}
- Completion Rate: ${userData.completionRate}%
- XP Earned: ${userData.totalXP}
- Streak Status: ${userData.streakCurrent} days (record: ${userData.streakRecord})
- Level: ${userData.level}

HABIT PERFORMANCE:
${userData.habits.map(h => 
  \`- \${h.name}: \${h.completedDays}/7 days (\${h.completionRate}%)
     Category: \${h.category}, Streak: \${h.currentStreak}\`
).join('\n')}

MOOD/DIFFICULTY DATA:
${userData.moodData}

Generate a JSON response with this structure:
{
  "motivationalMessage": "Personalized encouragement (2-3 sentences)",
  "performanceSummary": "Overall performance assessment",
  "keyInsights": [
    {
      "habitName": "habit name",
      "insight": "specific observation",
      "trend": "improving|stable|declining"
    }
  ],
  "recommendations": [
    {
      "type": "schedule_adjustment|habit_change|encouragement",
      "habitName": "habit name",
      "action": "specific recommendation",
      "reasoning": "why this helps",
      "difficulty": "easy|medium|hard"
    }
  ],
  "weeklyChallenge": {
    "name": "challenge name",
    "description": "description",
    "targetCompletion": 85,
    "reward": 50
  },
  "nextWeekProjection": {
    "estimatedXP": number,
    "potentialLevel": number,
    "streakPrediction": "likely to: maintain|grow|reset"
  }
}`;
};
```

---

## 4. Gamification System

### XP Calculation Engine

```typescript
interface XPConfig {
  baseXP: number;           // Per habit completion
  streakMultiplier: number; // +5% per streak day
  multiplierBonus: number;  // Current active multiplier
  consistencyBonus: number; // Bonus for completing all habits
  difficultyModifier: number; // 0.8x - 1.5x
}

function calculateXP(completion: HabitCompletion): number {
  let xp = completion.habit.baseXP; // e.g., 10 XP
  
  // Streak multiplier (capped at 2.0x)
  const streakMultiplier = Math.min(
    1 + (completion.streakDays * 0.05),
    2.0
  );
  xp *= streakMultiplier;
  
  // Active multiplier (1.0x - 3.0x)
  xp *= userState.multiplier;
  
  // Difficulty modifier
  xp *= getDifficultyModifier(completion.difficulty);
  
  // Consistency bonus (10% if all habits completed today)
  if (isAllHabitsCompletedToday) {
    xp *= 1.1;
  }
  
  return Math.floor(xp);
}
```

### Leveling System

```typescript
interface LevelConfig {
  level: number;
  xpThreshold: number; // XP needed for this level
  rewards: {
    avatarDecoration: string;
    multiplierBoost: number;
    badgeUnlocked: string;
  };
}

const LEVEL_CONFIG: LevelConfig[] = [
  { level: 1, xpThreshold: 0, rewards: {} },
  { level: 2, xpThreshold: 100, rewards: { avatarDecoration: 'flower1' } },
  { level: 3, xpThreshold: 250, rewards: { multiplierBoost: 1.1 } },
  { level: 4, xpThreshold: 450, rewards: { badgeUnlocked: 'week_warrior' } },
  { level: 5, xpThreshold: 700, rewards: { avatarDecoration: 'tree1' } },
  // ... continues to level 50+
];

function checkLevelUp(user: User, xpGained: number): LevelUpEvent | null {
  user.currentXP += xpGained;
  
  while (user.currentXP >= user.xpThreshold) {
    const nextLevel = LEVEL_CONFIG[user.level];
    if (!nextLevel) return null;
    
    user.currentXP -= user.xpThreshold;
    user.level++;
    user.xpThreshold = LEVEL_CONFIG[user.level].xpThreshold;
    
    // Apply rewards
    applyLevelUpRewards(user, LEVEL_CONFIG[user.level]);
    
    return {
      previousLevel: user.level - 1,
      newLevel: user.level,
      rewards: LEVEL_CONFIG[user.level].rewards
    };
  }
  
  return null;
}
```

### Streak & Multiplier System

```typescript
interface StreakLogic {
  dailyCheck: () => void;
  onHabitComplete: (habitId: string) => void;
  resetOnMiss: (habitId: string) => void;
}

// Daily check (runs at midnight)
async function checkStreaks(userId: string) {
  const user = await User.findById(userId);
  const today = new Date().toDateString();
  
  // Check if user had any completions today
  const todayLogs = await HabitLog.find({
    userId,
    date: today
  });
  
  if (todayLogs.length === 0) {
    // User missed today - reset global streak
    user.stats.streakCurrent = 0;
    user.stats.consecutiveDays = 0;
  }
}

// Multiplier Logic
interface MultiplierSystem {
  // 7-day streak = 1.5x multiplier
  // 14-day streak = 2.0x multiplier
  // 30-day streak = 3.0x multiplier (max)
}

function calculateMultiplier(userStreak: number): number {
  if (userStreak < 7) return 1.0;
  if (userStreak < 14) return 1.5;
  if (userStreak < 30) return 2.0;
  return 3.0; // Max multiplier
}

// Multiplier decays if streak breaks
function onStreakReset(user: User) {
  user.stats.multiplier = 1.0;
  user.stats.multiplierExpiresAt = null;
}
```

---

## 5. 3D Dashboard Strategy

### Three.js/React Three Fiber Architecture

```typescript
// IslandScene.tsx - Main 3D Component

import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import { useAvatarStore } from '@/store/useAvatarStore';

export function IslandScene() {
  const { avatar3D, level } = useAvatarStore();
  const islandGroup = useRef();
  
  // Growth stages affect model complexity
  const getGrowthStage = (level: number) => {
    // Level 1-5: Seedling, 6-15: Young Plant, 16-30: Mature, 31-50: Magnificent
    return Math.ceil(level / 10);
  };
  
  return (
    <Canvas
      camera={{ position: [0, 5, 8], fov: 50 }}
      style={{ width: '100%', height: '600px' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, 8, 5]} intensity={0.5} />
      
      <group ref={islandGroup}>
        {/* Base Island */}
        <IslandModel growthStage={getGrowthStage(level)} />
        
        {/* Avatar/Plant that grows with level */}
        <AvatarModel 
          type={avatar3D.type}
          growthStage={getGrowthStage(level)}
          customizations={avatar3D.customizations}
        />
        
        {/* Animated particles for XP */}
        <XPParticleSystem xpLevel={level} />
        
        {/* Decorations based on unlocked levels */}
        <DecorationElements level={level} />
      </group>
      
      <OrbitControls autoRotate autoRotateSpeed={2} />
      <Background />
    </Canvas>
  );
}
```

### Avatar Growth System

```typescript
interface AvatarGrowthConfig {
  stage: number;
  levelRange: [number, number];
  model: string;
  scale: number;
  decorations: string[];
  animations: string[];
}

const AVATAR_GROWTH_STAGES: AvatarGrowthConfig[] = [
  {
    stage: 1,
    levelRange: [1, 5],
    model: '/3d-models/avatars/seedling.glb',
    scale: 1.0,
    decorations: [],
    animations: ['idle_small', 'pulse']
  },
  {
    stage: 2,
    levelRange: [6, 15],
    model: '/3d-models/avatars/sprout.glb',
    scale: 1.2,
    decorations: ['butterfly', 'leaf_glow'],
    animations: ['idle_medium', 'sway', 'grow']
  },
  {
    stage: 3,
    levelRange: [16, 30],
    model: '/3d-models/avatars/tree.glb',
    scale: 1.5,
    decorations: ['birds', 'fruit', 'flowers'],
    animations: ['idle_large', 'wind_sway']
  },
  {
    stage: 4,
    levelRange: [31, 50],
    model: '/3d-models/avatars/ancient_tree.glb',
    scale: 1.8,
    decorations: ['castle', 'waterfall', 'magical_aura'],
    animations: ['idle_epic', 'pulse_magic']
  }
];

// Smooth animations when leveling up
function useLevelUpAnimation(previousLevel: number, newLevel: number) {
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    if (previousLevel < newLevel) {
      // Trigger growth animation
      // Particle burst, scale increase, rotation spin
      
      setTimeout(() => setIsAnimating(false), 3000);
    }
  }, [newLevel]);
  
  return isAnimating;
}
```

### Performance Optimization

- **LOD (Level of Detail)**: Use simpler models when zoomed out
- **Model Pre-loading**: Load models in background
- **Animation Caching**: Cache animations per stage
- **Lazy Loading**: Only render visible decorations
- **Shader Optimization**: Use efficient materials

---

## 6. Tech Stack Integration

### Zustand Store Architecture

```typescript
// store/useGameStore.ts
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GameState {
  // User Stats
  level: number;
  totalXP: number;
  currentXP: number;
  xpThreshold: number;
  
  // Multiplier & Streak
  currentMultiplier: number;
  currentStreak: number;
  streakRecord: number;
  
  // Avatar State
  avatar3D: Avatar3D;
  
  // Actions
  addXP: (amount: number) => void;
  checkLevelUp: () => LevelUpEvent | null;
  setMultiplier: (multiplier: number) => void;
  updateStreak: (days: number) => void;
  updateAvatar: (updates: Partial<Avatar3D>) => void;
  
  // Async Actions
  fetchUserStats: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    level: 1,
    totalXP: 0,
    currentXP: 0,
    xpThreshold: 100,
    currentMultiplier: 1.0,
    currentStreak: 0,
    streakRecord: 0,
    avatar3D: {},
    
    addXP: (amount: number) => {
      set((state) => ({
        totalXP: state.totalXP + amount,
        currentXP: state.currentXP + amount,
      }));
      
      const newEvent = get().checkLevelUp();
      if (newEvent) {
        // Trigger level-up celebration
      }
    },
    
    checkLevelUp: () => {
      // Level-up logic
    },
    
    syncWithServer: async () => {
      const state = get();
      await fetch('/api/gamification/sync', {
        method: 'POST',
        body: JSON.stringify(state)
      });
    }
  }))
);

// Subscribe to specific changes
useGameStore.subscribe(
  (state) => state.level,
  (newLevel, oldLevel) => {
    if (newLevel > oldLevel) {
      triggerLevelUpAnimation();
    }
  }
);
```

### NextAuth Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { User } from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }
        
        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username
        };
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login'
  }
};
```

---

## 7. API Route Specifications

### POST /api/habits/[id]/complete

```typescript
// Request
{
  "value": 8,  // glasses of water completed
  "notes": "Felt great today!",
  "difficulty": "easy",  // easy | normal | hard
  "mood": "great"        // great | good | okay | bad
}

// Response
{
  "success": true,
  "xpEarned": 15,
  "streakUpdated": true,
  "levelUp": {
    "previousLevel": 3,
    "newLevel": 4,
    "rewards": ["new_decoration", "multiplier_boost"]
  },
  "multiplierActive": 1.5,
  "nextLog": { ... }
}
```

### POST /api/ai-coach/generate-plan

```typescript
// Triggered weekly or on-demand
// Response
{
  "weekStartDate": "2024-03-17",
  "analysis": {
    "completionRate": 78,
    "consistencyScore": 82,
    "insights": [
      {
        "habitName": "Morning Run",
        "performance": "excellent",
        "completionRate": 100,
        "trend": "improving"
      }
    ]
  },
  "actionPlan": {
    "motivationalMessage": "You're crushing it! Keep the momentum...",
    "keyRecommendations": [...],
    "weeklyChallenge": {
      "name": "Perfect Week",
      "description": "Complete all habits 7/7 days",
      "reward": 100
    },
    "predictions": {
      "nextWeekXPProjection": 450,
      "potentialStreakGain": 7,
      "nextLevelETA": "2 weeks"
    }
  }
}
```

### GET /api/gamification/stats

```typescript
// Response
{
  "level": 5,
  "totalXP": 2450,
  "currentXP": 150,
  "xpThreshold": 700,
  "multiplier": 1.5,
  "streakCurrent": 12,
  "streakRecord": 47,
  "avatar3D": {
    "type": "island",
    "growthStage": 2,
    "customizations": [...]
  },
  "nextLevelETA": "4 days"
}
```

---

## 8. Component Architecture

### Dependency Flow

```
App (Layout)
├── Header (with user stats summary)
├── Sidebar (navigation)
└── Page Routes
    ├── Dashboard
    │   ├── StatsOverview
    │   ├── HabitCalendar
    │   ├── RecentActivity
    │   └── QuickStats
    │
    ├── Habits
    │   ├── HabitList
    │   │   └── HabitCard
    │   ├── DailyCheckin
    │   │   └── HabitTracker
    │   └── HabitForm
    │
    ├── Island Avatar (3D)
    │   ├── IslandScene (Three.js)
    │   ├── AvatarController
    │   ├── GrowthAnimations
    │   └── CustomizationPanel
    │
    ├── AI Coach
    │   ├── ActionPlanCard
    │   ├── InsightsList
    │   ├── WeeklyChallenge
    │   └── RecommendationItem
    │
    └── Profile/Settings
        ├── UserProfile
        ├── Preferences
        └── AchievementShowcase
```

### Key Custom Hooks

```typescript
// hooks/useHabits.ts
function useHabits() {
  const [habits, setHabits] = useState([]);
  const { data, mutate } = useSWR('/api/habits', fetcher);
  
  return {
    habits: data,
    isLoading: !data,
    createHabit: async (habitData) => { ... },
    updateHabit: async (id, updates) => { ... },
    deleteHabit: async (id) => { ... },
    completeHabit: async (id, completion) => { ... }
  };
}

// hooks/useActionPlan.ts
function useActionPlan() {
  const [plan, setPlan] = useState(null);
  
  const generatePlan = async () => {
    const response = await fetch('/api/ai-coach/generate-plan');
    setPlan(await response.json());
  };
  
  const markAsRead = async () => {
    await fetch(`/api/ai-coach/${plan._id}/read`, { method: 'PATCH' });
  };
  
  return { plan, generatePlan, markAsRead };
}

// hooks/useXPReward.ts
function useXPReward() {
  const { addXP, checkLevelUp } = useGameStore();
  
  const awardXP = async (habitId: string, amount: number) => {
    addXP(amount);
    
    const levelUpEvent = checkLevelUp();
    if (levelUpEvent) {
      // Show celebration animation
      showLevelUpNotification(levelUpEvent);
    }
  };
  
  return { awardXP };
}
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- MongoDB schema & connection
- NextAuth.js setup
- User registration & authentication
- Zustand store setup

### Phase 2: Core Features (Week 3-4)
- Habit CRUD operations
- Daily habit tracking & logs
- Basic gamification (XP, levels, streaks)
- Dashboard UI

### Phase 3: AI Integration (Week 5-6)
- Gemini API integration
- Weekly action plan generation
- AI recommendations & insights
- Notification system

### Phase 4: 3D & Polish (Week 7-8)
- Three.js/R3F island setup
- Avatar growth animations
- 3D customization panel
- Performance optimization & deployment

---

## Key Security Considerations

1. **Authentication**: NextAuth with bcrypt password hashing
2. **Database**: MongoDB role-based access control
3. **API Routes**: Middleware authentication check
4. **Rate Limiting**: Prevent API abuse (100 req/min per user)
5. **Data Validation**: Zod schemas on all endpoints
6. **XP System**: Server-side calculation (prevent client cheating)
7. **File Uploads**: Strict file type validation for avatar customizations

---

## Performance Metrics

- **Initial Load**: < 2 seconds
- **3D Scene Load**: < 3 seconds
- **API Response Time**: < 200ms
- **Habit Completion**: Instant UI update + server sync
- **Level-up Animation**: Smooth 2-3 second sequence

---

## Conclusion

HabitForge 2.0 combines sophisticated gamification, AI-powered coaching, and immersive 3D visualization into a comprehensive habit-tracking platform. The architecture prioritizes user engagement, scalability, and performance while maintaining clean separation of concerns across the tech stack.
