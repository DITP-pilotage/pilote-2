-- CreateTable
CREATE TABLE "mesure_indicateur" (
    "id" TEXT NOT NULL,
    "indicId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "metricDate" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" TEXT NOT NULL,

    CONSTRAINT "mesure_indicateur_pkey" PRIMARY KEY ("id")
);
