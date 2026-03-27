# 🏝️ HabitForge 2.0

**HabitForge 2.0** is an immersive, AI-powered habit-tracking ecosystem that transforms personal growth into a gamified 3D adventure. Built with **Next.js 16**, **Three.js**, and **Google Gemini**, it goes beyond simple checklists by providing intelligent coaching and visual evolution.

---

## ✨ Core Features

### 🤖 AI Coach (Gemini 1.5 Pro)
The AI Coach analyzes your 7-day habit history to generate personalized JSON action plans.
* **Weekly Insights**: Automated performance assessments and trend analysis, identifying if habits are improving, stable, or declining.
* **Predictive Analytics**: Forecasts for next week’s XP, potential level progression, and streak stability.
* **Smart Adjustments**: Recommends schedule changes based on historical completion rates, such as moving a habit to a time with a higher success rate.

### 🎮 Deep Gamification
A robust RPG-style progression system designed to maintain long-term engagement.
* **XP Engine**: Dynamic calculations featuring streak multipliers (up to 2.0x), difficulty modifiers (0.8x - 1.5x), and consistency bonuses.
* **Leveling System**: Progression through 50+ levels, where each level requires 1.5x more XP than the previous one.
* **Streak & Multiplier**: A "Multiplier" system (1.0x - 3.0x) that rewards consecutive days of activity but resets upon missed habits.

### 🌳 3D Island Avatar
Your progress is physically manifested in a 3D environment that grows alongside you.
* **Evolutionary Stages**: Your avatar evolves from a **Seedling** (Levels 1-5) to an **Ancient Magical Tree** (Levels 31-50).
* **Dynamic Themes**: Customizable environments including Default (Sky Blue), Night (Moonlit), and Autumn (Orange/Brown).
* **Interactive Scene**: Built with React Three Fiber, featuring particle bursts and growth animations during level-ups.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui.
* **3D Graphics**: Three.js, React Three Fiber, Drei.
* **State Management**: Zustand (Client State), SWR (Data Fetching).
* **Backend**: Next.js API Routes, Node.js.
* **Database**: MongoDB Atlas with Mongoose ODM.
* **AI Integration**: Google Gemini API (Gemini 1.5 Pro).
* **Authentication**: NextAuth.js with bcrypt hashing.

---

## 📂 Project Structure

```text
habitforge-2.0/
├── apps/web/
│   ├── app/                # Next.js App Router (Pages & API Routes)
│   ├── components/         # UI, Habits, 3D Scene, & AI Coach components
│   ├── hooks/              # Custom React hooks (useHabits, useActionPlan, etc.)
│   ├── lib/                # Database, AI, & calculation utilities
│   ├── store/              # Zustand stores (Auth, Game, Avatar state)
│   └── types/              # TypeScript definitions
├── packages/
│   ├── shared/             # Constants & shared utility functions
│   └── database/           # Mongoose schemas and models
└── public/                 # 3D models (.glb) and static assets
