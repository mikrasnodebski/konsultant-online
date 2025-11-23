-- CreateTable
CREATE TABLE "Recording" (
    "id" SERIAL NOT NULL,
    "relationId" INTEGER,
    "consultantId" INTEGER,
    "clientId" INTEGER,
    "mimeType" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);
