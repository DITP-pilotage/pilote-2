import logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";
import seedsUtilisateursTest from "@/server/seeds/utilisateursTest.json";

async function seedUsers() {
  const auteurImport = await prisma.utilisateur.findFirst({
    where: {
      email: "import.csv@modernisation.gouv.fr",
    },
  });

  try {
    for (const utilisateur of seedsUtilisateursTest) {
      await prisma.$transaction(async (tx) => {
        const utilisateurCree = await tx.utilisateur.create({
          data: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profilCode: utilisateur.profilCode,
            date_creation: new Date(),
            date_modification: new Date(),
            auteur_id_creation: auteurImport?.id,
            auteur_id_modification: auteurImport?.id,
          },
        });

        for (const habilitation of utilisateur.habilitations) {
          await tx.habilitation.create({
            data: {
              utilisateurId: utilisateurCree.id,
              scopeCode: habilitation.scopeCode,
              territoires: habilitation.territoires,
              perimetres: habilitation.perimetres,
              chantiers: habilitation.chantiers,
            },
          });
        }

        logger.info(
          `Utilisateur et ses habilitations créés avec succès : ${utilisateur.email}`,
        );
      });
    }

    logger.info(
      "Initialisation des utilisateurs de tests terminée avec succès !",
    );
  } catch (error) {
    logger.error(
      "Erreur lors de l'initialisation des utilisateurs de tests :",
      error,
    );
    throw error;
  }
}

seedUsers()
  .then(() => {
    logger.info("Script exécuté avec succès");
  })
  .catch((error) => {
    logger.error("Échec du script :", error);
    throw error;
  });
