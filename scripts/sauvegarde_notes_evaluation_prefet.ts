import logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";

async function sauvegardeNotes() {
  const listeChantiers = ["CH-076", "CH-103", "CH-067"];

  const chantiers = await prisma.chantier_territoire_jalon.findMany({
    where: {
      id: { in: listeChantiers },
      jalon: 2025,
    },
    select: {
      id: true,
      territoire_code: true,
      maille: true,
      code_insee: true,
      taux_avancement_eval: true,
      zone_id: true,
    },
  });

  const indicateurs = await prisma.indicateur_territoire_jalon.findMany({
    where: {
      indicateur_territoire: {
        chantier_id: { in: listeChantiers },
        ponderation_zone_reel_eval: { not: null, gt: 0 },
      },
      jalon: 2025,
    },
    select: {
      id: true,
      territoire_code: true,
      maille: true,
      code_insee: true,
      taux_avancement: true,
      zone_id: true,
      indicateur_territoire: {
        select: {
          chantier_id: true,
          ponderation_zone_declaree_eval: true,
          ponderation_zone_reel_eval: true,
        },
      },
    },
  });

  await prisma.chantier_evaluation.createMany({
    data: chantiers.map((chantier) => ({
      id: chantier.id,
      territoire_code: chantier.territoire_code,
      maille: chantier.maille,
      code_insee: chantier.code_insee,
      taux_avancement: chantier.taux_avancement_eval,
      zone_id: chantier.zone_id,
      date_calcul: new Date(),
      jalon: 2025,
    })),
  });

  await prisma.indicateur_evaluation.createMany({
    data: indicateurs.map((indicateur) => ({
      id: indicateur.id,
      chantier_id: indicateur.indicateur_territoire.chantier_id,
      territoire_code: indicateur.territoire_code,
      maille: indicateur.maille,
      code_insee: indicateur.code_insee,
      taux_avancement: indicateur.taux_avancement,
      zone_id: indicateur.zone_id,
      ponderation_declaree:
        indicateur.indicateur_territoire.ponderation_zone_declaree_eval!,
      ponderation_reelle:
        indicateur.indicateur_territoire.ponderation_zone_reel_eval!,
      date_calcul: new Date(),
      jalon: 2025,
    })),
  });
}

sauvegardeNotes()
  .then(() => {
    logger.info("Script exécuté avec succès");
  })
  .catch((error) => {
    logger.error("Échec du script :", error);
    throw error;
  });
