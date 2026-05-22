-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'NUMBER', 'DATE', 'CHECKBOX');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "customData" JSONB;

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormField_organizationId_idx" ON "FormField"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FormField_organizationId_fieldKey_key" ON "FormField"("organizationId", "fieldKey");

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
