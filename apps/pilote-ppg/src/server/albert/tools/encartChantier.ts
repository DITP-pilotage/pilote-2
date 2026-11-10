import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  ecartPourLeSousAgent,
  type EncartChantierOutput,
  indicateursPourLeSousAgent,
} from "@/server/albert/tools/encart";
import {
  collecterChantiers,
  type ChantierRenvoye,
} from "@/server/albert/tools/getChantiers";
import { regrouperParType } from "@/server/albert/tools/getChantierCommentaires";
import {
  designationMaille,
  libelleOuAbsence,
  libelleTypeCommentaire,
} from "@/server/albert/tools/libelles";
import {
  type GetChantierCommentairesQuery,
  type GetChantierCommentairesResult,
  type TypeContenuChantier,
  typesContenuChantier,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import { SEUIL_ECART_MEDIANE } from "@/shared/chantier/avancement/ecartMediane";
import type {
  GetChantierIndicateursQuery,
  GetChantierIndicateursResult,
} from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

/** Un commentaire du chantier sur le territoire, dans sa version en vigueur. */
type CommentaireEncart = {
  type: TypeContenuChantier;
  date_publication: string;
  contenu: string;
};

/** Ce que l'outil a collecté et passé au sous-agent de rédaction (PIL-1966). */
export type DonneesEncartChantier = {
  jalon: number;
  territoire_code: string;
  territoire_nom: string | null;
  /** Territoire hors de l'accès complet : tendance et commentaires y sont masqués. */
  acces_restreint?: true;
  /** `null` : le chantier n'a pas de donnée sur ce territoire (maille non pilotée). */
  chantier: ChantierRenvoye | null;
  indicateurs: GetChantierIndicateursResult["indicateurs"];
  commentaires: CommentaireEncart[];
};

/** Le commentaire de synthèse vient déjà avec le chantier. */
const TYPES_COMMENTAIRES: TypeContenuChantier[] = typesContenuChantier.filter(
  (type) => type !== "synthese_des_resultats",
);

/**
 * La version en vigueur de chaque type de commentaire : l'encart résume
 * l'état du chantier, pas l'historique de ses commentaires.
 */
const versionsEnVigueur = (
  commentaires: GetChantierCommentairesResult["commentaires"],
): CommentaireEncart[] => {
  const groupes = regrouperParType({ commentaires });
  return TYPES_COMMENTAIRES.flatMap((type) => {
    const enVigueur = groupes.find((groupe) => groupe.type === type)
      ?.versions[0];
    return enVigueur ? [{ type, ...enVigueur }] : [];
  });
};

export type DependancesEncartChantier = {
  getChantiersQuery: GetChantiersQuery;
  territoireResolver: TerritoireResolver;
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
};

/**
 * Les données de l'encart d'un chantier sur un territoire, collectées comme
 * le feraient `get_chantiers`, `get_indicateurs` et
 * `get_chantier_commentaires` : mêmes règles d'accès, mêmes libellés.
 *
 * `null` : l'utilisateur n'a pas accès au chantier.
 */
export async function collecterDonneesEncartChantier({
  chantierId,
  territoireCode,
  jalon,
  habilitations,
  getChantiersQuery,
  territoireResolver,
  getChantierIndicateursQuery,
  getChantierCommentairesQuery,
}: DependancesEncartChantier & {
  chantierId: string;
  territoireCode: string;
  jalon: number;
  habilitations: Habilitations;
}): Promise<DonneesEncartChantier | null> {
  const territoiresAccessibles = habilitations.lecture.territoires;
  const chantiersAccessibles = habilitations.lecture.chantiers;
  if (!chantiersAccessibles.includes(chantierId)) return null;

  const accesComplet = territoiresAccessibles.includes(territoireCode);

  const [chantiers, indicateurs, commentaires] = await Promise.all([
    collecterChantiers({
      input: {
        perimetre: { type: "SELECTION", territoire_codes: [territoireCode] },
        jalon,
        chantier_ids: [chantierId],
        view: "all",
      },
      getChantiersQuery,
      territoireResolver,
      territoiresAccessibles,
      chantiersAccessibles,
    }),
    getChantierIndicateursQuery.execute({ territoireCode, chantierId, jalon }),
    // Hors de l'accès complet, get_chantier_commentaires refuse le territoire
    accesComplet
      ? getChantierCommentairesQuery.execute({
          chantierId,
          territoireCode,
          types: TYPES_COMMENTAIRES,
          inclureCommentairesNationaux: false,
        })
      : null,
  ]);

  const [resultat] = chantiers.resultats;
  return {
    jalon,
    territoire_code: territoireCode,
    territoire_nom: resultat?.territoire_nom ?? null,
    ...(!accesComplet && { acces_restreint: true }),
    chantier: resultat?.chantiers[0] ?? null,
    indicateurs: indicateurs.indicateurs,
    commentaires: versionsEnVigueur(
      commentaires?.resultats.flatMap(
        (parTerritoire) => parTerritoire.commentaires,
      ) ?? [],
    ),
  };
}

/**
 * La position face à la médiane, selon les seuils de PILOTE. Hors de l'accès
 * complet, `est_en_retard` est forcé à faux : on la déduit de l'écart, que
 * l'utilisateur voit sur tous les territoires.
 */
const positionFaceALaMediane = (ecart: number | null): string => {
  if (ecart === null) return "non calculée";
  if (ecart <= -SEUIL_ECART_MEDIANE) return "en retard";
  if (ecart >= SEUIL_ECART_MEDIANE) return "en avance";
  return "dans la médiane";
};

/** Ce que le sous-agent lit : seulement ce que le gabarit écrit. */
export const donneesChantierPourLeSousAgent = (
  donnees: DonneesEncartChantier,
) => ({
  // Sans le jalon, le sous-agent remplissait « {jalon} » avec le taux
  jalon: donnees.jalon,
  territoire: {
    nom: donnees.territoire_nom ?? donnees.territoire_code,
    maille: designationMaille({ territoireCode: donnees.territoire_code }),
    ...(donnees.acces_restreint && { acces_restreint: true }),
  },
  chantier: donnees.chantier && {
    id: donnees.chantier.chantier.id,
    nom: donnees.chantier.chantier.nom,
    taux_avancement: libelleOuAbsence({
      valeur: donnees.chantier.taux_avancement,
      absence: "non calculé",
      libelle: (taux) => `${Math.round(taux)} %`,
    }),
    ecart: ecartPourLeSousAgent({ ecart: donnees.chantier.ecart }),
    position_face_a_la_mediane: positionFaceALaMediane(donnees.chantier.ecart),
    niveau_de_confiance: libelleOuAbsence({
      valeur: donnees.chantier.niveau_de_confiance,
      absence: "non renseigné",
    }),
    // Hors de l'accès complet, la tendance est masquée, pas absente
    tendance: libelleOuAbsence({
      valeur: donnees.chantier.tendance,
      absence: "non renseignée",
      masquee: donnees.acces_restreint === true,
    }),
    commentaire_de_synthese: donnees.chantier.synthese?.commentaire ?? null,
  },
  indicateurs: indicateursPourLeSousAgent(donnees.indicateurs),
  commentaires: donnees.commentaires.map((commentaire) => ({
    type: libelleTypeCommentaire({ type: commentaire.type }),
    date_publication: commentaire.date_publication.slice(0, 10),
    contenu: commentaire.contenu,
  })),
});

/**
 * Ce que l'encart couvre, et ce qu'il ne couvre pas : une question de suivi
 * hors de ce périmètre appelle l'outil correspondant (PIL-1949).
 */
export const couvertureEncartChantier = ({
  jalon,
  donnees,
}: {
  jalon: number;
  donnees: DonneesEncartChantier;
}) => ({
  chantier: donnees.chantier?.chantier.id ?? null,
  territoire: { code: donnees.territoire_code, nom: donnees.territoire_nom },
  jalon,
  contient: [
    "taux d'avancement du chantier, écart et position face à la médiane",
    "niveau de confiance, tendance et commentaire de synthèse",
    "valeurs des indicateurs du chantier",
    "commentaires du territoire, dans leur version en vigueur",
  ],
  ne_contient_pas: [
    "objectifs du chantier",
    "historique des commentaires",
    "évolution des indicateurs dans le temps",
    "autres territoires et autres jalons",
    "synthèse du territoire et autres chantiers",
  ],
});

/**
 * Le modèle principal relit le texte de l'encart, son périmètre et les
 * données dont il est tiré, comme pour l'encart territorial.
 */
export const encartChantierVersModele = ({
  output,
}: {
  output: EncartChantierOutput;
}): { type: "text"; value: string } => {
  if (output.acces_refuse) {
    return {
      type: "text",
      value: "Accès refusé : l'utilisateur n'a pas accès à ce chantier.",
    };
  }
  if (!output.donnees) return { type: "text", value: output.markdown };

  return {
    type: "text",
    value: `${output.markdown}

---
Contexte pour les questions suivantes. L'encart ci-dessus est déjà affiché à l'utilisateur : ne le recopie pas. Pour une donnée hors de cette couverture, appelle l'outil correspondant sur ce périmètre.
Couverture : ${JSON.stringify(couvertureEncartChantier({ jalon: output.jalon, donnees: output.donnees }))}
Données de l'encart : ${JSON.stringify(donneesChantierPourLeSousAgent(output.donnees))}`,
  };
};
