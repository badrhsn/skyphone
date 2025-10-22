-- CreateTable
CREATE TABLE "ApiConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "configData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsed" DATETIME,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT
);

-- CreateTable
CREATE TABLE "ConfigurationAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configurationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "previousValue" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfigurationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiConfiguration_provider_key" ON "ApiConfiguration"("provider");

-- CreateIndex
CREATE INDEX "ApiConfiguration_provider_idx" ON "ApiConfiguration"("provider");

-- CreateIndex
CREATE INDEX "ApiConfiguration_environment_idx" ON "ApiConfiguration"("environment");

-- CreateIndex
CREATE INDEX "ConfigurationAudit_configurationId_idx" ON "ConfigurationAudit"("configurationId");

-- CreateIndex
CREATE INDEX "ConfigurationAudit_action_idx" ON "ConfigurationAudit"("action");

-- CreateIndex
CREATE INDEX "ConfigurationAudit_createdAt_idx" ON "ConfigurationAudit"("createdAt");
