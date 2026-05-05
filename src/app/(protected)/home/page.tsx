import { Card } from "@/components/ui/card";
import { AvatarEditor } from "@/components/common/avatar-editor";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import Link from "next/link";

const statsConfig = [
  { key: "routineCount" as const, label: "周回记录", icon: "📋", border: "border-l-blue-500", href: "/routine" },
  { key: "lockPlanCount" as const, label: "锁船标签", icon: "🔒", border: "border-l-purple-500", href: "/lock-plan" },
  { key: "strategyCount" as const, label: "全局攻略", icon: "📝", border: "border-l-emerald-500", href: "/strategy" },
];

export default async function HomePage() {
  const user = await requireCurrentUser();
  const [routineCount, lockPlanCount, strategyCount] = await Promise.all([
    prisma.routineRecord.count({ where: { userId: user.id } }),
    prisma.lockPlan.count({ where: { userId: user.id } }),
    prisma.strategyPost.count(),
  ]);
  const counts = { routineCount, lockPlanCount, strategyCount };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">⚓</span> KanColle Hub
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          只给几个人用的一站式工具吧大概
        </p>
      </div>

      <AvatarEditor initialAvatarUrl={user.avatarUrl} userName={user.name} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsConfig.map((stat) => (
          <Link key={stat.key} href={stat.href}>
            <div
              className={`rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-5 hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-black/10 border-l-4 ${stat.border} cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="mt-3 text-3xl font-bold text-white tabular-nums">
                {counts[stat.key]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
