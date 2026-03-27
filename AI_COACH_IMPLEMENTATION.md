# AI Coach Implementation Guide

## Overview

The AI Coach analyzes a user's 7-day habit history and generates personalized JSON action plans using Google's Gemini API. It provides motivational nudges, schedule recommendations, and predictive insights.

---

## Gemini API Integration

### Setup

```typescript
// lib/gemini-ai.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export class AICoach {
  static async generateActionPlan(
    userData: UserAnalytics
  ): Promise<ActionPlan> {
    const prompt = this.buildPrompt(userData);
    
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const actionPlan = JSON.parse(jsonMatch[0]) as ActionPlan;
      return this.validateAndSanitize(actionPlan);
    } catch (error) {
      console.error('[AI Coach] Generation failed:', error);
      throw new Error('Failed to generate action plan');
    }
  }

  private static buildPrompt(userData: UserAnalytics): string {
    return `You are HabitForge AI Coach, an expert habit strategist and motivational mentor. 
Your role is to analyze user habit data and provide personalized, actionable insights.

CURRENT USER METRICS (Week of ${userData.weekStart}):
- Level: ${userData.level} | Total XP: ${userData.totalXP}
- Streak: ${userData.streakCurrent}/${userData.streakRecord} days
- Completion Rate: ${userData.completionRate}%
- Consistency Score: ${userData.consistencyScore}/100
- Total Habits: ${userData.totalHabits}

HABIT-BY-HABIT BREAKDOWN:
${userData.habits
  .map(
    (h) => `
  • ${h.name} (${h.category})
    - Status: ${h.completedDays}/7 days (${h.completionRate}%)
    - Current Streak: ${h.streakCurrent} days
    - Recent Trend: ${h.trend}
    - Notes: ${h.recentNotes || 'None'}
`
  )
  .join('\n')}

USER MOOD/DIFFICULTY PATTERNS:
${
  userData.moodData
    ? `
Mood Distribution:
- Great: ${userData.moodData.great}% | Good: ${userData.moodData.good}% 
- Okay: ${userData.moodData.okay}% | Bad: ${userData.moodData.bad}%

Difficulty Reported:
- Easy: ${userData.moodData.easyCount} | Normal: ${userData.moodData.normalCount} | Hard: ${userData.moodData.hardCount}
`
    : 'No mood data recorded'
}

ANALYSIS REQUIREMENTS:
1. Calculate performance trends for each habit (improving/stable/declining)
2. Identify patterns (time-based, day-based, consistency patterns)
3. Recognize achievements and areas for improvement
4. Generate 3-4 specific, actionable recommendations
5. Predict next week's XP and potential level progression
6. Create a motivational weekly challenge

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "motivationalMessage": "2-3 sentence personalized encouragement",
  "performanceSummary": "1-2 sentence overall performance assessment",
  "keyInsights": [
    {
      "habitName": "habit name",
      "performance": "excellent|good|needs_work",
      "completionRate": 85,
      "trend": "improving|stable|declining",
      "reason": "specific observation"
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
  "scheduleAdjustments": [
    {
      "habitName": "habit name",
      "currentTime": "14:00",
      "suggestedTime": "09:00",
      "reason": "better completion rate in morning"
    }
  ],
  "weeklyChallenge": {
    "name": "challenge name",
    "description": "clear description",
    "targetCompletion": 85,
    "reward": 50
  },
  "predictions": {
    "nextWeekXPProjection": 450,
    "potentialLevel": 5,
    "streakPrediction": "likely to: maintain|grow|reset",
    "nextLevelETA": "2-3 weeks"
  }
}

TONE GUIDELINES:
- Be encouraging and positive, even when performance is low
- Use specific data points to support recommendations
- Avoid generic advice - tailor to the user's habits and patterns
- Balance celebration of wins with constructive feedback
- Be realistic about challenges`;
  }

  private static validateAndSanitize(plan: ActionPlan): ActionPlan {
    // Validate required fields
    if (
      !plan.motivationalMessage ||
      !plan.recommendations ||
      !plan.weeklyChallenge
    ) {
      throw new Error('Invalid action plan structure');
    }

    // Ensure arrays exist
    plan.keyInsights = plan.keyInsights || [];
    plan.recommendations = plan.recommendations || [];
    plan.scheduleAdjustments = plan.scheduleAdjustments || [];

    // Cap values
    plan.weeklyChallenge.reward = Math.min(plan.weeklyChallenge.reward, 200);
    plan.predictions.nextWeekXPProjection = Math.min(
      plan.predictions.nextWeekXPProjection,
      2000
    );

    return plan;
  }
}
```

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

---

## API Route Implementation

### POST /api/ai-coach/generate-plan

```typescript
// app/api/ai-coach/generate-plan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AICoach } from '@/lib/gemini-ai';
import { User } from '@/models/User';
import { Habit } from '@/models/Habit';
import { HabitLog } from '@/models/HabitLog';
import { AILog } from '@/models/AILog';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Connect to database
    await connectDB();

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if plan already exists for this week
    const weekStart = getWeekStart(new Date());
    const existingPlan = await AILog.findOne({
      userId,
      weekStartDate: weekStart,
    });

    if (existingPlan && !req.nextUrl.searchParams.get('force')) {
      return NextResponse.json({
        success: true,
        actionPlan: existingPlan.actionPlan,
        analysis: existingPlan.analysis,
        cached: true,
      });
    }

    // Collect 7-day habit data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const habits = await Habit.find({
      userId,
      isActive: true,
    });

    const habitLogs = await HabitLog.find({
      userId,
      date: {
        $gte: sevenDaysAgo.toISOString().split('T')[0],
      },
    });

    // Build analysis object
    const userAnalytics = buildUserAnalytics(
      user,
      habits,
      habitLogs,
      weekStart
    );

    // Generate action plan with AI
    const actionPlan = await AICoach.generateActionPlan(userAnalytics);

    // Create analysis summary
    const analysis = createAnalysisSummary(userAnalytics, actionPlan);

    // Save to database
    const aiLog = new AILog({
      userId,
      weekStartDate: weekStart,
      weekEndDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      analysis,
      actionPlan,
      isRead: false,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await aiLog.save();

    // Send notification
    await sendCoachNotification(user, actionPlan);

    return NextResponse.json({
      success: true,
      actionPlan,
      analysis,
    });
  } catch (error) {
    console.error('[AI Coach] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate action plan' },
      { status: 500 }
    );
  }
}

function buildUserAnalytics(
  user: any,
  habits: any[],
  habitLogs: any[],
  weekStart: Date
): UserAnalytics {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dates = getDateRangeArray(weekStart, weekEnd);

  const habitsAnalysis = habits.map((habit) => {
    const logsForHabit = habitLogs.filter(
      (log) => log.habitId.toString() === habit._id.toString()
    );

    const completedDays = new Set(logsForHabit.map((log) => log.date)).size;
    const completionRate = Math.round((completedDays / 7) * 100);

    // Calculate trend
    const firstHalf = logsForHabit.filter((log) => {
      const logDate = new Date(log.date);
      return logDate < new Date(weekStart.getTime() + 3.5 * 24 * 60 * 60 * 1000);
    }).length;

    const secondHalf = logsForHabit.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= new Date(weekStart.getTime() + 3.5 * 24 * 60 * 60 * 1000);
    }).length;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondHalf > firstHalf * 1.2) trend = 'improving';
    if (secondHalf < firstHalf * 0.8) trend = 'declining';

    return {
      habitId: habit._id.toString(),
      name: habit.name,
      category: habit.category,
      completedDays,
      completionRate,
      streakCurrent: habit.streak.current,
      trend,
      recentNotes: logsForHabit
        .slice(-2)
        .map((log) => log.notes)
        .filter(Boolean)
        .join('; '),
    };
  });

  // Calculate mood distribution
  const moods = habitLogs
    .map((log) => log.mood)
    .filter(Boolean);
  const moodData = {
    great: (moods.filter((m) => m === 'great').length / moods.length) * 100 || 0,
    good: (moods.filter((m) => m === 'good').length / moods.length) * 100 || 0,
    okay: (moods.filter((m) => m === 'okay').length / moods.length) * 100 || 0,
    bad: (moods.filter((m) => m === 'bad').length / moods.length) * 100 || 0,
    easyCount: habitLogs.filter((log) => log.difficulty === 'easy').length,
    normalCount: habitLogs.filter((log) => log.difficulty === 'normal').length,
    hardCount: habitLogs.filter((log) => log.difficulty === 'hard').length,
  };

  const totalXP = habitLogs.reduce((sum, log) => sum + (log.xpEarned || 0), 0);
  const completionRate = Math.round(
    (habitLogs.length / (habits.length * 7)) * 100
  );
  const consistencyScore = calculateConsistencyScore(dates, habitLogs, habits.length);

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    level: user.stats.level,
    totalXP: user.stats.totalXP,
    streakCurrent: user.stats.streakCurrent,
    streakRecord: user.stats.streakRecord,
    completionRate,
    consistencyScore,
    totalHabits: habits.length,
    habits: habitsAnalysis,
    moodData,
    totalXP,
  };
}

function calculateConsistencyScore(
  dates: string[],
  habitLogs: any[],
  totalHabits: number
): number {
  let score = 0;

  for (const date of dates) {
    const logsForDate = habitLogs.filter((log) => log.date === date);
    const habitsCompletedToday = new Set(logsForDate.map((log) => log.habitId)).size;
    const dayScore = (habitsCompletedToday / totalHabits) * 100;
    score += dayScore;
  }

  return Math.round(score / dates.length);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getDateRangeArray(start: Date, end: Date): string[] {
  const dates: string[] = [];
  let current = new Date(start);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function createAnalysisSummary(
  analytics: UserAnalytics,
  actionPlan: ActionPlan
): WeeklyAnalysis {
  const bestDay = '2024-03-17'; // Would calculate from data
  const worstDay = '2024-03-19';

  return {
    completionRate: analytics.completionRate,
    bestDay,
    worstDay,
    totalXPEarned: analytics.totalXP,
    habitsTracked: analytics.totalHabits,
    consistencyScore: analytics.consistencyScore,
    insights: actionPlan.keyInsights,
  };
}

async function sendCoachNotification(user: any, actionPlan: ActionPlan) {
  // Email notification, in-app badge, etc.
  console.log('[Coach] Sending notification to', user.email);
  // Implementation would integrate with your notification service
}
```

---

## Frontend Integration

### Hook: useActionPlan

```typescript
// hooks/useActionPlan.ts

import useSWR, { mutate } from 'swr';
import { ActionPlan, AILog } from '@/types';

export function useActionPlan() {
  const { data: currentPlan, isLoading, error, mutate: refresh } = useSWR<{
    actionPlan: ActionPlan;
    analysis: any;
  }>('/api/ai-coach/current-plan', fetch);

  const generatePlan = async (force = false) => {
    try {
      const response = await fetch(
        `/api/ai-coach/generate-plan${force ? '?force=true' : ''}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      refresh();
      return data;
    } catch (error) {
      console.error('Error generating plan:', error);
      throw error;
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/ai-coach/mark-read', { method: 'POST' });
      refresh();
    } catch (error) {
      console.error('Error marking plan as read:', error);
    }
  };

  return {
    plan: currentPlan?.actionPlan,
    analysis: currentPlan?.analysis,
    isLoading,
    error,
    generatePlan,
    markAsRead,
    refresh,
  };
}
```

### Component: ActionPlanCard

```typescript
// components/ai-coach/ActionPlanCard.tsx

'use client';

import { ActionPlan } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RecommendationItem from './RecommendationItem';
import WeeklyChallenge from './WeeklyChallenge';
import CoachMessage from './CoachMessage';

interface ActionPlanCardProps {
  plan: ActionPlan;
  onRefresh?: () => void;
}

export default function ActionPlanCard({ plan, onRefresh }: ActionPlanCardProps) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Action Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No action plan yet. Check back next week or generate one now.
          </p>
          <Button onClick={onRefresh} className="mt-4">
            Generate Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Motivational Message */}
      <CoachMessage message={plan.motivationalMessage} />

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Week Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {plan.performanceSummary}
          </p>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {plan.keyInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.keyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg bg-muted p-3"
              >
                <div className="flex-1">
                  <p className="font-semibold">{insight.habitName}</p>
                  <p className="text-sm text-muted-foreground">{insight.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-medium
                      ${
                        insight.performance === 'excellent'
                          ? 'bg-green-100 text-green-800'
                          : insight.performance === 'good'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }
                    `}>
                      {insight.performance}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {insight.completionRate}% completion
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {plan.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.recommendations.map((rec, idx) => (
              <RecommendationItem key={idx} recommendation={rec} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly Challenge */}
      <WeeklyChallenge challenge={plan.weeklyChallenge} />

      {/* Predictions */}
      {plan.predictions && (
        <Card>
          <CardHeader>
            <CardTitle>Next Week Forecast</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">XP Projection</p>
              <p className="text-2xl font-bold">
                {plan.predictions.nextWeekXPProjection}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Level</p>
              <p className="text-2xl font-bold">
                {plan.predictions.potentialLevel}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium">Streak</p>
              <p className="text-sm text-muted-foreground">
                Likely to {plan.predictions.streakPrediction}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## Scheduled Generation

### Cron Job with Vercel Functions

```typescript
// app/api/cron/generate-weekly-plans/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/vercel-webhook';

export async function POST(req: NextRequest) {
  // Verify Vercel webhook signature
  const isValid = verifyWebhook(req);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await getAllUsersWithTimezone();

    for (const user of users) {
      // Check if it's 9 PM in user's timezone
      if (isCoachGenerationTime(user.timezone)) {
        await fetch(
          `${process.env.NEXTAUTH_URL}/api/ai-coach/generate-plan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
            },
            body: JSON.stringify({ userId: user._id }),
          }
        );
      }
    }

    return NextResponse.json({ success: true, processed: users.length });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plans' },
      { status: 500 }
    );
  }
}

function isCoachGenerationTime(timezone: string): boolean {
  const now = new Date();
  const userTime = new Date(
    now.toLocaleString('en-US', { timeZone: timezone })
  );

  return (
    userTime.getDay() === 0 && // Sunday
    userTime.getHours() === 21 // 9 PM
  );
}
```

---

## Best Practices

1. **Cache Plans**: Store plans for 7 days to avoid regenerating
2. **Error Handling**: Fallback to generic encouragement if API fails
3. **Rate Limiting**: Max 1 generation per user per day
4. **Token Optimization**: Keep prompts under 1000 tokens
5. **Response Validation**: Always validate JSON structure
6. **Privacy**: Never log full habit details externally

