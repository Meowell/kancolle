import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireApiUser();

  const users = await prisma.user.findMany({
    where: { shipData: { not: "" } },
    select: { id: true, name: true },
  });

  return NextResponse.json(users);
}
