import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { VARIABLE_DISPONIBLE } from '@/server/gestion-contenu/domain/VARIABLE_DISPONIBLE';
import {
  PrismaGestionContenuRepository,
} from '@/server/gestion-contenu/infrastructure/adapters/PrismaGestionContenuRepository';

describe('PrismaGestionContenuRepository', () => {
  let prismaGestionContenuRepository: PrismaGestionContenuRepository;
  it('quand la valeur est un string, doit mettre à jour variable de contenu', async () => {
    // Given
    const nomVariableContenu : keyof VARIABLE_DISPONIBLE = 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE';
    const valeurVariableContenu = 'ma valeur';
    // When
    await prismaGestionContenuRepository.mettreAJourContenu(nomVariableContenu, valeurVariableContenu);
    // Then
    const result = await prisma.gestion_contenu.findUnique({
      where: {
        nom_variable_contenu: 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE',
      },
    });
    
    expect(result?.valeur_variable_contenu).toEqual('ma valeur');
  });
  it('quand la valeur est un boolean, doit mettre à jour variable de contenu', async () => {
    // Given
    const nomVariableContenu : keyof VARIABLE_DISPONIBLE = 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE';
    const valeurVariableContenu = true;
    // When
    await prismaGestionContenuRepository.mettreAJourContenu(nomVariableContenu, valeurVariableContenu);
    // Then
    const result = await prisma.gestion_contenu.findUnique({
      where: {
        nom_variable_contenu: 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE',
      },
    });

    expect(result?.valeur_variable_contenu).toEqual('true');
  });
});
