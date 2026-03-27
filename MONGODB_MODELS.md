# MongoDB Models & Quick Start Setup

## MongoDB Connection

```typescript
// lib/mongodb.ts

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in environment variables');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    console.log('[DB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('[DB] Connected to MongoDB');
        return mongoose;
      })
      .catch((err) => {
        console.error('[DB] Connection failed:', err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

---

## Schema Definitions

### User Schema

```typescript
// models/User.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatar?: {
    url: string;
    uploadedAt: Date;
  };
  stats: {
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
  };
  avatar3D: {
    type: string;
    growthStage: number;
    customizations: Array<{
      type: string;
      value: string;
    }>;
    lastUpdated: Date;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
      reminders: boolean;
      reminderTimes: string[];
    };
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: String,
    avatar: {
      url: String,
      uploadedAt: Date,
    },
    stats: {
      level: { type: Number, default: 1 },
      totalXP: { type: Number, default: 0 },
      currentXP: { type: Number, default: 0 },
      xpThreshold: { type: Number, default: 100 },
      streakCurrent: { type: Number, default: 0 },
      streakRecord: { type: Number, default: 0 },
      totalHabitsCompleted: { type: Number, default: 0 },
      consecutiveDays: { type: Number, default: 0 },
      multiplier: { type: Number, default: 1.0, min: 1.0, max: 3.0 },
      multiplierExpiresAt: Date,
    },
    avatar3D: {
      type: { type: String, default: 'island' },
      growthStage: { type: Number, default: 1 },
      customizations: [
        {
          type: String,
          value: String,
        },
      ],
      lastUpdated: { type: Date, default: Date.now },
    },
    preferences: {
      theme: { type: String, default: 'dark' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
        reminderTimes: {
          type: [String],
          default: ['09:00', '14:00', '21:00'],
        },
      },
      timezone: { type: String, default: 'UTC' },
    },
    lastActiveAt: Date,
  },
  { timestamps: true }
);

// Index for performance
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.level': -1 });

export default mongoose.models.User ||
  mongoose.model<IUser>('User', userSchema);
```

### Habit Schema

```typescript
// models/Habit.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    timesPerWeek?: number;
    customDays?: string[];
  };
  target: {
    value: number;
    unit: string;
    type: 'count' | 'duration' | 'yes_no';
  };
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

const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['health', 'fitness', 'learning', 'productivity', 'mindfulness', 'other'],
      default: 'other',
    },
    icon: String,
    color: String,
    frequency: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily',
      },
      daysOfWeek: [Number],
      timesPerWeek: Number,
      customDays: [String],
    },
    target: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
      type: {
        type: String,
        enum: ['count', 'duration', 'yes_no'],
        default: 'count',
      },
    },
    xpReward: { type: Number, default: 10 },
    streakBonus: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true, index: true },
    isArchived: { type: Boolean, default: false },
    streak: {
      current: { type: Number, default: 0 },
      record: { type: Number, default: 0 },
      lastCompletedDate: Date,
    },
    archivedAt: Date,
  },
  { timestamps: true }
);

// Indexes
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Habit ||
  mongoose.model<IHabit>('Habit', habitSchema);
```

### HabitLog Schema

```typescript
// models/HabitLog.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IHabitLog extends Document {
  habitId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  completedAt: Date;
  date: string;
  value: number;
  isCompleted: boolean;
  notes?: string;
  xpEarned: number;
  multiplierApplied: number;
  mood?: 'great' | 'good' | 'okay' | 'bad';
  difficulty?: 'easy' | 'normal' | 'hard';
  createdAt: Date;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: String,
    xpEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    multiplierApplied: {
      type: Number,
      default: 1.0,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'normal', 'hard'],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index for efficient queries
habitLogSchema.index({ userId: 1, date: -1 });
habitLogSchema.index({ habitId: 1, date: -1 });

export default mongoose.models.HabitLog ||
  mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
```

### AILog Schema

```typescript
// models/AILog.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IAILog extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  weekEndDate: Date;
  analysis: {
    completionRate: number;
    bestDay: string;
    worstDay: string;
    totalXPEarned: number;
    habitsTracked: number;
    consistencyScore: number;
    insights: Array<{
      habitId: string;
      habitName: string;
      performance: 'excellent' | 'good' | 'needs_work';
      completionRate: number;
      trend: 'improving' | 'stable' | 'declining';
      reason: string;
    }>;
  };
  actionPlan: {
    motivationalMessage: string;
    performanceSummary: string;
    keyInsights: any[];
    recommendations: any[];
    scheduleAdjustments?: any[];
    weeklyChallenge: {
      name: string;
      description: string;
      targetCompletion: number;
      reward: number;
    };
    predictions: {
      nextWeekXPProjection: number;
      potentialLevel: number;
      streakPrediction: string;
      nextLevelETA: string;
    };
  };
  isRead: boolean;
  generatedAt: Date;
  expiresAt: Date;
}

const aiLogSchema = new Schema<IAILog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    analysis: {
      completionRate: Number,
      bestDay: String,
      worstDay: String,
      totalXPEarned: Number,
      habitsTracked: Number,
      consistencyScore: Number,
      insights: [
        {
          habitId: String,
          habitName: String,
          performance: String,
          completionRate: Number,
          trend: String,
          reason: String,
        },
      ],
    },
    actionPlan: {
      motivationalMessage: String,
      performanceSummary: String,
      keyInsights: [Schema.Types.Mixed],
      recommendations: [Schema.Types.Mixed],
      scheduleAdjustments: [Schema.Types.Mixed],
      weeklyChallenge: {
        name: String,
        description: String,
        targetCompletion: Number,
        reward: Number,
      },
      predictions: {
        nextWeekXPProjection: Number,
        potentialLevel: Number,
        streakPrediction: String,
        nextLevelETA: String,
      },
    },
    isRead: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

// TTL index to auto-delete after 30 days
aiLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AILog ||
  mongoose.model<IAILog>('AILog', aiLogSchema);
```

---

## Environment Variables

```bash
# .env.local

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/habitforge?retryWrites=true&w=majority

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# AI/Gemini
GEMINI_API_KEY=your-gemini-api-key

# (Optional) File uploads
NEXT_PUBLIC_UPLOAD_URL=http://localhost:3000/api/upload

# (Optional) Email service
SENDGRID_API_KEY=your-sendgrid-key
SMTP_FROM=noreply@habitforge.app

# (Optional) Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## Quick Start: Step-by-Step Implementation

### Phase 1: Database & Auth Setup (Day 1)

#### 1. Create `.env.local`
```bash
MONGODB_URI=mongodb://localhost:27017/habitforge
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GEMINI_API_KEY=your-key-here
```

#### 2. Install Dependencies
```bash
npm install mongoose next-auth bcrypt zod zustand swr
npm install -D typescript @types/node @types/react
```

#### 3. Initialize MongoDB Connection
- Set up local MongoDB or MongoDB Atlas cluster
- Copy connection string to `.env.local`

#### 4. Create Auth Flow
```typescript
// app/(auth)/register/page.tsx
// app/(auth)/login/page.tsx
// lib/auth.ts - NextAuth config
```

### Phase 2: Core Features (Days 2-3)

#### 1. Create Habit Management
- POST /api/habits (create)
- GET /api/habits (list)
- PUT /api/habits/[id] (update)
- DELETE /api/habits/[id] (delete)

#### 2. Implement Habit Tracking
- POST /api/habits/[id]/complete
- GET /api/logs?date=YYYY-MM-DD
- XP calculation engine

#### 3. Build Dashboard
- Display user stats
- Show habit list with today's progress
- Quick habit completion

### Phase 3: Gamification (Days 4-5)

#### 1. XP System
- Implement XP calculation
- Level-up detection
- Notification triggers

#### 2. Streaks & Multipliers
- Daily streak tracking
- Multiplier logic based on streak
- Multiplier decay on missed days

#### 3. Zustand Store
```typescript
// store/useGameStore.ts
// store/useHabitStore.ts
```

### Phase 4: AI Coach (Days 6-7)

#### 1. Gemini Integration
- Set up API key
- Implement prompt builder
- Response parsing

#### 2. Weekly Analysis
- Collect 7-day data
- Generate action plan
- Save to database

#### 3. UI Components
- Display action plan
- Show recommendations
- Weekly challenge

### Phase 5: 3D Avatar (Days 8-9)

#### 1. Three.js Setup
- Install @react-three/fiber
- Create base island scene
- Add lighting and camera

#### 2. Avatar Models
- Load growth stage models
- Implement level-based scaling
- Add animations

#### 3. Customization
- Decoration system
- Theme selection
- Level-up animations

---

## Database Indexes & Performance Tips

```typescript
// Create indexes for common queries
const indexes = {
  users: [
    { email: 1 },
    { username: 1 },
    { createdAt: -1 },
    { 'stats.level': -1 }
  ],
  habits: [
    { userId: 1, isActive: 1 },
    { userId: 1, createdAt: -1 },
    { category: 1 }
  ],
  habitLogs: [
    { userId: 1, date: -1 },
    { habitId: 1, date: -1 },
    { userId: 1, habitId: 1, date: -1 }
  ],
  aiLogs: [
    { userId: 1, weekStartDate: -1 },
    { expiresAt: 1 } // TTL index
  ]
};

// Query optimization tips:
// 1. Always filter by userId first
// 2. Use compound indexes for multi-field queries
// 3. Paginate large result sets
// 4. Use aggregation for complex analytics
// 5. Cache frequently accessed data in Zustand
```

---

## Migration Script Example

```typescript
// scripts/setup-db.ts

import mongoose from 'mongoose';
import User from '@/models/User';
import Habit from '@/models/Habit';

async function setupDatabase() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  console.log('Creating indexes...');
  
  await User.collection.createIndex({ email: 1 });
  await User.collection.createIndex({ createdAt: -1 });
  
  await Habit.collection.createIndex({ userId: 1, isActive: 1 });
  await Habit.collection.createIndex({ userId: 1, createdAt: -1 });
  
  console.log('✅ Database setup complete');
  
  await mongoose.connection.close();
}

setupDatabase().catch(console.error);
```

Run with: `npx ts-node scripts/setup-db.ts`

