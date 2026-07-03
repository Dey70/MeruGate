import Link from "next/link";
import { CheckCircle2, Flame, Users2, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Syllabus Planner",
    description: "The full GATE CSE syllabus broken into a monthly, weekly checklist.",
  },
  {
    icon: Flame,
    title: "Daily Streaks",
    description: "Stay consistent with streak tracking that keeps you honest.",
  },
  {
    icon: Users2,
    title: "Squad Accountability",
    description: "See your squad's progress and streaks. No public leaderboard, just your crew.",
  },
  {
    icon: Sparkles,
    title: "AI Doubt-Solving",
    description: "Ask Claude GATE CSE doubts or trigger a quick quiz, right from your topic.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-3xl text-center">
        <span className="glass-surface shadow-glass-sm mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-brand" />
          Built for GATE CSE, with your squad
        </span>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          Study for GATE.
          <br />
          <span className="text-gradient-accent">Stay accountable, together.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          MeeruGate turns the GATE CSE syllabus into a trackable plan, keeps your streak alive,
          and lets your squad see your progress — no noise, no public leaderboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild variant="accent" size="lg" className="h-11 px-6 text-base">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature, index) => (
          <GlassCard
            key={feature.title}
            interactive
            style={{ animationDelay: `${150 + index * 80}ms` }}
          >
            <feature.icon className="size-6 text-brand" />
            <h3 className="mt-3 font-semibold">{feature.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
