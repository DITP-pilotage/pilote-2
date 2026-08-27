import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

describe("Contrainte FK metadata_indicateurs(_hidden).zg_applicable -> metadata_zonegroup", () => {
  beforeEach(async () => {
    await prisma.metadata_zonegroup.create({
      data: {
        zone_group_id: "ZG-TEST-FK",
        zg_name: "Zone de test FK",
      },
    });
  });

  it("accepte un indicateur dont zg_applicable référence un zone-groupe existant", async () => {
    const indicateur = await prisma.metadata_indicateurs.create({
      data: {
        indic_id: "IND-TEST-FK-1",
        indic_parent_ch: "CH-TEST",
        indic_nom: "Indicateur de test",
        zg_applicable: "ZG-TEST-FK",
      },
    });

    expect(indicateur.zg_applicable).toBe("ZG-TEST-FK");
  });

  it("accepte un indicateur sans zone-groupe (zg_applicable null)", async () => {
    const indicateur = await prisma.metadata_indicateurs.create({
      data: {
        indic_id: "IND-TEST-FK-2",
        indic_parent_ch: "CH-TEST",
        indic_nom: "Indicateur de test",
        zg_applicable: null,
      },
    });

    expect(indicateur.zg_applicable).toBeNull();
  });

  it("rejette un indicateur dont zg_applicable référence un zone-groupe inexistant", async () => {
    await expect(
      prisma.metadata_indicateurs.create({
        data: {
          indic_id: "IND-TEST-FK-3",
          indic_parent_ch: "CH-TEST",
          indic_nom: "Indicateur de test",
          zg_applicable: "ZG-INEXISTANT",
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it("rejette un indicateur caché dont zg_applicable référence un zone-groupe inexistant", async () => {
    await expect(
      prisma.metadata_indicateurs_hidden.create({
        data: {
          indic_id: "IND-TEST-FK-HIDDEN-1",
          indic_parent_ch: "CH-TEST",
          indic_nom: "Indicateur caché de test",
          zg_applicable: "ZG-INEXISTANT",
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });
});
