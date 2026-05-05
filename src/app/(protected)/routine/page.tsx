import { RoutineRecords } from "@/components/routine/routine-form";
import { RoutineFilter } from "@/components/routine/routine-filter";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; seaArea?: string; uploaderId?: string };
}) {
  const user = await requireCurrentUser();

  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const search = searchParams.search?.trim() || undefined;
  const seaArea = searchParams.seaArea || undefined;
  const uploaderId = searchParams.uploaderId || undefined;

  // Build dynamic where clause
  const conditions: Prisma.RoutineRecordWhereInput[] = [];
  if (search) {
    conditions.push({
      OR: [
        { seaArea: { contains: search } },
        { missionName: { contains: search } },
        { note: { contains: search } },
      ],
    });
  }
  if (seaArea) conditions.push({ seaArea });
  if (uploaderId) conditions.push({ userId: uploaderId });

  const where: Prisma.RoutineRecordWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  // Parallel: records + count + filter options
  const [totalCount, records, seaAreaGroups, uploaderGroups] = await Promise.all([
    prisma.routineRecord.count({ where }),
    prisma.routineRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.routineRecord.groupBy({ by: ["seaArea"], orderBy: { seaArea: "asc" } }),
    prisma.routineRecord.groupBy({ by: ["userId"], orderBy: { userId: "asc" } }),
  ]);

  // Resolve uploader names
  const userIds = uploaderGroups.map((g) => g.userId);
  const uploaders = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = currentPage > totalPages ? totalPages : currentPage;

  const serializableRecords = records.map((r) => ({
    id: r.id,
    seaArea: r.seaArea,
    missionName: r.missionName,
    airControl: r.airControl,
    note: r.note,
    imageUrl: r.imageUrl,
    fleetData: r.fleetData,
    createdAt: r.createdAt.toISOString(),
    user: { id: r.user.id, name: r.user.name },
  }));

  const seaAreas = seaAreaGroups.map((g) => g.seaArea);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 周回阵容记录</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            分享周回阵容并存档
          </p>
        </div>
        <RoutineFilter
          seaAreas={seaAreas}
          uploaders={uploaders}
          currentSearch={search ?? ""}
          currentSeaArea={seaArea ?? ""}
          currentUploaderId={uploaderId ?? ""}
        />
      </div>
      <RoutineRecords
        records={serializableRecords}
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        search={search ?? ""}
        seaArea={seaArea ?? ""}
        uploaderId={uploaderId ?? ""}
        shipData={user.shipData}
        currentUserId={user.id}
      />
    </div>
  );
}
