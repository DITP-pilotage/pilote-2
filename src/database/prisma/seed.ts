
import { Maille, territoire as TerritoireModel } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import seedProfil from '@/server/seeds/profil.json';
import seedScope from '@/server/seeds/scope.json';
import seedTerritoireArray from '@/server/seeds/territoire.json';


function upsertProfile() {

  // Exemple pour créer des lignes en une requête
  // await prisma.profil.createMany({ data: seedProfil, skipDuplicates: true });

  return Promise.all(
    seedProfil.map(profil => 
      prisma.profil.upsert({ 
        where: { code: profil.code },
        create: profil,
        update: profil,
      }),
    ),
  );
}

function upsertScope() {

  return Promise.all(
    seedScope.map(scope => 
      prisma.scope.upsert({ 
        where: { code: scope.code },
        create: scope,
        update: scope,
      }),
    ),
  );
}

function upsertTerritoire() {

  return Promise.all(
    seedTerritoireArray.map(territoireSeed => {

      // Modification de certains types
      const mailleTerritoire: Maille = {
        'dept': Maille.DEPT,
        'reg': Maille.REG,
        'nat': Maille.NAT,
      }[territoireSeed.maille] as Maille;
      const codeInseeTerritoire: string = territoireSeed.code_insee.toString();

      // Création du territoire avec les bons types
      const territoireACreer: TerritoireModel = {
        code: territoireSeed.code,
        code_insee: codeInseeTerritoire,
        code_parent: territoireSeed.code_parent,
        maille: mailleTerritoire,
        nom: territoireSeed.nom,
        nom_affiche: territoireSeed.nom_affiche,
        zone_id: territoireSeed.zone_id,
      };

      return prisma.territoire.upsert({ 
        where: { code: territoireSeed.code },
        create: territoireACreer,
        update: territoireACreer,
      });
    },
    ),
  );
}


Promise.resolve(true)
  .then(() => upsertProfile())
  .then(() => upsertScope())
  .then(() => upsertTerritoire());
