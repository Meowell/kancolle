# noro6 (kc-web) 锁船/海域分配模块 · 深度逆向分析报告

> 基于 kc-web v2.52.1 源码逆向  
> 目标技术栈：Next.js App Router + Tailwind CSS + shadcn/ui

---

## 1. 核心布局拆解 (Layout Architecture)

### 1.1 当前 noro6 的布局体系

noro6 的锁船面板不是一个独立页面，而是嵌入在 **Fleet Manager（艦隊管理）** 主界面中的。整体结构如下：

```
┌─────────────────────────────────────────────────┐
│  舰队 Tab 栏 (Fleet Tabs)                        │
│  [第1艦隊] [第2艦隊] [第3艦隊] [第4艦隊] [+追加]  │
├─────────────────────────────────────────────────┤
│  舰队控制栏: 司令部Lv | 阵形 | 舰队形式 | 一括編成 │
│  操作按钮: [札更新] [重置] [剪贴板] [2列/3列]     │
├─────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐         │
│  │ Ship Card 1    │  │ Ship Card 2    │         │
│  │ [Banner][Tag]  │  │ [Banner][Tag]  │         │
│  │ Lv 159 運 42   │  │ Lv 95  運 38   │         │
│  │ 時雨改三       │  │ 霞改二         │         │
│  │ ─────────────  │  │ ─────────────  │         │
│  │ 装備1 × 装備2  │  │ 装備1 × 装備2  │         │
│  └────────────────┘  └────────────────┘         │
│  ┌────────────────┐  ┌────────────────┐         │
│  │ [+ 艦娘を追加] │  │ Ship Card 3    │         │
│  └────────────────┘  └────────────────┘         │
├─────────────────────────────────────────────────┤
│  Area Tag 批次更新对话框 (弹出式 Modal)            │
│  [札1] [札2] [札3] ... [札なし]                   │
│  ☐ 已有札的舰娘也覆盖  [更新] [返回]               │
└─────────────────────────────────────────────────┘
```

**关键布局特征：**

| 特征 | noro6 实现 | 建议的 Next.js 方案 |
|---|---|---|
| 舰船池 (Ship Pool) | **弹出式 Dialog** 覆盖在舰队上方，非侧边栏 | 推荐沿用 Dialog/Sheet，符合 shadcn/ui 习惯 |
| 海域面板 (Tag Board) | 舰队 Tab 本身就是海域面板，通过 **札（Area Tag）** 绑定海域 | 改为独立的海域看板 + 舰队 Tab 混合模式 |
| 舰船卡片 | 网格排列，每行 2~3 张 (响应式 1→2→3 列) | 仿照，响应式 grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |
| 对话框宽度 | 响应式：桌面 760px~1020px，移动端全屏 | shadcn Dialog + Drawer 组合 |

### 1.2 推荐的 Next.js 布局方案

```
┌─────────────────────────────────────────────────────┐
│ [导航] Lock Plan (锁船规划)                          │
├─────────────────────────────────────────────────────┤
│ 左侧面板 (w-80 / lg:w-96)       │ 主区域 (flex-1)     │
│ ─────────────────────────      │ ─────────────────  │
│ 搜索框 + 舰种过滤器             │ 海域 Tag 页签栏      │
│ [ALL] [DD] [CL] [CA] [BB] ...  │ [E1] [E2] [E3] ... │
│ ─────────────────────────      │ ─────────────────  │
│ 标签过滤切换按钮                  │ 对应海域的舰队面板    │
│ [全部] [已分配] [未分配]          │ ┌────┐ ┌────┐     │
│ ─────────────────────────      │ │船  │ │船  │     │
│ 舰船列表 (可滚动)                │ │卡  │ │卡  │     │
│ ┌─ [Banner] Lv99 時雨改三 ──┐  │ └────┘ └────┘     │
│ │   札E1                     │  │ ┌────┐ ┌────┐     │
│ ├─ [Banner] Lv95 霞改二 ────┤  │ │+   │ │船  │     │
│ │   未分配                    │  │ │添加│ │卡  │     │
│ ├─ [Banner] Lv36 白露改 ────┤  │ └────┘ └────┘     │
│ └────────────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**核心原则：**

1. **左舰船池 + 右海域看板** 的经典双栏布局
2. 左侧固定宽度 `w-80`（320px）到 `lg:w-96`（384px），右侧自适应
3. 左侧上方搜索过滤，下方滚动列表
4. 右侧以 Tag 页签切换海域，每个海域内是网格卡片布局
5. 不使用原生拖拽，采用 **点击选中 + 点击海域槽位** 的交互

---

## 2. 交互逻辑重构建议 (Interaction Strategy)

### 2.1 noro6 现状分析

noro6 使用了**两种交互模式**：

| 交互方式 | 用途 | 源码位置 |
|---|---|---|
| **原生 HTML5 Drag & Drop** | 舰队内/舰队间交换舰船位置 | `ShipInput.vue` 的 `@dragstart` / `@drop` / `@dragover` |
| **点击 + 弹出式列表** | 在空槽位点击 `+`，弹出 `ShipList.vue` 对话框选择舰船 | `Fleet.vue` 的 `showShipList()` 方法 |

**值得注意的细节：**

- 点击空槽位的 `+` → 弹出 ShipList 对话框 → 点击一艘船 → 通过 callback `putShip()` 填入
- 当点击一艘**已分配**的船时，弹出确认框「已配備されています。配備を押せば無視して配備できます。」
- 拖拽主要用于**调整编队内位置**和**舰队间移动**
- 舰船在列表中被选中后，标题栏会出现「選択済」过滤器

### 2.2 推荐的交互方案：点击指派 (Click-to-Assign)

**为什么不建议纯 Drag & Drop？**
- 触摸设备兼容性差
- 实现复杂（拖拽预览、放置区检测、滚动同步）
- 用户学习成本高
- 与 shadcn/ui 生态不太融合

**推荐方案：两步点击 + 槽位高亮**

```
步骤1: 在左侧舰船池点击一艘船 → 船进入"待选"状态（蓝色边框高亮）
步骤2: 在右侧海域中点击一个空槽位 → 船被分配到该位置

变体方案（更快捷）：
- 双击舰船池中的船 → 自动分配到当前海域的第一个空槽
- 右键已分配的船 → 弹出菜单：[卸下] [移动到E2] [查看详情]
```

**具体交互细节（来自 noro6 的启示）：**

```typescript
// 状态管理
interface InteractionState {
  // 当前选中的舰船 (左侧池子中高亮的)
  selectedShip: ShipStock | null;
  // 当前激活的海域 Tab
  activeArea: number;
  // 舰队数据: areaIndex → fleet ship slots
  fleets: Record<number, (ShipStock | null)[]>;
}
```

**确认/防呆弹窗：**

当用户点击一艘**已经被分配**的船时（无论是在左侧池子还是右侧面板）：

```
┌──────────────────────────────┐
│  ⚠️ 该舰船已被分配至 E1     │
│                              │
│  确认将此船重新分配到 E3 吗？  │
│  [确定分配]  [取消]           │
└──────────────────────────────┘
```

这块逻辑直接参考 `ShipList.vue` 中的 `confirmDialog`：

```vue
<v-dialog v-model="confirmDialog">
  <div>{{ $t("Common.既に配備されています。") }}</div>
  <div>※ {{ $t("Common.配備を押せば無視して配備できます。") }}</div>
  <v-btn @click="clickedShip(confirmShip)">{{ $t("Common.配備") }}</v-btn>
  <v-btn @click="confirmDialog = false">{{ $t("Common.戻る") }}</v-btn>
</v-dialog>
```

### 2.3 交互流程总结

```
┌──────────┐   点击选中    ┌───────────┐   点击槽位    ┌─────────┐
│ 舰船池   │ ─────────→  │ 蓝色高亮  │ ─────────→  │  舰船   │
│ (可滚动) │  (再次点击   │ (selected)│              │  放置   │
│          │   取消选中)   │           │              │  到槽位  │
└──────────┘              └───────────┘              └─────────┘
                                │
                                │ 如已分配到其他海域
                                ▼
                          ┌──────────────┐
                          │ 确认覆盖对话框 │
                          │ [确定] [取消] │
                          └──────────────┘
```

---

## 3. 关键组件与 Tailwind 样式仿写 (Component & CSS Blueprint)

### 3.1 `ShipCard` — 舰船卡片

#### 功能边界

- 展示舰船头像 Banner + 等级 + 名称 + 基本属性
- 显示 Area Tag 覆盖层（已分配时）
- 点击选中/取消选中
- 右键上下文菜单（卸下、移动）
- 被分配后左侧池子中显示 Tag 标记/置灰

#### 数据 Props

```typescript
interface ShipCardProps {
  // 核心数据
  ship: ShipStock;       // 船舶在库数据 (含 id, lv, area, uniqueId 等)
  master: ShipMaster;    // 船舶主数据 (含 api_name, api_stype 等)
  
  // 交互状态
  isSelected: boolean;   // 当前是否被选中
  isAssigned: boolean;   // 是否已被分配至某海域
  assignedArea: number;  // 被分配到的海域编号 (0=未分配)
  
  // 回调
  onSelect: (shipId: string) => void;  // 点击卡片
  onContextMenu?: (action: string) => void;
  
  // 显示模式
  compact?: boolean;     // 紧凑模式 (左侧列表)
}
```

#### 视觉结构与 Tailwind 实现

**原始 noro6 结构 (ShipList.vue):**

```html
<!-- 左侧舰船池中的条目 -->
<div class="ship-list" :class="{ 'no-stock': !data.count }">
  <div class="ship-img">
    <v-img :src="`./img/ship/banner/${data.ship.id}.png`" height="30" width="120" />
    <!-- 札覆盖层 -->
    <div class="area-banner" v-if="data.area > 0">
      <v-img :src="`./img/tags/area${data.area}.webp`" height="40" width="29" />
    </div>
  </div>
  <div>
    <div>Lv {{ data.level }}</div>
    <div class="ship-name text-truncate">{{ getShipName(data.ship) }}</div>
  </div>
</div>
```

**原始 noro6 结构 (ShipInput.vue — 舰队面板中的完整卡片):**

```html
<v-card class="ma-1 ship-input">
  <div class="d-flex px-2">
    <div class="ship-img-container">
      <v-img :src="`./img/ship/banner/${ship.data.id}.png`" height="30" width="120" />
      <!-- 札覆盖层 (右侧竖条) -->
      <div class="area-banner" v-if="ship.area > 0">
        <v-img :src="`./img/tags/area${ship.area}.webp`" height="40" width="29" />
      </div>
    </div>
    <div>
      <div class="level-area">
        Lv {{ ship.level }} 運 {{ ship.luck }} 対空 {{ ship.antiAir }}
      </div>
      <div class="ship-name">{{ shipName }}</div>
    </div>
    <!-- 解除按钮 -->
    <v-btn icon @click="removeShip">×</v-btn>
  </div>
  <!-- 状态栏 -->
  <div class="ship-status-container">
    火力 {{ fp }} 雷装 {{ tp }} 装甲 {{ ar }}
  </div>
  <!-- 装备槽位 -->
  <div v-for="item in ship.items">...</div>
</v-card>
```

**推荐的 Tailwind 实现：**

```tsx
// --- 左侧舰船池（紧凑版）ShipCardCompact ---
<div
  className={cn(
    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150",
    "hover:bg-accent/50 border border-transparent",
    isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400/50",
    isAssigned && "opacity-60" // 已分配的船变灰
  )}
  onClick={onSelect}
>
  {/* 舰船头像 120x30 */}
  <div className="relative shrink-0">
    <Image src={`/img/ship/banner/${ship.id}.png`} width={120} height={30} alt="" />
    {/* 札覆盖层 (右竖条) */}
    {assignedArea > 0 && (
      <div className="absolute right-0 top-0 bottom-0 w-[22px]">
        <Image src={`/img/tags/area${assignedArea}.webp`} width={29} height={40}
          className="h-full w-auto object-cover" alt={`E${assignedArea}`} />
      </div>
    )}
  </div>
  {/* 等级 + 名称 */}
  <div className="min-w-0 flex-1">
    <span className="text-xs text-muted-foreground">Lv{ship.level}</span>
    <p className="text-sm font-medium truncate">{master.api_name}</p>
  </div>
</div>

// --- 右侧海域面板（完整版）ShipCardFull ---
<div
  className={cn(
    "relative border rounded-xl p-3 bg-card transition-all",
    "hover:shadow-md",
    !ship && "border-dashed border-muted-foreground/30 flex items-center justify-center min-h-[160px] cursor-pointer hover:border-blue-400",
    ship && "border-border"
  )}
  onClick={ship ? undefined : onAssign}
>
  {ship ? (
    <>
      {/* 顶部: Banner + 等级 + 移除按钮 */}
      <div className="flex items-start gap-2">
        <div className="relative shrink-0">
          <Image src={`/img/ship/banner/${ship.id}.png`} width={120} height={30} alt="" />
          {/* 札覆盖层 */}
          {assignedArea > 0 && (
            <div className="absolute right-0 top-0 w-[22px]">
              <Image src={`/img/tags/area${assignedArea}.webp`} width={29} height={40} alt="" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Lv{ship.level}</span>
            <span>運{ship.luck}</span>
          </div>
          <p className="text-sm font-medium truncate">{master.api_name}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      {/* 分隔线 */}
      <Separator className="my-2" />
      {/* 属性栏 */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>火力 <strong>{ship.fp}</strong></span>
        <span>雷装 <strong>{ship.tp}</strong></span>
        <span>装甲 <strong>{ship.ar}</strong></span>
      </div>
      {/* 装备槽 (预留) */}
      <div className="mt-2 grid grid-cols-4 gap-1">
        {slots.map((slot, i) => (
          <div key={i} className="h-7 rounded bg-muted/50 border border-dashed border-muted-foreground/20 flex items-center justify-center text-[10px] text-muted-foreground">
            {slot || '-'}
          </div>
        ))}
      </div>
    </>
  ) : (
    // 空槽位
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <Plus className="h-5 w-5" />
      <span className="text-xs">添加舰娘</span>
    </div>
  )}
</div>
```

#### 关键 Tailwind 类名参考

| noro6 类名 | 功能 | Tailwind 等价 |
|---|---|---|
| `.ship-input` | 卡片容器 | `border rounded-xl p-3 bg-card` |
| `.disabled` (ship area) | 不可用状态 | `opacity-50 pointer-events-none` |
| `.area-banner` | 札覆盖层 | `absolute right-0 top-0 w-[22px]` |
| `.ship-name` | 舰名 | `text-sm font-medium truncate` |
| `.text--secondary` | 次要文字色 | `text-muted-foreground` |
| `.primary--text` | 蓝色强调 | `text-blue-600 dark:text-blue-400` |
| `.ma-1` | 外边距 | `m-1` → `m-1` (Tailwind 用 `gap-2` 更标准) |
| `.caption` | 小字号 | `text-xs` |
| `.body-2` | 正文小号 | `text-sm` |
| `.font-weight-bold` | 粗体 | `font-semibold` 或 `font-bold` |
| `.text-truncate` | 文本截断 | `truncate` |
| `.clickable-status` | 可点击指针 | `cursor-pointer` |
| `.no-stock` | 不可用/无库存 | `opacity-40` |

### 3.2 `TagBoard` — 海域面板

#### 功能边界

- 显示海域标签列表（E1 ~ E14，可配置）
- 每个标签对应一个舰队编制面板
- 舰队内以网格显示 ShipCard
- 支持添加/移除舰船
- 支持批量标签更新（参考 noro6 的「お札一括更新」）

#### 数据 Props

```typescript
interface TagBoardProps {
  areas: AreaTag[];                // 海域列表 (含编号、名称、颜色)
  fleets: Record<number, Slot[]>;  // 各海域的舰队数据
  activeArea: number;              // 当前激活的海域编号
  onAreaChange: (area: number) => void;
  onAssignShip: (area: number, slotIndex: number) => void;
  onRemoveShip: (area: number, slotIndex: number) => void;
}

interface AreaTag {
  id: number;        // 1~14
  name: string;      // "E1", "E2" 等
  color: string;     // 配色参考 (Color 变量)
}

interface Slot {
  ship: ShipStock | null;
  isLocked?: boolean;
}
```

#### 视觉结构与 Tailwind 实现

**原始 noro6 结构 (Fleet.vue):**

```html
<!-- 海域标签选项卡 (在 FleetAll.vue 的 v-tabs 中) -->
<v-tabs v-model="tab">
  <v-tab v-for="i in fleetCount" :key="i">第{i}艦隊</v-tab>
</v-tabs>

<!-- 标签更新对话框 -->
<v-dialog v-model="updateAreaTagDialog">
  <div>お札一括更新</div>
  <div>この艦隊に属する全ての艦娘が対象です。</div>
  <!-- 14个札图标 -->
  <div v-for="i in maxAreas">
    <v-img :src="`./img/tags/area${i}.webp`" height="68" width="50"
      :class="{ selected: selectedArea === i }" @click="selectedArea = i" />
  </div>
  <div class="no-area" @click="selectedArea = -1">札なし</div>
  <!-- 覆盖选项 -->
  <v-checkbox v-model="overwriteTag" label="既に札がついている艦娘も上書きする" />
  <v-btn @click="updateAreaTag()">更新</v-btn>
</v-dialog>

<!-- 舰队内的舰船网格 -->
<div class="ship-inputs-container" :class="{ line3: !is2line }">
  <ship-input v-for="(ship, i) in fleet.ships" :key="i" ... />
</div>
```

**推荐的 Tailwind 实现：**

```tsx
// --- 顶部标签栏 ---
<div className="flex items-center gap-1 border-b pb-2 mb-4 overflow-x-auto">
  {areas.map((area) => (
    <button
      key={area.id}
      onClick={() => onAreaChange(area.id)}
      className={cn(
        "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0",
        "hover:bg-accent",
        activeArea === area.id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground"
      )}
    >
      {/* 札图标（小） */}
      <div className="inline-block w-4 h-5 mr-1 align-middle">
        <Image src={`/img/tags/area${area.id}_min.webp`} width={16} height={20} alt="" />
      </div>
      {area.name}
      {/* 已分配计数 */}
      <span className="ml-1 text-xs opacity-70">
        ({fleets[area.id]?.filter(s => s.ship).length ?? 0})
      </span>
    </button>
  ))}
</div>

// --- 当前海域的舰队面板 (网格) ---
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
  {currentFleet.map((slot, index) => (
    <ShipCardFull
      key={index}
      ship={slot.ship}
      isAssigned={!!slot.ship}
      assignedArea={slot.ship?.area ?? 0}
      onAssign={() => onAssignShip(activeArea, index)}
      onRemove={() => onRemoveShip(activeArea, index)}
    />
  ))}
</div>

// --- 批量标签更新 Dialog ---
<Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
  <DialogContent className="sm:max-w-[680px]">
    <DialogHeader>
      <DialogTitle>批量更新海域标签</DialogTitle>
      <DialogDescription>
        当前海域的所有舰娘将被分配所选标签
      </DialogDescription>
    </DialogHeader>
    
    {/* 标签选择网格 */}
    <div className="grid grid-cols-5 sm:grid-cols-7 gap-3 py-4">
      {areas.map((area) => (
        <button
          key={area.id}
          onClick={() => setSelectedTag(area.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
            "hover:bg-accent",
            selectedTag === area.id && "ring-2 ring-primary bg-accent"
          )}
        >
          <Image
            src={`/img/tags/area${area.id}.webp`}
            width={50} height={68} alt={area.name}
            className={cn("transition-opacity", selectedTag !== area.id && "opacity-40")}
          />
          <span className="text-xs font-medium">{area.name}</span>
        </button>
      ))}
      {/* 无标签选项 */}
      <button
        onClick={() => setSelectedTag(0)}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed",
          "hover:bg-accent writing-mode-vertical",
          selectedTag === 0 && "ring-2 ring-primary"
        )}
      >
        <span className="text-xs font-medium">无标签</span>
      </button>
    </div>

    <div className="flex items-center gap-2">
      <Checkbox id="overwrite" checked={overwrite} onCheckedChange={setOverwrite} />
      <Label htmlFor="overwrite">已有标签的舰娘也覆盖</Label>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setTagDialogOpen(false)}>取消</Button>
      <Button onClick={handleBatchUpdate}>更新</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.3 防呆与视觉反馈规范 (Visual Error Prevention)

| 场景 | noro6 实现 | Tailwind 还原 |
|---|---|---|
| **已分配舰船** (在左侧池子中) | `area` > 0 时显示 Tag 覆盖层；`opacity` 未体现 | `opacity-60` + Tag 覆盖层，用 `Ring` 或 `Badge` 标明已分配海域 |
| **不可点击的槽位** (如已被锁定的船) | `.no-stock` 类 → `opacity: 0.4` | `opacity-40 pointer-events-none` |
| **舰船已被分配到其他海域** (点击时的弹窗) | `confirmDialog` 弹窗 + 提示文案 | `AlertDialog` (shadcn) `<AlertDialog>` |
| **选中状态** (被选中的船或标签) | `.selected` 类 → `opacity: 1` | `ring-2 ring-primary [box-shadow]` |
| **札覆盖层** | 29x40 竖条覆盖在 Banner 右下 | `absolute right-0 top-0 w-[22px] h-full` 半透明 |
| **舰种过滤器** | Tab 式按钮，`.type-selector` | `Tabs` 或 `Toggle` 组件组 |
| **多号机区分** | 在库模式下显示 `×{count}` | `Badge` 显示同船数量 |
| **操作反馈** | click 时有 Ripple 效果 | `active:scale-95 transition-transform` |

#### 可用札图标资源 (从 kc-web 提取)

```
public/img/tags/area1.webp  ~  area14.webp   (14 枚海域札)
public/img/tags/area1_min.webp  ~  area14_min.webp  (缩略版)
public/img/tags/colors/area_blue.webp  ~  area_yellow.webp (颜色变体)
```

每种颜色变体有 14 种：
`blue`, `cyan`, `green`, `grey`, `lemon`, `lime`, `orange`, `pink`, `purple`, `red`, `sky`, `violet`, `white`, `yellow`

这些图片可根据需要复制到你的项目中直接使用。

---

## 4. 数据流与状态管理方案

### 4.1 noro6 的数据流模式

```
START2.json             Firebase master.json
    │                          │
    ▼                          ▼
Vuex Store (state)     areaCount = master.area_count
    │
    ├── ships: ShipMaster[]         (舰船主数据)
    ├── shipStock: ShipStock[]      (玩家在库舰船)
    │     └── area: number          ← 札标记
    ├── calcManager: CalcManager    (当前编成)
    │     └── mainSaveData.fleets   (舰队数组)
    │           └── ships[].area    ← 舰队中船的札
    └── areaCount: number           (海域数量)
```

### 4.2 推荐的数据流 (Next.js + Zustand/Context)

```typescript
// 数据来源
const start2 = JSON.parse(readFileSync('src/data/START2.json'));
const shipMasterMap = new Map(start2.api_mst_ship.map(s => [s.api_id, s]));

// 从 Prisma 获取玩家的 ShipData (noro6 导出的 JSON)
// 解析 ship.txt 数据:
// {"id":961, "lv":159, "st":[51,60,56,42,4,0,0], "exp":[...], "ex":32544}

// 玩家在库舰船
interface ShipStock {
  id: number;         // 舰船 Master ID
  uniqueId: string;   // id+lv 组合作为唯一标识 (如 "961-159")
  level: number;
  area: number;       // 0 = 未分配, 1~14 = 海域札
  // ... 其他属性
}

// 锁船规划数据
interface LockPlan {
  id: string;
  name: string;
  areas: Record<number, ShipSlot[]>;  // area → ship slots
}

// 交互状态 (前端本地)
interface InteractionState {
  selectedShip: string | null;  // uniqueId
  activeArea: number;
}
```

---

## 5. 关键代码片段索引 (noro6 源码参考)

| 功能模块 | 源文件 | 关键行/方法 |
|---|---|---|
| 舰船卡片渲染 | `ShipInput.vue` | template 中 `ship-img-container` 区块, `@dragstart` 事件 |
| 舰船列表 (池) | `ShipList.vue` | `ships` 计算属性过滤, `clickedShip()` 回调, `confirmDialog` |
| 舰队容器 | `Fleet.vue` | `showAreaTagDialog()`, `updateAreaTag()`, `batchDeploy()` |
| 主舰队视图 | `FleetAll.vue` | v-tabs 舰队切换, v-dialog 弹出 ShipList |
| 札更新 Dialog | `Fleet.vue` | template 中 `updateAreaTagDialog` 区块 |
| 舰船在库数据 | `ShipStock.ts` | `area: number` 属性 |
| 舰船 Filter | `ShipFilter.ts` | `hasAreaOnly`, `hasNotAreaOnly` 过滤方法 |
| 札过滤切换 | `ShipList.vue` | `toggleAreaFilter()`, 三个状态图片 |

---

## 6. 总结：实施路线图

```
Phase 1 — 基础布局
  □ 创建左侧舰船池组件 (ShipPool)
  □ 创建右侧海域看板组件 (TagBoard)
  □ 响应式 Grid 布局 (1/2/3 列)
  □ 海域 Tab 切换

Phase 2 — 交互逻辑
  □ 点击选中舰船 (左侧高亮)
  □ 点击空槽位 → 分配选中舰船
  □ 重复分配确认弹窗
  □ 移除舰船

Phase 3 — 视觉还原
  □ ShipCard 紧凑版 (左侧列表)
  □ ShipCard 完整版 (右侧面板)
  □ 札覆盖层 overlay
  □ 已分配 → 半透明处理 (opacity-60)
  □ 选中高亮 (ring-2)

Phase 4 — 高级功能
  □ 批量标签更新 Dialog
  □ 舰种过滤器
  □ 札状态过滤 (全部/已分配/未分配)
  □ 右键菜单 (卸下/移动)
  □ 多号机计数展示
```
