import { StrategyEditor } from "@/components/strategy/strategy-editor";
import { prisma } from "@/lib/prisma";

export default async function StrategyPage() {
  const posts = await prisma.strategyPost.findMany({
    orderBy: [{ phaseName: "asc" }, { createdAt: "desc" }],
  });
  const serializablePosts = posts.map((post) => ({
    id: post.id,
    phaseName: post.phaseName,
    title: post.title,
    content: post.content,
    fleetImageUrl: post.fleetImageUrl,
    airbaseImageUrl: post.airbaseImageUrl,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📝 活动攻略贴</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          全员共享的阶段攻略 — 打法、路线、配装思路与截图。
        </p>
      </div>
      <StrategyEditor posts={serializablePosts} />
    </div>
  );
}
