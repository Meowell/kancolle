import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await requireApiUser();

  const { avatarUrl } = (await request.json()) as { avatarUrl?: string | null };

  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "avatarUrl 必须是字符串" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: avatarUrl ?? null },
    select: { id: true, name: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated });
}
