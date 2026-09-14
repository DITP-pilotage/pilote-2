import { Maille, territoire as TerritoireModel } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import seedProfil from "@/server/seeds/profil.json";
import seedScope from "@/server/seeds/scope.json";
import seedTerritoireArray from "@/server/seeds/territoire.json";

type TerritoireSeed = {
  code: string;
  nom: string;
  nom_affiche: string;
  maille: string;
  code_insee: number | string;
  code_parent: string | null;
  zone_id: string;
};

const seedsDepartements: TerritoireSeed[] = seedTerritoireArray.filter(
  (territoire) => territoire.maille === "dept",
);
const seedsRegionsEtNational: TerritoireSeed[] = seedTerritoireArray.filter(
  (territoire) => territoire.maille != "dept",
);

const maillesTerritoireCorrespondance: Record<string, Maille> = {
  dept: Maille.DEPT,
  reg: Maille.REG,
  nat: Maille.NAT,
};

async function upsertProfile() {
  for (const profil of seedProfil) {
    await prisma.profil.upsert({
      where: { code: profil.code },
      create: profil,
      update: profil,
    });
  }
}

async function upsertScope() {
  for (const scope of seedScope) {
    await prisma.scope.upsert({
      where: { code: scope.code },
      create: scope,
      update: scope,
    });
  }
}

async function upsertTerritoire(seedsTerritoires: TerritoireSeed[]) {
  for (const territoireSeed of seedsTerritoires) {
    const mailleTerritoire =
      maillesTerritoireCorrespondance[territoireSeed.maille];
    const codeInseeTerritoire = territoireSeed.code_insee.toString();

    const territoireACreer: TerritoireModel = {
      code: territoireSeed.code,
      code_insee: codeInseeTerritoire,
      code_parent: territoireSeed.code_parent,
      maille: mailleTerritoire,
      nom: territoireSeed.nom,
      nom_affiche: territoireSeed.nom_affiche,
      zone_id: territoireSeed.zone_id,
    };

    await prisma.territoire.upsert({
      where: { code: territoireSeed.code },
      create: territoireACreer,
      update: territoireACreer,
    });
  }
}

async function main() {
  await upsertProfile();
  await upsertScope();
  await upsertTerritoire(seedsRegionsEtNational);
  await upsertTerritoire(seedsDepartements);
}

main().catch((erreur) => {
  // eslint-disable-next-line no-console
  console.error(erreur);
  // Sans ce code de sortie, `prisma db seed` rend 0 malgre un seed casse : la base
  // repart vide et l'echec ne remonte que plus loin, sous forme de violation de FK.
  process.exit(1);
});
