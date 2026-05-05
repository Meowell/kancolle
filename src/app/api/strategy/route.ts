import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { strategyPostSchema } from "@/lib/validators";

export async function GET() {
  await requireApiUser();

  const posts = await prisma.strategyPost.findMany({
    orderBy: [{ phaseName: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  await requireApiUser();
  const parsed = strategyPostSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "攻略贴字段不完整" }, { status: 400 });
  }

  const post = await prisma.strategyPost.create({
    data: {
      phaseName: parsed.data.phaseName,
      title: parsed.data.title,
      content: parsed.data.content,
      fleetImageUrl: parsed.data.fleetImageUrl || null,
      airbaseImageUrl: parsed.data.airbaseImageUrl || null,
    },
  });

  return NextResponse.json({ post });
}

export async function PATCH(request: Request) {
  await requireApiUser();
  const parsed = strategyPostSchema.safeParse(await request.json());

  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json({ error: "缺少攻略贴 ID" }, { status: 400 });
  }

  const post = await prisma.strategyPost.update({
    where: { id: parsed.data.id },
    data: {
      phaseName: parsed.data.phaseName,
      title: parsed.data.title,
      content: parsed.data.content,
      fleetImageUrl: parsed.data.fleetImageUrl || null,
      airbaseImageUrl: parsed.data.airbaseImageUrl || null,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(request: Request) {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "缺少攻略贴 ID" }, { status: 400 });
  }

  await prisma.strategyPost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
