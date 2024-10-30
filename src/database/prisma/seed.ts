
import { Maille } from '@prisma/client';
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

      const mailleTerritoire: Maille | undefined = {
        'nat': Maille.NAT,
        'reg': Maille.REG,
        'dept': Maille.DEPT,
      }[territoire.maille];
      const codeInseeTerritoire: String = territoire.code_insee.toString();

      return prisma.territoire.upsert({ 
        where: { code: territoire.code },
        create: Object.assign(territoire, { maille: mailleTerritoire, code_insee: codeInseeTerritoire }),
        update: Object.assign(territoire, { maille: mailleTerritoire, code_insee: codeInseeTerritoire }),
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

