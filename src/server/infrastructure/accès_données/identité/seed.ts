import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

export type InputScopeHabilitations = {
  code: string,
  nom: string,
};

export type InputProfil = {
  code: string,
  nom: string,
  aAccesTousChantiers: boolean,
  habilitationScopeCodes: string[],
};

export type InputUtilisateur = {
  email: string,
  profilCode: string,
  chantierIds: string[],
};

type withId = { id: string };

export async function créerUtilisateursAvecDroits(
  prisma: PrismaClient,
  inputScopeHabilitations: InputScopeHabilitations[],
  inputProfils: InputProfil[],
  inputUtilisateurs: InputUtilisateur[],
) {
  const donnéesScopeHabilitations: Record<string, InputScopeHabilitations & withId> = {};
  for (const input of inputScopeHabilitations) {
    donnéesScopeHabilitations[input.code] = { id: uuidv4(), ...input };
  }
  await prisma.habilitation_scope.createMany({ data: Object.values(donnéesScopeHabilitations) });

  const donnéesProfils: Record<string, InputProfil & withId> = {};
  for (const input of inputProfils) {
    donnéesProfils[input.code] = { id: uuidv4(), ...input };
  }
  await prisma.profil.createMany({ data: Object.values(donnéesProfils)
    .map(it => ({ id: it.id, code: it.code, nom: it.nom, a_acces_tous_chantiers: it.aAccesTousChantiers })) });

  const donnéesUtilisateurs: (InputUtilisateur & withId)[] = [];
  for (const input of inputUtilisateurs) {
    donnéesUtilisateurs.push({ id: uuidv4(), ...input });
  }
  await prisma.utilisateur.createMany({ data: donnéesUtilisateurs
    .map(it => ({ id: it.id, email: it.email, profil_id: donnéesProfils[it.profilCode].id })) });

  const utilisateurChantiers = [];
  for (const { id: utilisateur_id, chantierIds } of donnéesUtilisateurs) {
    for (const chantier_id of chantierIds) {
      utilisateurChantiers.push({ utilisateur_id, chantier_id });
    }
  }
  await prisma.utilisateur_chantier.createMany({ data: utilisateurChantiers });

  const profilScopeHabilitations = [];
  for (const { id: profil_id, habilitationScopeCodes } of Object.values(donnéesProfils)) {
    for (const habilitationScopeCode of habilitationScopeCodes) {
      const habilitation_scope_id = donnéesScopeHabilitations[habilitationScopeCode].id;
      profilScopeHabilitations.push({ profil_id, habilitation_scope_id });
    }
  }

  await prisma.profil_habilitation.createMany({ data: profilScopeHabilitations });
}
