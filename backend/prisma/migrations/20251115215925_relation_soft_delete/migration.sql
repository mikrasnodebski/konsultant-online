/*
  Warnings:

  - A unique constraint covering the columns `[consultantId,clientId,relationType,isDeleted]` on the table `Relation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "unique_consultant_client_relation";

-- AlterTable
ALTER TABLE "Relation" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "unique_consultant_client_relation" ON "Relation"("consultantId", "clientId", "relationType", "isDeleted");
