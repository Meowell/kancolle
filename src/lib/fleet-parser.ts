import start2 from "@/data/START2.json";
import shipHpData from "@/data/shipHp.json";

/* ── Master data types ── */

type ShipMaster = {
  api_id: number;
  api_name: string;
  api_stype: number;
  api_taik?: number | [number, number];
  api_maxeq?: number[];
  api_slot_num?: number;
};

type EquipMaster = { api_id: number; api_name: string };

/* ── Lookup maps ── */

const shipNameMap = new Map<number, string>();
const shipHpMap = new Map<number, { hp: number; hp2: number; max_hp: number }>();
const shipSlotsMap = new Map<number, number[]>();
const shipSlotCountMap = new Map<number, number>();
const equipNameMap = new Map<number, string>();

// Build ship maps
for (const s of start2.api_mst_ship as ShipMaster[]) {
  shipNameMap.set(s.api_id, s.api_name || `ID:${s.api_id}`);
  if (s.api_maxeq && s.api_maxeq.length > 0) {
    shipSlotsMap.set(s.api_id, s.api_maxeq);
  }
  const slotNum = s.api_slot_num ?? (s.api_maxeq?.length ?? 4);
  shipSlotCountMap.set(s.api_id, slotNum);
}

export { equipNameMap, shipSlotCountMap };

// Build HP map from noro6 master HP data
for (const s of shipHpData as { id: number; hp: number; hp2: number; max_hp: number }[]) {
  shipHpMap.set(s.id, { hp: s.hp, hp2: s.hp2, max_hp: s.max_hp });
}

// Build equipment map
for (const e of start2.api_mst_slotitem as EquipMaster[]) {
  equipNameMap.set(e.api_id, e.api_name || `ID:${e.api_id}`);
}

/* ── Proficiency level display ── */

const PROFICIENCY_DISPLAY: Record<number, string> = {
  0: "",
  1: "|",
  2: "||",
  3: "|||",
  4: "/",
  5: "//",
  6: "///",
  7: ">>",
};

/* ── DeckBuilder raw types ── */

type DBItem = { id: number; rf?: number; mas?: number };
type DBShip = {
  id: number;
  lv: number;
  luck: number;
  items: Record<string, DBItem>;
};
type DBFleet = Record<string, DBShip>;

/* ── Parsed output types ── */

export type ParsedEquipment = {
  equipId: number;
  name: string;
  improvement?: number;
  proficiency?: string;
  isExpanded: boolean;
  slotCount?: number;
};

export type ParsedShip = {
  name: string;
  id: number;
  level: number;
  hp: number;
  maxHp: number;
  slotCount: number;
  equipment: ParsedEquipment[];
};

export type ParsedFleet = {
  ships: ParsedShip[];
};

/* ── Battle Result types ── */

type BRShip = {
  api_ship_id: number;
  api_lv: number;
  api_nowhp?: number;
  api_maxhp?: number;
  api_onslot?: number[];
  poi_slot?: (BRSlotItem | null)[];
  poi_slot_ex?: BRSlotItem | null;
};

type BRSlotItem = {
  api_slotitem_id: number;
  api_level?: number;
  api_alv?: number;
};

type BRFleet = {
  type?: number;
  main?: BRShip[];
};

/* ── Parser ── */

function parseBattleResult(json: Record<string, unknown>): ParsedFleet | null {
  const fleet = json.fleet as BRFleet | undefined;
  if (!fleet?.main || !Array.isArray(fleet.main)) return null;

  const ships: ParsedShip[] = [];
  for (const raw of fleet.main.slice(0, 6)) {
    if (!raw?.api_ship_id) continue;

    const shipName = shipNameMap.get(raw.api_ship_id) ?? `ID:${raw.api_ship_id}`;
    const hpData = shipHpMap.get(raw.api_ship_id);
    const maxHp = hpData?.max_hp ?? hpData?.hp ?? 99;
    const slotCount = shipSlotCountMap.get(raw.api_ship_id) ?? 4;
    const slotCaps = shipSlotsMap.get(raw.api_ship_id) ?? [];

    const equipment: ParsedEquipment[] = [];

    // Regular slots from poi_slot
    const poiSlots = raw.poi_slot || [];
    for (let si = 0; si < poiSlots.length; si++) {
      const item = poiSlots[si];
      const isExpanded = false; // poi_slot items are regular slots
      if (item && item.api_slotitem_id) {
        const eqName = equipNameMap.get(item.api_slotitem_id) ?? `装備ID:${item.api_slotitem_id}`;
        const improvement = (item.api_level && item.api_level > 0) ? item.api_level : undefined;
        const profRaw = item.api_alv ?? 0;
        const proficiency = PROFICIENCY_DISPLAY[profRaw] || "";

        equipment.push({
          equipId: item.api_slotitem_id,
          name: eqName,
          improvement,
          proficiency,
          isExpanded: false,
          slotCount: si < slotCaps.length ? slotCaps[si] : undefined,
        });
      }
    }

    // Expansion slot
    if (raw.poi_slot_ex && raw.poi_slot_ex.api_slotitem_id) {
      const ex = raw.poi_slot_ex;
      const eqName = equipNameMap.get(ex.api_slotitem_id) ?? `装備ID:${ex.api_slotitem_id}`;
      const improvement = (ex.api_level && ex.api_level > 0) ? ex.api_level : undefined;
      equipment.push({
        equipId: ex.api_slotitem_id,
        name: eqName,
        improvement,
        proficiency: "",
        isExpanded: true,
        slotCount: undefined,
      });
    }

    ships.push({
      name: shipName,
      id: raw.api_ship_id,
      level: raw.api_lv,
      hp: maxHp,
      maxHp,
      slotCount,
      equipment,
    });
  }

  return ships.length > 0 ? { ships } : null;
}

export function parseFleetData(text: string): ParsedFleet | null {
  try {
    const json = JSON.parse(text.trim());

    // Auto-detect format
    if (json.f1) {
      // DeckBuilder format
      return parseDeckBuilderJson(json);
    }
    if (json.fleet) {
      // Battle result format
      return parseBattleResult(json);
    }
    return null;
  } catch {
    return null;
  }
}

function parseDeckBuilderJson(json: Record<string, unknown>): ParsedFleet | null {
  const fleetData = json.f1 as DBFleet | undefined;
    if (!fleetData) return null;

    const ships: ParsedShip[] = [];

    // Iterate s1~s6
    for (let i = 1; i <= 6; i++) {
      const key = `s${i}`;
      const raw = fleetData[key] as DBShip | undefined;
      if (!raw) continue;

      const shipName = shipNameMap.get(raw.id) ?? `ID:${raw.id}`;
      const hpData = shipHpMap.get(raw.id);
      const maxHp = hpData?.max_hp ?? hpData?.hp ?? 99;
      const slots = shipSlotsMap.get(raw.id) ?? [];

      // Parse equipment
      const equipment: ParsedEquipment[] = [];
      const itemKeys = Object.keys(raw.items || {}).sort(); // i1, i2, ..., ix

      for (let eqIdx = 0; eqIdx < itemKeys.length; eqIdx++) {
        const k = itemKeys[eqIdx];
        const item = raw.items[k];
        if (!item || !item.id) continue;

        const isExpanded = k === "ix";
        const eqName = equipNameMap.get(item.id) ?? `装備ID:${item.id}`;
        const improvement = item.rf && item.rf > 0 ? item.rf : undefined;
        const profRaw = item.mas ?? 0;
        const proficiency = PROFICIENCY_DISPLAY[profRaw] || "";

        // Slot capacity: match regular slots (i1, i2...) with api_maxeq order,
        // expansion slot (ix) has no capacity
        let slotCount: number | undefined;
        if (!isExpanded) {
          // i1 -> slot index 0, i2 -> slot index 1, etc.
          const slotIdx = eqIdx - (itemKeys.includes("ix") && k > "ix" ? 1 : 0);
          // Actually just use eqIdx among non-expanded items
          const regularIndex = itemKeys.filter((ik) => ik !== "ix").indexOf(k);
          if (regularIndex >= 0 && regularIndex < slots.length) {
            slotCount = slots[regularIndex];
          }
        }

        equipment.push({
          equipId: item.id,
          name: eqName,
          improvement,
          proficiency,
          isExpanded,
          slotCount,
        });
      }

      ships.push({
        name: shipName,
        id: raw.id,
        level: raw.lv,
        hp: maxHp,
        maxHp,
        slotCount: shipSlotCountMap.get(raw.id) ?? 4,
        equipment,
      });
    }

    if (ships.length === 0) return null;
    return { ships };
}
