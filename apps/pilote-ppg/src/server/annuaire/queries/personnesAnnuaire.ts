import { $Enums, type Prisma } from "@prisma/client";
import type { UtilisateurEnrichi } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { getServiceLibelle } from "@/utils/referentiel-services";

export type PersonneAnnuaire = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  service: string | null;
};

export type MailleAnnuaire = Exclude<$Enums.Maille, "NAT">;

export type TerritoireAnnuaire = {
  code: string;
  nom: string;
  maille: MailleAnnuaire;
  regionCode: string;
  regionNom: string;
};

export const MAILLES_ANNUAIRE: MailleAnnuaire[] = [
  $Enums.Maille.REG,
  $Enums.Maille.DEPT,
];

export const selectionTerritoire = {
  code: true,
  nom_affiche: true,
  maille: true,
  territoire_parent: { select: { code: true, nom_affiche: true } },
} satisfies Prisma.territoireSelect;

type TerritoirePrisma = Prisma.territoireGetPayload<{
  select: typeof selectionTerritoire;
}>;

export function versTerritoireAnnuaire(
  territoire: TerritoirePrisma,
): TerritoireAnnuaire {
  const region =
    territoire.maille === $Enums.Maille.REG
      ? territoire
      : (territoire.territoire_parent ?? territoire);
  return {
    code: territoire.code,
    nom: territoire.nom_affiche,
    maille:
      territoire.maille === $Enums.Maille.REG
        ? $Enums.Maille.REG
        : $Enums.Maille.DEPT,
    regionCode: region.code,
    regionNom: region.nom_affiche,
  };
}

export function versPersonneAnnuaire(
  utilisateur: UtilisateurEnrichi,
): PersonneAnnuaire {
  return {
    id: utilisateur.id,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
    email: utilisateur.email,
    fonction: utilisateur.fonction,
    service: getServiceLibelle(
      utilisateur.perimetre_ministeriel,
      utilisateur.service,
      utilisateur.service_autre,
    ),
  };
}

export function personnesRetenues(
  affectations: { personneId: string }[],
  utilisateurParId: Map<string, UtilisateurEnrichi>,
): PersonneAnnuaire[] {
  const ids = [
    ...new Set(affectations.map((affectation) => affectation.personneId)),
  ];
  return ids.flatMap((id) => {
    const utilisateur = utilisateurParId.get(id);
    return utilisateur ? [versPersonneAnnuaire(utilisateur)] : [];
  });
}
