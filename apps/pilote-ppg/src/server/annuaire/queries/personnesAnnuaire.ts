import { $Enums, type Prisma } from "@prisma/client";
import type { PrismaPilote } from "@/server/db/PrismaPilote";
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

type ClientPrisma = ReturnType<PrismaPilote["getInstance"]>;

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

const FORMAT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lirePersonnes(
  prisma: ClientPrisma,
  ids: string[],
): Promise<Map<string, PersonneAnnuaire>> {
  const idsValides = [...new Set(ids)].filter((id) => FORMAT_UUID.test(id));
  if (idsValides.length === 0) return new Map();

  const utilisateurs = await prisma.utilisateur.findMany({
    where: { id: { in: idsValides } },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      fonction: true,
      service: true,
      service_autre: true,
      perimetre_ministeriel: true,
    },
  });

  return new Map(
    utilisateurs.map((utilisateur) => [
      utilisateur.id,
      {
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
      },
    ]),
  );
}

export function personnesRetenues(
  affectations: { personneId: string }[],
  personnes: Map<string, PersonneAnnuaire>,
): PersonneAnnuaire[] {
  const ids = [
    ...new Set(affectations.map((affectation) => affectation.personneId)),
  ];
  return ids.flatMap((id) => {
    const personne = personnes.get(id);
    return personne ? [personne] : [];
  });
}
