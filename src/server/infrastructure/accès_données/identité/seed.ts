import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import {
  SCOPE_LECTURE,
  SCOPE_SAISIE_INDICATEURS,
  SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES,
} from '@/server/domain/identité/Habilitation';
import {
  CABINET_MINISTERIEL,
  CABINET_MTFP, DIR_ADMIN_CENTRALE, DIR_PROJET,
  DITP_ADMIN,
  DITP_PILOTAGE, EQUIPE_DIR_PROJET,
  PM_ET_CABINET,
  PR, SECRETARIAT_GENERAL,
} from '@/server/domain/identité/Profil';

export type InputScopesHabilitations = {
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

export const INPUT_SCOPES_HABILITATIONS: InputScopesHabilitations[] = [
  { code: SCOPE_LECTURE, nom: 'Lecture' },
  { code: SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, nom: 'Saisie de la synthèse et des commentaires' },
  { code: SCOPE_SAISIE_INDICATEURS, nom: 'Saisie des indicateurs de chantiers' },
];

const tousScopes = [SCOPE_LECTURE, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS];
export const INPUT_PROFILS: InputProfil[] = [
  { code: DITP_ADMIN, nom: 'DITP - Admin', aAccesTousChantiers: true, habilitationScopeCodes: tousScopes },
  { code: DITP_PILOTAGE, nom: 'DITP - Pilotage', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: PM_ET_CABINET, nom: 'Première Ministre et cabinet', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: PR, nom: 'Présidence de la République', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: CABINET_MTFP, nom: 'Cabinet MTFP', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: CABINET_MINISTERIEL, nom: 'Cabinets ministériels', aAccesTousChantiers: false, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: DIR_ADMIN_CENTRALE, nom: "Direction d'administration centrale", aAccesTousChantiers: false, habilitationScopeCodes: [SCOPE_LECTURE] },
  { code: SECRETARIAT_GENERAL, nom: 'Secrétariat général de ministère (cormod)', aAccesTousChantiers: false, habilitationScopeCodes: [SCOPE_LECTURE, SCOPE_SAISIE_INDICATEURS] },
  { code: DIR_PROJET, nom: 'Directeur de projet', aAccesTousChantiers: false, habilitationScopeCodes: tousScopes },
  { code: EQUIPE_DIR_PROJET, nom: 'Équipe de Directeur de projet', aAccesTousChantiers: false, habilitationScopeCodes: tousScopes },
];

type ProfilIdByCode = Record<string, string>;

export async function créerProfilsEtHabilitations(
  prisma: PrismaClient,
  inputProfils: InputProfil[],
  inputScopesHabilitations: InputScopesHabilitations[],
): Promise<ProfilIdByCode> {
  const donnéesScopeHabilitations: Record<string, InputScopesHabilitations & withId> = {};
  for (const input of inputScopesHabilitations) {
    donnéesScopeHabilitations[input.code] = { id: uuidv4(), ...input };
  }
  await prisma.habilitation_scope.createMany({ data: Object.values(donnéesScopeHabilitations) });

  const donnéesProfils: Record<string, InputProfil & withId> = {};
  for (const input of inputProfils) {
    donnéesProfils[input.code] = { id: uuidv4(), ...input };
  }
  await prisma.profil.createMany({
    data: Object.values(donnéesProfils)
      .map(it => ({ id: it.id, code: it.code, nom: it.nom, a_acces_tous_chantiers: it.aAccesTousChantiers })),
  });

  const profilScopeHabilitations = [];
  for (const { id: profil_id, habilitationScopeCodes } of Object.values(donnéesProfils)) {
    for (const habilitationScopeCode of habilitationScopeCodes) {
      const habilitation_scope_id = donnéesScopeHabilitations[habilitationScopeCode].id;
      profilScopeHabilitations.push({ profil_id, habilitation_scope_id });
    }
  }
  await prisma.profil_habilitation.createMany({ data: profilScopeHabilitations });

  const result: ProfilIdByCode = {};
  for (const [code, { id }] of Object.entries(donnéesProfils)) {
    result[code] = id;
  }
  return result;
}

export async function créerUtilisateurs(
  prisma: PrismaClient,
  inputUtilisateurs: InputUtilisateur[],
  profilIdByCode: Record<string, string>,
) {
  const donnéesUtilisateurs: (InputUtilisateur & withId)[] = [];
  for (const input of inputUtilisateurs) {
    donnéesUtilisateurs.push({ id: uuidv4(), ...input });
  }
  await prisma.utilisateur.createMany({ data: donnéesUtilisateurs
    .map(it => ({ id: it.id, email: it.email, profil_id: profilIdByCode[it.profilCode] })) });

  const utilisateurChantiers = [];
  for (const { id: utilisateur_id, chantierIds } of donnéesUtilisateurs) {
    for (const chantier_id of chantierIds) {
      utilisateurChantiers.push({ utilisateur_id, chantier_id });
    }
  }
  await prisma.utilisateur_chantier.createMany({ data: utilisateurChantiers });
}
