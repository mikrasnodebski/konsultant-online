-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('CONSULTANT_CLIENT', 'CONSULTANT_LEAD');

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "storeSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "pricePln" DECIMAL(10,2) NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relation" (
    "id" SERIAL NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "consultantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offer_storeSlug_key" ON "Offer"("storeSlug");

-- CreateIndex
CREATE INDEX "Relation_consultantId_idx" ON "Relation"("consultantId");

-- CreateIndex
CREATE INDEX "Relation_clientId_idx" ON "Relation"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_consultant_client_relation" ON "Relation"("consultantId", "clientId", "relationType");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
