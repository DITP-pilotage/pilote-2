import { gestion_contenu as GestionContenuModel, PrismaClient } from '@prisma/client';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';
import { VARIABLE_CONTENU_DISPONIBLE } from '@/server/gestion-contenu/domain/VariableContenuDisponible';

const convertirEnModel = ({ nomVariableContenu, valeurVariableContenu }: {
  nomVariableContenu: string,
  valeurVariableContenu: string | boolean
}): GestionContenuModel => {
  return {
    nom_variable_contenu: nomVariableContenu,
    valeur_variable_contenu: String(valeurVariableContenu),
  };
};

const convertirEnVariableContenu = (listeGestionContenuModel: GestionContenuModel[]): Partial<VARIABLE_CONTENU_DISPONIBLE> => {
  return listeGestionContenuModel.reduce((acc, { nom_variable_contenu, valeur_variable_contenu }) => {
    return {
      [nom_variable_contenu as keyof VARIABLE_CONTENU_DISPONIBLE]: valeur_variable_contenu === 'true' || valeur_variable_contenu === 'false' ? valeur_variable_contenu === 'true' : valeur_variable_contenu,
      ...acc,
    };
  }, {} as Partial<VARIABLE_CONTENU_DISPONIBLE>);
};

export class PrismaGestionContenuRepository implements GestionContenuRepository {
  constructor(private prismaClient: PrismaClient) {}
  
  async mettreAJourContenu<K extends keyof VARIABLE_CONTENU_DISPONIBLE>(nomVariableContenu: K, valeurVariableContenu: VARIABLE_CONTENU_DISPONIBLE[K]): Promise<void> {
    const gestionContenuModel = convertirEnModel({ nomVariableContenu, valeurVariableContenu });
    await this.prismaClient.gestion_contenu.upsert({
      where: {
        nom_variable_contenu: gestionContenuModel.nom_variable_contenu,
      },
      update: gestionContenuModel,
      create: gestionContenuModel,
    });
  }

  async recupererMapVariableContenuParListeDeNom(listeNomVariableContenu: (keyof VARIABLE_CONTENU_DISPONIBLE)[]): Promise<Partial<VARIABLE_CONTENU_DISPONIBLE>> {
    const result = await this.prismaClient.gestion_contenu.findMany({
      where: {
        nom_variable_contenu: {
          in: listeNomVariableContenu,
        },
      },
    });

    return convertirEnVariableContenu(result);
  }
}
