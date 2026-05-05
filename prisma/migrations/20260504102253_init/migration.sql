-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "shipData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoutineRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seaArea" TEXT NOT NULL,
    "missionName" TEXT NOT NULL,
    "airControl" INTEGER NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoutineRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fleetImageUrl" TEXT,
    "airbaseImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LockPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "tagColorClass" TEXT NOT NULL,
    "assignedData" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LockPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "RoutineRecord_userId_seaArea_idx" ON "RoutineRecord"("userId", "seaArea");

-- CreateIndex
CREATE INDEX "RoutineRecord_createdAt_idx" ON "RoutineRecord"("createdAt");

-- CreateIndex
CREATE INDEX "StrategyPost_phaseName_idx" ON "StrategyPost"("phaseName");

-- CreateIndex
CREATE INDEX "StrategyPost_createdAt_idx" ON "StrategyPost"("createdAt");

-- CreateIndex
CREATE INDEX "LockPlan_userId_idx" ON "LockPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LockPlan_userId_tagName_key" ON "LockPlan"("userId", "tagName");
