import { mock, MockProxy } from 'jest-mock-extended';
import { GestionContenuRepository } from '@/server/gestion-contenu/domain/ports/GestionContenuRepository';
import { ModifierMessageInformationUseCase } from '@/server/gestion-contenu/usecases/ModifierMessageInformationUseCase';

describe('ModifierMessageInformationUseCase', () => {
  let modifierMessageInformationUseCase: ModifierMessageInformationUseCase;
  let gestionContenuRepository: MockProxy<GestionContenuRepository>;

  beforeEach(() => {
    gestionContenuRepository = mock<GestionContenuRepository>();
    modifierMessageInformationUseCase = new ModifierMessageInformationUseCase({ gestionContenuRepository });
  });
  it("doit mettre à jour les différentes valeurs associés au message d'information", async () => {
    // Given
    const isBandeauActif = true;
    const bandeauTexte = 'nouveau texte';
    const bandeauType = 'WARNING';

    // When
    await modifierMessageInformationUseCase.run({
      isBandeauActif,
      bandeauTexte,
      bandeauType,
    });

    // Then
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenNthCalledWith(1, 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE', true);
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenNthCalledWith(1, 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE', 'nouveau texte');
    expect(gestionContenuRepository.mettreAJourContenu).toHaveBeenNthCalledWith(1, 'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE', 'WARNING');
  });
});
