import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { fixtures } from "@/test/fixtures";
import type { TypeContenuChantier } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireRef } from "../../seeds";
import { TERRITOIRES } from "../territoires";

const CHANTIER_ID = "CH-005";

// Même date de saisie que le monde territorial : une date du jour rendrait les
// réponses différentes d'un run à l'autre.
const DATE_SAISIE = new Date("2026-09-15T10:00:00Z");

type Meteo = "COUVERT" | "NUAGE";

/** Le niveau de confiance du chantier : sur le chantier territorial, que lit la vue « en difficulté », et sur sa synthèse. */
async function avecNiveauDeConfiance({
  territoire,
  meteo,
}: {
  territoire: TerritoireRef;
  meteo: Meteo;
}) {
  const where = {
    chantier_id: CHANTIER_ID,
    territoire_code: territoire.territoire_code,
  };
  await getPrisma().chantier_territoire.updateMany({
    where: { id: CHANTIER_ID, territoire_code: territoire.territoire_code },
    data: { meteo },
  });
  await getPrisma().synthese_des_resultats.updateMany({
    where,
    data: { meteo },
  });
}

async function sansSynthese({ territoire }: { territoire: TerritoireRef }) {
  await getPrisma().synthese_des_resultats.deleteMany({
    where: {
      chantier_id: CHANTIER_ID,
      territoire_code: territoire.territoire_code,
    },
  });
}

async function avecSyntheseDuTerritoire({
  territoire,
  commentaire,
}: {
  territoire: TerritoireRef;
  commentaire: string;
}) {
  await getPrisma().synthese_des_resultats.updateMany({
    where: {
      chantier_id: CHANTIER_ID,
      territoire_code: territoire.territoire_code,
    },
    data: { commentaire },
  });
}

async function avecCommentaire({
  territoire,
  type,
  contenu,
  authorId,
}: {
  territoire: TerritoireRef;
  type: TypeContenuChantier;
  contenu: string;
  authorId: string;
}) {
  await fixtures.commentaire({
    chantier_id: CHANTIER_ID,
    territoire_code: territoire.territoire_code,
    maille: territoire.maille,
    code_insee: territoire.code_insee,
    type,
    contenu,
    auteur_creation_id: authorId,
    auteur_modification_id: authorId,
    date_creation: DATE_SAISIE,
    date_modification: DATE_SAISIE,
  });
}

/**
 * Les départements bretons de CH-005 pour « synthèse des commentaires par
 * département » : des commentaires typés que la synthèse des résultats ne dit
 * pas, et des départements en difficulté sans synthèse.
 *
 * - Côtes-d'Armor : n'est plus en difficulté ; son commentaire sur la
 *   régulation ne doit pas apparaître dans la réponse.
 * - Finistère : synthèse propre, et deux commentaires typés.
 * - Ille-et-Vilaine : aucune synthèse (le cas de la recette), deux commentaires
 *   typés.
 * - Morbihan : aucune synthèse, aucun commentaire.
 *
 * Les fermetures de nuit des urgences sont le sujet commun du Finistère et de
 * l'Ille-et-Vilaine ; la maison médicale de garde et les recrutements de
 * médecins régulateurs ne concernent qu'un département chacun.
 *
 * À appeler après `seedMondeTerritorial`, qui crée les lignes retouchées ici.
 */
export async function seedCommentairesDepartementsBretons() {
  const { cotesDArmor, finistere, illeEtVilaine, morbihan } = TERRITOIRES;
  const auteur = await getPrisma().utilisateur.findFirstOrThrow({
    select: { id: true },
  });
  const authorId = auteur.id;

  await avecNiveauDeConfiance({ territoire: cotesDArmor, meteo: "COUVERT" });
  await avecCommentaire({
    territoire: cotesDArmor,
    type: "commentaires_sur_les_donnees",
    contenu:
      "<p>La régulation téléphonique est généralisée dans le département depuis le printemps ; les appels sont désormais orientés avant l'arrivée aux urgences.</p>",
    authorId,
  });

  await avecNiveauDeConfiance({ territoire: finistere, meteo: "NUAGE" });
  await avecSyntheseDuTerritoire({
    territoire: finistere,
    commentaire:
      "Le Finistère reste fragile : les urgences du centre du département fonctionnent avec des équipes réduites et plusieurs services restent sans médecin la nuit.",
  });
  await avecCommentaire({
    territoire: finistere,
    type: "commentaires_sur_les_donnees",
    contenu:
      "<p>Les urgences de Carhaix ferment la nuit depuis le début de l'été, faute de médecins. Les patients sont orientés vers Quimper ou Brest.</p>",
    authorId,
  });
  await avecCommentaire({
    territoire: finistere,
    type: "autres_resultats_obtenus",
    contenu:
      "<p>Une maison médicale de garde a ouvert à Quimperlé pour absorber les consultations de soirée.</p>",
    authorId,
  });

  await avecNiveauDeConfiance({ territoire: illeEtVilaine, meteo: "NUAGE" });
  await sansSynthese({ territoire: illeEtVilaine });
  await avecCommentaire({
    territoire: illeEtVilaine,
    type: "commentaires_sur_les_donnees",
    contenu:
      "<p>Les urgences de Redon ferment la nuit en alternance depuis septembre, ce qui reporte l'accueil sur Vannes et Rennes.</p>",
    authorId,
  });
  await avecCommentaire({
    territoire: illeEtVilaine,
    type: "autres_resultats_obtenus",
    contenu:
      "<p>Trois médecins régulateurs ont été recrutés par contrat de territoire pour renforcer la régulation.</p>",
    authorId,
  });

  await avecNiveauDeConfiance({ territoire: morbihan, meteo: "NUAGE" });
  await sansSynthese({ territoire: morbihan });
}
