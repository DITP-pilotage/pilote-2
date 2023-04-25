import { render, screen } from '@testing-library/react';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';

describe('ResultatValidationFichier', () => {
  it('quand le fichier est valide doit afficher que le fichier est correct', () => {
    // GIVEN
    const rapport: DetailValidationFichierContrat = {
      estValide: true,
      listeErreursValidation: [],
    };
    
    // WHEN
    render(
      <ResultatValidationFichier rapport={rapport} />,
    );

    // THEN
    expect(screen.getByText('Le fichier est valide')).toBeInTheDocument();
  });

  it("quand le fichier contient des erreurs, doit afficher que le tableau d'erreur", () => {
    // GIVEN
    const rapport: DetailValidationFichierContrat = {
      estValide: false,
      listeErreursValidation: [
        {
          cellule: 'cellule 1',
          nom: 'nom 1',
          message: 'Message erreur 1',
          numeroDeLigne: 1,
          positionDeLigne: 1,
          nomDuChamp: 'Nom du champ 1',
          positionDuChamp: 1,
        },
        {
          cellule: 'cellule 2',
          nom: 'nom 2',
          message: 'Message erreur 2',
          numeroDeLigne: 2,
          positionDeLigne: 2,
          nomDuChamp: 'Nom du champ 2',
          positionDuChamp: 2,
        },
      ],
    };
    
    // WHEN
    render(
      <ResultatValidationFichier rapport={rapport} />,
    );

    // THEN
    expect(screen.getByText('Message erreur 1')).toBeInTheDocument();
    expect(screen.getByText('cellule 1')).toBeInTheDocument();
    expect(screen.getByText('Nom du champ 1')).toBeInTheDocument();

    expect(screen.getByText('Message erreur 2')).toBeInTheDocument();
    expect(screen.getByText('cellule 2')).toBeInTheDocument();
    expect(screen.getByText('Nom du champ 2')).toBeInTheDocument();
  });
});
