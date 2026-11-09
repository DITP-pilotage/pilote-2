import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { EMAIL_SANS_COMPTE, PERSONNES } from "../personnes";
import { seedPersonne } from "../world";
import { TERRITOIRES } from "./territoires";

/**
 * Les personnes du monde territorial (PIL-1860), sur des lignes que
 * `seedMondeTerritorial` vient de semer : chaque rôle qu'un outil renvoie a
 * au moins une personne, sur CH-005, que les scénarios lisent déjà.
 *
 * - CH-005 : deux directeurs de projet ; en Bretagne, un responsable local,
 *   une coordinatrice, une synthèse écrite par une personne et modifiée par
 *   une autre, un commentaire écrit par une troisième ;
 * - CH-005 en Pays de la Loire : un responsable local, hors du périmètre du
 *   coordinateur, qui ne doit jamais le voir ;
 * - IND-005 : un responsable des données avec un compte, un sans compte ;
 * - CH-006 : aucun directeur de projet, une absence à dire.
 */
export async function seedPersonnes() {
  const prisma = getPrisma();
  const { bretagne, paysDeLaLoire } = TERRITOIRES;

  for (const personne of [
    PERSONNES.directriceUrgences,
    PERSONNES.directeurUrgences,
    PERSONNES.responsableLocalBretagne,
    PERSONNES.coordinatriceTerritorialeBretagne,
    PERSONNES.auteurSynthese,
    PERSONNES.modificatriceSynthese,
    PERSONNES.auteurCommentaire,
    PERSONNES.responsableDonnees,
    PERSONNES.responsableLocalPaysDeLaLoire,
  ]) {
    await seedPersonne({ personne });
  }

  await prisma.chantier_identite.update({
    where: { id: "CH-005" },
    data: {
      directeurs_projet_ids: [
        PERSONNES.directriceUrgences.id,
        PERSONNES.directeurUrgences.id,
      ],
    },
  });

  await prisma.chantier_territoire.updateMany({
    where: { id: "CH-005", territoire_code: bretagne.territoire_code },
    data: {
      responsables_locaux_ids: [PERSONNES.responsableLocalBretagne.id],
      coordinateurs_territoriaux_ids: [
        PERSONNES.coordinatriceTerritorialeBretagne.id,
      ],
    },
  });

  await prisma.chantier_territoire.updateMany({
    where: { id: "CH-005", territoire_code: paysDeLaLoire.territoire_code },
    data: {
      responsables_locaux_ids: [PERSONNES.responsableLocalPaysDeLaLoire.id],
    },
  });

  await prisma.synthese_des_resultats.updateMany({
    where: { chantier_id: "CH-005", territoire_code: bretagne.territoire_code },
    data: {
      auteur_creation_id: PERSONNES.auteurSynthese.id,
      auteur_modification_id: PERSONNES.modificatriceSynthese.id,
    },
  });

  await prisma.commentaire.updateMany({
    where: {
      chantier_id: "CH-005",
      territoire_code: bretagne.territoire_code,
      type: "autres_resultats_obtenus",
    },
    data: {
      auteur_creation_id: PERSONNES.auteurCommentaire.id,
      auteur_modification_id: PERSONNES.auteurCommentaire.id,
    },
  });

  await prisma.indicateur_identite.update({
    where: { id: "IND-005" },
    data: {
      responsables_donnees_mails: [
        PERSONNES.responsableDonnees.email,
        EMAIL_SANS_COMPTE,
      ],
    },
  });
}
