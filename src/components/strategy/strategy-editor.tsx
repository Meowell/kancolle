"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Post = { id: string; phaseName: string; title: string; content: string; fleetImageUrl: string | null; airbaseImageUrl: string | null };

export function StrategyEditor({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [f, setF] = useState({ phaseName: "", title: "", content: "", fleetImageUrl: "", airbaseImageUrl: "" });
  const [err, setErr] = useState("");

  async function upload(file: File, key: "fleetImageUrl" | "airbaseImageUrl") {
    const data = new FormData(); data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const p = await res.json();
    if (!res.ok) throw new Error(p.error ?? "上传失败");
    setF((c) => ({ ...c, [key]: p.imageUrl }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/strategy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "发布失败"); return; }
    setF({ phaseName: "", title: "", content: "", fleetImageUrl: "", airbaseImageUrl: "" });
    router.refresh();
  }
  async function del(id: string) { await fetch(`/api/strategy?id=${id}`, { method: "DELETE" }); router.refresh(); }

  const grouped = useMemo(() => {
    const g: Record<string, Post[]> = {};
    for (const p of posts) (g[p.phaseName] ??= []).push(p);
    return g;
  }, [posts]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Editor */}
      <div className="w-full lg:w-96 shrink-0 rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-6 shadow-lg shadow-black/10 h-fit lg:sticky lg:top-24">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📝</span>
            <h2 className="text-lg font-semibold text-white">发布攻略</h2>
          </div>
          <Input value={f.phaseName} onChange={(e) => setF({ ...f, phaseName: e.target.value })} placeholder="阶段 (E2-3)" required />
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="标题" required />
          <Textarea className="min-h-36" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="打法、路线、配装思路..." required />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">📸 本队截图</label>
            <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file, "fleetImageUrl").catch((er) => setErr(er.message)); }} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">🛩️ 陆航截图</label>
            <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file, "airbaseImageUrl").catch((er) => setErr(er.message)); }} />
          </div>
          {(f.fleetImageUrl || f.airbaseImageUrl) && <p className="text-xs text-emerald-400">✅ 已上传 {[f.fleetImageUrl, f.airbaseImageUrl].filter(Boolean).length} 张截图</p>}
          {err && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</div>}
          <Button type="submit" className="w-full">📢 发布攻略</Button>
        </form>
      </div>

      {/* Posts */}
      <div className="flex-1 min-w-0 space-y-6">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-800/40 py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">暂无攻略贴，发布第一条活动攻略吧</p>
          </div>
        ) : (
          Object.entries(grouped).map(([phase, phasePosts]) => (
            <div key={phase}>
              <div className="flex items-center gap-3 mb-3 sticky top-20 z-10 bg-slate-950/80 backdrop-blur-sm py-2 -mx-2 px-2">
                <span className="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold bg-blue-600 text-white">{phase}</span>
                <span className="text-xs text-slate-500">{phasePosts.length} 篇攻略</span>
              </div>
              <div className="space-y-4">
                {phasePosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-5 shadow-lg shadow-black/10 group hover:border-slate-600/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                      <button type="button" onClick={() => del(post.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-sm transition-all">🗑️</button>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300 leading-7">{post.content}</p>
                    {(post.fleetImageUrl || post.airbaseImageUrl) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {post.fleetImageUrl && (
                          <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                            <p className="px-3 py-1.5 text-xs text-slate-500 bg-slate-800/50 border-b border-slate-700/30">📸 本队</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.fleetImageUrl} alt="本队" className="w-full object-contain bg-slate-900" />
                          </div>
                        )}
                        {post.airbaseImageUrl && (
                          <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                            <p className="px-3 py-1.5 text-xs text-slate-500 bg-slate-800/50 border-b border-slate-700/30">🛩️ 陆航</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.airbaseImageUrl} alt="陆航" className="w-full object-contain bg-slate-900" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
