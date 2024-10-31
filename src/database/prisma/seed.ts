
import { Maille, territoire as TerritoireModel } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import seed_profil from '@/server/seeds/profil.json';
import seed_scope from '@/server/seeds/scope.json';
import seed_territoire from '@/server/seeds/territoire.json';


function upsertProfile() {

  // Exemple pour créer des lignes en une requête
  // await prisma.profil.createMany({ data: seed_profil, skipDuplicates: true });

  return Promise.all(
    seed_profil.map(profil => 
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
    seed_scope.map(scope => 
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
    seed_territoire.map(territoire => {

      // Modification de certains types
      const mailleTerritoire: Maille = {
        'dept': Maille.DEPT,
        'reg': Maille.REG,
        'nat': Maille.NAT,
      }[territoire.maille] as Maille;
      const codeInseeTerritoire: string = territoire.code_insee.toString();

      // Création du territoire avec les bons types
      const t: TerritoireModel = {
        code: territoire.code,
        code_insee: codeInseeTerritoire,
        code_parent: territoire.code_parent,
        maille: mailleTerritoire,
        nom: territoire.nom,
        nom_affiche: territoire.nom_affiche,
        zone_id: territoire.zone_id,
      };

      return prisma.territoire.upsert({ 
        where: { code: territoire.code },
        create: t,
        update: t,
      });
    },
    ),
  );
}


Promise.resolve(true)
  .then(_ => upsertProfile())
  .then(_ => upsertScope())
  .then(_ => upsertTerritoire())
  .then(_ => true);

