# TypeScript Types & Configuration

## Core Type Definitions

```typescript
// types/index.ts

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  _id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatar?: {
    url: string;
    uploadedAt: Date;
  };
  stats: UserStats;
  avatar3D: Avatar3D;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface UserStats {
  level: number;
  totalXP: number;
  currentXP: number;
  xpThreshold: number;
  streakCurrent: number;
  streakRecord: number;
  totalHabitsCompleted: number;
  consecutiveDays: number;
  multiplier: number;
  multiplierExpiresAt?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    reminderTimes: string[]; // ['09:00', '14:00', '21:00']
  };
  timezone: string;
}

// ============================================
// HABITS & TRACKING
// ============================================

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  target: HabitTarget;
  xpReward: number;
  streakBonus: number;
  isActive: boolean;
  isArchived: boolean;
  streak: {
    current: number;
    record: number;
    lastCompletedDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'learning' 
  | 'productivity' 
  | 'mindfulness'
  | 'other';

export interface HabitFrequency {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // [0=Sun, 1=Mon, ...]
  timesPerWeek?: number;
  customDays?: string[]; // ISO date strings
}

export interface HabitTarget {
  value: number;
  unit: string;
  type: 'count' | 'duration' | 'yes_no';
}

export interface HabitLog {
  _id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  date: string; // YYYY-MM-DD
  value: number;
  isCompleted: boolean;
  notes?: string;
  xpEarned: number;
  multiplierApplied: number;
  mood?: 'great' | 'good' | 'okay' | 'bad';
  difficulty?: 'easy' | 'normal' | 'hard';
  createdAt: Date;
}

// ============================================
// GAMIFICATION
// ============================================

export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  rewards: LevelRewards;
  timestamp: Date;
}

export interface LevelRewards {
  avatarDecoration?: string;
  multiplierBoost?: number;
  badgeUnlocked?: string;
  bonusXP?: number;
}

export interface Achievement {
  _id: string;
  userId: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: {
    current: number;
    required: number;
  };
}

export type AchievementType = 
  | 'week_warrior'
  | 'month_master'
  | 'level_milestone'
  | 'perfect_week'
  | 'streak_champion'
  | 'early_bird'
  | 'night_owl'
  | 'xp_collector';

export interface MultiplierState {
  current: number; // 1.0 - 3.0
  streak: number;
  active: boolean;
  expiresAt?: Date;
  source: 'streak' | 'challenge' | 'seasonal';
}

// ============================================
// AI COACH & ANALYSIS
// ============================================

export interface WeeklyAnalysis {
  completionRate: number;
  bestDay: string;
  worstDay: string;
  totalXPEarned: number;
  habitsTracked: number;
  consistencyScore: number;
  insights: HabitInsight[];
}

export interface HabitInsight {
  habitId: string;
  habitName: string;
  performance: 'excellent' | 'good' | 'needs_work';
  completionRate: number;
  trend: 'improving' | 'stable' | 'declining';
  reason: string;
}

export interface ActionPlan {
  motivationalMessage: string;
  performanceSummary: string;
  keyInsights: HabitInsight[];
  recommendations: Recommendation[];
  weeklyChallenge: WeeklyChallenge;
  predictions: LevelPredictions;
}

export interface Recommendation {
  type: 'schedule_adjustment' | 'habit_change' | 'encouragement';
  habitId: string;
  habitName: string;
  action: string;
  reasoning: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WeeklyChallenge {
  name: string;
  description: string;
  targetCompletion: number;
  reward: number;
  progress?: number;
  completed?: boolean;
}

export interface LevelPredictions {
  nextWeekXPProjection: number;
  potentialLevel: number;
  streakPrediction: 'maintain' | 'grow' | 'reset';
  nextLevelETA: string;
}

export interface AILog {
  _id: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  analysis: WeeklyAnalysis;
  actionPlan: ActionPlan;
  isRead: boolean;
  generatedAt: Date;
  expiresAt: Date;
}

// ============================================
// 3D AVATAR & ISLAND
// ============================================

export interface Avatar3D {
  type: 'island' | 'garden' | 'castle';
  growthStage: number; // 1-4
  scale: number;
  customizations: Customization[];
  lastUpdated: Date;
}

export interface Customization {
  type: 'color' | 'decoration' | 'theme';
  value: string;
  unlockedAt?: Date;
  isActive: boolean;
}

export interface GrowthStageConfig {
  stage: number;
  levelRange: [number, number];
  model: string;
  scale: number;
  decorations: string[];
  animations: string[];
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HabitCompletionResponse extends ApiResponse {
  xpEarned: number;
  streakUpdated: boolean;
  levelUp?: LevelUpEvent;
  multiplierActive: number;
}

// ============================================
// ZUSTAND STORE TYPES
// ============================================

export interface GameState {
  // User stats
  level: number;
  totalXP: number;
  currentXP: number;
  xpThreshold: number;
  
  // Multiplier & streak
  currentMultiplier: number;
  currentStreak: number;
  streakRecord: number;
  
  // Avatar
  avatar3D: Avatar3D;
  
  // UI state
  showLevelUpNotification: boolean;
  notificationData?: LevelUpEvent;
  
  // Actions
  addXP: (amount: number) => void;
  checkLevelUp: () => LevelUpEvent | null;
  setMultiplier: (multiplier: number) => void;
  updateStreak: (days: number) => void;
  updateAvatar: (updates: Partial<Avatar3D>) => void;
  fetchUserStats: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  triggerLevelUp: (event: LevelUpEvent) => void;
}

export interface HabitState {
  habits: Habit[];
  selectedHabit?: Habit;
  isLoading: boolean;
  error?: string;
  
  // Actions
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  selectHabit: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

export interface AuthState {
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  logout: () => void;
}
```

---

## Configuration Files

### XP & Gamification Config

```typescript
// lib/xp-config.ts

export const XP_CONFIG = {
  BASE_XP_PER_COMPLETION: 10,
  
  // Streaks
  STREAK_XP_BONUS_PER_DAY: 0.05, // 5% per day
  STREAK_MULTIPLIER_CAP: 2.0,
  STREAK_RESET_THRESHOLD: 1, // reset after 1 day missed
  
  // Multipliers
  MULTIPLIER_SCALING: {
    level_7_day_streak: 1.5,
    level_14_day_streak: 2.0,
    level_30_day_streak: 3.0,
  } as const,
  
  // Level progression
  LEVEL_CURVE: {
    baseThreshold: 100,
    multiplier: 1.5, // Each level requires 1.5x more XP
    maxLevel: 50,
  },
  
  // Bonuses
  CONSISTENCY_BONUS: 0.1, // 10% bonus if all habits completed
  PERFECT_WEEK_BONUS: 100, // XP bonus for perfect week
  DIFFICULTY_MODIFIERS: {
    easy: 0.8,
    normal: 1.0,
    hard: 1.5,
  } as const,
  
  // Challenge multipliers
  CHALLENGE_XP_MULTIPLIER: 1.5,
  
  // Decay settings
  MULTIPLIER_DECAY_PER_DAY_MISSED: 0.2,
  STREAK_RESET_DELAY_HOURS: 24,
};

export const LEVEL_THRESHOLDS = generateLevelThresholds();

function generateLevelThresholds() {
  const thresholds: Record<number, number> = {};
  let cumulativeXP = 0;
  
  for (let level = 1; level <= 50; level++) {
    const threshold = Math.floor(
      XP_CONFIG.LEVEL_CURVE.baseThreshold *
      Math.pow(XP_CONFIG.LEVEL_CURVE.multiplier, level - 1)
    );
    cumulativeXP += threshold;
    thresholds[level] = cumulativeXP;
  }
  
  return thresholds;
}

export const LEVEL_REWARDS: Record<number, LevelRewards> = {
  1: {},
  2: { avatarDecoration: 'flower_1' },
  3: { multiplierBoost: 0.1 },
  4: { badgeUnlocked: 'week_warrior' },
  5: { avatarDecoration: 'tree_1' },
  7: { multiplierBoost: 0.2 },
  10: { badgeUnlocked: 'level_10' },
  // ... continues
  50: { badgeUnlocked: 'legendary_master', bonusXP: 1000 },
};

export const ACHIEVEMENT_TRIGGERS = {
  PERFECT_WEEK: { type: 'perfect_week', daysRequired: 7 },
  WEEK_WARRIOR: { type: 'week_warrior', weeksRequired: 4 },
  MONTH_MASTER: { type: 'month_master', daysRequired: 30 },
  STREAK_7: { type: 'streak_champion', streakRequired: 7 },
  STREAK_30: { type: 'streak_champion', streakRequired: 30 },
  LEVEL_10: { type: 'level_milestone', level: 10 },
  LEVEL_25: { type: 'level_milestone', level: 25 },
  LEVEL_50: { type: 'level_milestone', level: 50 },
};
```

### Avatar Growth Config

```typescript
// lib/avatar-growth-config.ts

export const AVATAR_GROWTH_STAGES: GrowthStageConfig[] = [
  {
    stage: 1,
    levelRange: [1, 5],
    model: '/3d-models/avatars/seedling.glb',
    scale: 1.0,
    decorations: [],
    animations: ['idle_small', 'pulse'],
  },
  {
    stage: 2,
    levelRange: [6, 15],
    model: '/3d-models/avatars/sprout.glb',
    scale: 1.2,
    decorations: ['butterfly', 'leaf_glow'],
    animations: ['idle_medium', 'sway', 'grow'],
  },
  {
    stage: 3,
    levelRange: [16, 30],
    model: '/3d-models/avatars/tree.glb',
    scale: 1.5,
    decorations: ['birds', 'fruit', 'flowers'],
    animations: ['idle_large', 'wind_sway'],
  },
  {
    stage: 4,
    levelRange: [31, 50],
    model: '/3d-models/avatars/ancient_tree.glb',
    scale: 1.8,
    decorations: ['castle', 'waterfall', 'magical_aura'],
    animations: ['idle_epic', 'pulse_magic'],
  },
];

export const ISLAND_THEMES = {
  default: {
    skyColor: '#87CEEB',
    groundColor: '#90EE90',
    waterColor: '#4A90E2',
    lightingIntensity: 0.8,
  },
  night: {
    skyColor: '#1a1a2e',
    groundColor: '#16213e',
    waterColor: '#0f3460',
    lightingIntensity: 0.4,
  },
  autumn: {
    skyColor: '#FFB347',
    groundColor: '#CD853F',
    waterColor: '#8B4513',
    lightingIntensity: 0.7,
  },
};

export const DECORATIONS = {
  flowers: [
    { model: '/3d-models/decorations/flower_1.glb', scale: 0.5 },
    { model: '/3d-models/decorations/flower_2.glb', scale: 0.6 },
    { model: '/3d-models/decorations/flower_3.glb', scale: 0.55 },
  ],
  butterflies: [
    { model: '/3d-models/decorations/butterfly_1.glb', scale: 0.3, animated: true },
    { model: '/3d-models/decorations/butterfly_2.glb', scale: 0.3, animated: true },
  ],
  structures: [
    { model: '/3d-models/decorations/bench.glb', scale: 1.0 },
    { model: '/3d-models/decorations/fountain.glb', scale: 1.2, animated: true },
    { model: '/3d-models/decorations/gazebo.glb', scale: 1.5 },
  ],
};
```

### Habit Categories Config

```typescript
// lib/habit-categories.ts

export const HABIT_CATEGORIES = {
  health: {
    icon: '🏥',
    color: '#EF4444',
    defaultXP: 15,
    description: 'Medical and wellness habits',
  },
  fitness: {
    icon: '💪',
    color: '#F97316',
    defaultXP: 20,
    description: 'Exercise and movement',
  },
  learning: {
    icon: '📚',
    color: '#3B82F6',
    defaultXP: 18,
    description: 'Education and skill development',
  },
  productivity: {
    icon: '⚡',
    color: '#8B5CF6',
    defaultXP: 12,
    description: 'Work and productivity',
  },
  mindfulness: {
    icon: '🧘',
    color: '#EC4899',
    defaultXP: 10,
    description: 'Mental wellness and relaxation',
  },
  other: {
    icon: '📌',
    color: '#6B7280',
    defaultXP: 10,
    description: 'Other habits',
  },
};
```

---

## Validation Schemas (using Zod)

```typescript
// lib/validation.ts

import { z } from 'zod';

export const HabitCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['health', 'fitness', 'learning', 'productivity', 'mindfulness', 'other']),
  icon: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  frequency: z.object({
    type: z.enum(['daily', 'weekly', 'custom']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    timesPerWeek: z.number().optional(),
  }),
  target: z.object({
    value: z.number().positive(),
    unit: z.string(),
    type: z.enum(['count', 'duration', 'yes_no']),
  }),
  xpReward: z.number().positive().optional(),
});

export const HabitLogSchema = z.object({
  habitId: z.string(),
  value: z.number().positive(),
  notes: z.string().optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad']).optional(),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional(),
});

export const UserRegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

export type HabitCreate = z.infer<typeof HabitCreateSchema>;
export type HabitLog = z.infer<typeof HabitLogSchema>;
export type UserRegister = z.infer<typeof UserRegisterSchema>;
```

---

## API Request/Response Types

```typescript
// types/api.ts

// POST /api/habits
export interface CreateHabitRequest extends HabitCreate {}
export interface CreateHabitResponse {
  success: boolean;
  habit: Habit;
}

// POST /api/habits/[id]/complete
export interface CompleteHabitRequest {
  value: number;
  notes?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  mood?: 'great' | 'good' | 'okay' | 'bad';
}

export interface CompleteHabitResponse {
  success: boolean;
  xpEarned: number;
  streakUpdated: boolean;
  levelUp?: LevelUpEvent;
  multiplierActive: number;
  newUserStats: UserStats;
}

// POST /api/ai-coach/generate-plan
export interface GeneratePlanRequest {
  userId: string;
  forceGenerate?: boolean;
}

export interface GeneratePlanResponse {
  success: boolean;
  actionPlan: ActionPlan;
  analysis: WeeklyAnalysis;
}

// GET /api/gamification/stats
export interface GameStatsResponse {
  level: number;
  totalXP: number;
  currentXP: number;
  xpThreshold: number;
  multiplier: number;
  streakCurrent: number;
  streakRecord: number;
  achievements: Achievement[];
  avatar3D: Avatar3D;
}
```

This comprehensive types and configuration file provides type safety across your entire application while the configs make it easy to adjust game balance, XP rates, and visual progressions.
