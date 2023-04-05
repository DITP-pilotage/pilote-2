import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { DIR_CHANTIER, DITP_ADMIN } from '@/server/domain/identité/Profil';

export type InputProfil = {
  code: string,
  nom: string,
  a_acces_tous_chantiers: boolean
};

export type InputUtilisateur = {
  email: string,
  profilCode: string,
  chantierIds: string[],
};

export async function créerUtilisateursAvecDroits(prisma: PrismaClient, inputProfils: InputProfil[], inputUtilisateurs: InputUtilisateur[]) {
  type DonnéesProfil = { id: string, code: string, nom: string, a_acces_tous_chantiers: boolean };
  const donnéesProfils: Record<string, DonnéesProfil> = {};
  for (const input of inputProfils) {
    donnéesProfils[input.code] = { ...input, id: uuidv4() };
  }

  type DonnéesUtilisateur = { id: string, email: string, profil_id: string, chantier_ids: string[] };
  const donnéesUtilisateurs: DonnéesUtilisateur[] = [];
  for (const input of inputUtilisateurs) {
    donnéesUtilisateurs.push({
      id: uuidv4(),
      email: input.email,
      profil_id: donnéesProfils[input.profilCode].id,
      chantier_ids: input.chantierIds,
    });
  }

  for (const profil of Object.values(donnéesProfils)) {
    await prisma.profil.create({ data: profil });
  }

  for (const { id, email, profil_id } of Object.values(donnéesUtilisateurs)) {
    await prisma.utilisateur.create({ data: { id, email, profil_id } });
  }

  const utilisateurChantiers = [];
  for (const { id: utilisateur_id, chantier_ids } of donnéesUtilisateurs) {
    for (const chantier_id of chantier_ids) {
      utilisateurChantiers.push({
        utilisateur_id,
        chantier_id,
      });
    }
  }
  await prisma.utilisateur_chantier.createMany({ data: utilisateurChantiers });

  const { id: habilitationScopeLectureId } = await prisma.habilitation_scope.create({
    data: {
      code: 'lecture',
      nom: 'Scope de lecture sur un chantier',
    },
  });

  const { id: habilitationScopeÉcritureId } = await prisma.habilitation_scope.create({
    data: {
      code: 'écriture',
      nom: "Scope d'écriture sur un chantier",
    },
  });

  const profilHabilitations = [
    { profil_id: donnéesProfils.PM.id, habilitation_scope_id: habilitationScopeLectureId },
  ];
  for (const code of [DITP_ADMIN, DIR_CHANTIER]) {
    for (const habilitation_scope_id of [habilitationScopeLectureId, habilitationScopeÉcritureId]) {
      const profil_id = donnéesProfils[code].id;
      profilHabilitations.push({ profil_id, habilitation_scope_id });
    }
  }

  await prisma.profil_habilitation.createMany({ data: profilHabilitations });
}
