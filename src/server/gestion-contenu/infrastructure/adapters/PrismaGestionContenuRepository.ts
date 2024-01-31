import { gestion_contenu as GestionContenuModel } from '.prisma/client';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';
import { VARIABLE_DISPONIBLE } from '@/server/gestion-contenu/domain/VARIABLE_DISPONIBLE';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

const convertirEnModel = ({ nomVariableContenu, valeurVariableContenu }: {
  nomVariableContenu: string,
  valeurVariableContenu: string | boolean
}): GestionContenuModel => {
  return {
    nom_variable_contenu: nomVariableContenu,
    valeur_variable_contenu: String(valeurVariableContenu),
  };
};

export class PrismaGestionContenuRepository implements GestionContenuRepository {
  async mettreAJourContenu<K extends keyof VARIABLE_DISPONIBLE>(nomVariableContenu: K, valeurVariableContenu: VARIABLE_DISPONIBLE[K]): Promise<void> {
    const gestionContenuModel = convertirEnModel({ nomVariableContenu, valeurVariableContenu });
    await prisma.gestion_contenu.upsert({
      where: {
        nom_variable_contenu: gestionContenuModel.nom_variable_contenu,
      },
      update: gestionContenuModel,
      create: gestionContenuModel,
    });
  }
}
