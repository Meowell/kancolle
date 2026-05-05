import { ShipDataCenter } from "@/components/ship-data/ship-data-center";
import { UpdateMastersButton } from "@/components/ship-data/update-masters-button";
import { requireCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">📊</span> 数据中心
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            上传 noro6 舰船存档，解锁大部分功能。
          </p>
        </div>
        <UpdateMastersButton />
      </div>

      <ShipDataCenter initialShipData={user.shipData ?? ""} currentUserName={user.name} />
    </div>
  );
}
