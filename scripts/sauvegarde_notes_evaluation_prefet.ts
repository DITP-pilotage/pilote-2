import logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";

async function sauvegardeNotes() {
  const LISTE_CHANTIERS_INCLUS_FICHE_EVALUATION = [
    "CH-004",
    "CH-006",
    "CH-038",
    "CH-042",
    "CH-050",
    "CH-054",
    "CH-061",
    "CH-062",
    "CH-064",
    "CH-067",
    "CH-069",
    "CH-070",
    "CH-073",
    "CH-078",
    "CH-082",
    "CH-107",
    "CH-111",
    "CH-114",
    "CH-116",
    "CH-120",
    "CH-129",
    "CH-121",
    "CH-139",
    "CH-143",
    "CH-145",
    "CH-155",
    "CH-157",
    "CH-161",
    "CH-166",
    "CH-173",
    "CH-179",
    "CH-188",
  ];

  const rattachementsExistants = await prisma.fiche_evaluation.findMany({
    where: {
      jalon: 2025,
    },
    select: {
      rattachement_code: true,
      jalon: true,
    },
  });

  const rattachements = rattachementsExistants.map(
    (rattachement) => rattachement.rattachement_code,
  );

  const chantiers = await prisma.chantier_territoire_jalon.findMany({
    where: {
      id: { in: LISTE_CHANTIERS_INCLUS_FICHE_EVALUATION },
      territoire_code: { in: rattachements },
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
        chantier_id: { in: LISTE_CHANTIERS_INCLUS_FICHE_EVALUATION },
        ponderation_zone_reel_eval: { not: null, gt: 0 },
      },
      jalon: 2025,
      territoire_code: { in: rattachements },
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

  const dateCalcul = new Date();

  for (const chantier of chantiers) {
    await prisma.chantier_evaluation.upsert({
      where: {
        id_territoire_code_jalon_date_calcul: {
          id: chantier.id,
          territoire_code: chantier.territoire_code,
          jalon: 2025,
          date_calcul: dateCalcul,
        },
      },
      update: {
        maille: chantier.maille,
        code_insee: chantier.code_insee,
        taux_avancement: chantier.taux_avancement_eval,
        zone_id: chantier.zone_id,
        jalon: 2025,
      },
      create: {
        id: chantier.id,
        territoire_code: chantier.territoire_code,
        maille: chantier.maille,
        code_insee: chantier.code_insee,
        taux_avancement: chantier.taux_avancement_eval,
        zone_id: chantier.zone_id,
        date_calcul: dateCalcul,
        jalon: 2025,
      },
    });
  }

  for (const indicateur of indicateurs) {
    await prisma.indicateur_evaluation.upsert({
      where: {
        id_territoire_code_date_calcul: {
          id: indicateur.id,
          territoire_code: indicateur.territoire_code,
          date_calcul: dateCalcul,
        },
      },
      update: {
        chantier_id: indicateur.indicateur_territoire.chantier_id,
        maille: indicateur.maille,
        code_insee: indicateur.code_insee,
        taux_avancement: indicateur.taux_avancement,
        zone_id: indicateur.zone_id,
        ponderation_declaree:
          indicateur.indicateur_territoire.ponderation_zone_declaree_eval!,
        ponderation_reelle:
          indicateur.indicateur_territoire.ponderation_zone_reel_eval!,
        jalon: 2025,
      },
      create: {
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
        date_calcul: dateCalcul,
        jalon: 2025,
      },
    });
  }
}

sauvegardeNotes()
  .then(() => {
    logger.info("Script exécuté avec succès");
  })
  .catch((error) => {
    logger.error("Échec du script :", error);
    throw error;
  });
