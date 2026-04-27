import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { prisma } from "@/server/db/prisma";
import logger from "@/server/infrastructure/Logger";
import seedsUtilisateursTest from "@/server/seeds/utilisateursTest.json";
import { configuration } from "@/config";

const ENVIRONNEMENTS_AUTORISES = ["PREPROD", "DEV"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const environnement = configuration().scalingoEnvironment;
  if (!ENVIRONNEMENTS_AUTORISES.includes(environnement)) {
    return res.status(403).json({
      error: `Route non disponible en environnement ${environnement}`,
    });
  }

  const auteurImport = await prisma.utilisateur.findFirst({
    where: { email: "import.csv@modernisation.gouv.fr" },
  });

  const resultats: string[] = [];

  for (const utilisateur of seedsUtilisateursTest) {
    await prisma.$transaction(async (tx) => {
      const utilisateurCree = await tx.utilisateur.upsert({
        where: { email: utilisateur.email },
        create: {
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          profilCode: utilisateur.profilCode,
          date_creation: new Date(),
          date_modification: new Date(),
          date_visualisation_video_accueil: new Date(),
          date_inscription_infolettre: new Date(),
          auteur_id_creation: auteurImport?.id,
          auteur_id_modification: auteurImport?.id,
        },
        update: {
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          profilCode: utilisateur.profilCode,
          date_modification: new Date(),
          auteur_id_modification: auteurImport?.id,
        },
      });

      for (const habilitation of utilisateur.habilitations) {
        await tx.habilitation.upsert({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: utilisateurCree.id,
              scopeCode: habilitation.scopeCode,
            },
          },
          create: {
            utilisateurId: utilisateurCree.id,
            scopeCode: habilitation.scopeCode,
            territoires: habilitation.territoires,
            perimetres: habilitation.perimetres,
            chantiers: habilitation.chantiers,
          },
          update: {
            territoires: habilitation.territoires,
            perimetres: habilitation.perimetres,
            chantiers: habilitation.chantiers,
          },
        });
      }

      resultats.push(utilisateur.email);
      logger.info(
        {
          categorie: "utilisateur",
          source: "seed-utilisateurs-test",
          email: utilisateur.email,
        },
        "Utilisateur et ses habilitations créés avec succès",
      );
    });
  }

  logger.info(
    {
      categorie: "utilisateur",
      source: "seed-utilisateurs-test",
      count: resultats.length,
    },
    "Initialisation des utilisateurs de tests terminée avec succès",
  );

  return res.status(200).json({ utilisateursCrees: resultats });
}

export default onlyCron(handler);
