import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center px-4 text-white">
      {/* Glow background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-800/20 blur-3xl" />
      </div>

      {/* Logo / Brand */}
      <div className="relative mb-6 flex items-center gap-3">
        <span className="text-4xl">🌱</span>
        <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
          HabitForge
        </span>
      </div>

      {/* Hero Headline */}
      <h1 className="relative text-center text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
        Build habits.{" "}
        <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
          Level up your life.
        </span>
      </h1>

      <p className="relative mt-6 text-center text-lg md:text-xl text-slate-400 max-w-xl">
        Track daily habits, earn XP, grow your island, and get AI-powered
        coaching — all in one beautifully gamified experience.
      </p>

      {/* Feature Pills */}
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        {[
          "🎮 Gamified XP System",
          "🤖 AI Weekly Coach",
          "🏝️ 3D Island Avatar",
          "🔥 Streak Multipliers",
        ].map((feature) => (
          <span
            key={feature}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-slate-300 backdrop-blur-sm"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="relative mt-10 flex flex-col sm:flex-row gap-4">
        <Link
          href="/register"
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-base shadow-lg shadow-purple-900/40 transition-all duration-200 text-center"
        >
          Get Started — it's free
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold text-base transition-all duration-200 text-center backdrop-blur-sm"
        >
          Sign In
        </Link>
      </div>

      {/* Footer Note */}
      <p className="relative mt-16 text-sm text-slate-600">
        No credit card required · Free forever on the starter plan
      </p>
    </main>
  );
}
