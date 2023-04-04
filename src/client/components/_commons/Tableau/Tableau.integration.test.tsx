import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createColumnHelper } from '@tanstack/react-table';
import Tableau from './Tableau';

const columnHelper = createColumnHelper<{}>();

class TableauTest {
  private données = [
    {
      nom: 'Déployer le programme FR',
      id: 1,
    },
    {
      nom: 'Lutter contre la fraude fiscale',
      id: 2,
    },
    {
      nom: 'Elections du maire',
      id: 3,
    },
  ];

  private colonnes = [
    columnHelper.accessor('id', {
      header: '#',
      id: 'numéro',
      cell: id => '#' + id.getValue(),
    }),
    columnHelper.accessor('nom', {
      header: 'Nom du chantier',
      id: 'nom',
      cell: nomChantier => nomChantier.getValue(),
    }),
  ];

  nombreDeDonnées() {
    return this.données.length;
  }

  async filtrerParContenuTextuel(texte: string) {
    await userEvent.type(screen.getByRole('textbox'), texte);
  }

  récupérerLeNombreDeLignesDuTableau() {
    return this.récupérerLesLignesDuTableau().length;
  }

  récupérerUneLigneDuTableau(numéroDeLigne: number) {
    return this.récupérerLesLignesDuTableau()[numéroDeLigne - 1];
  }

  async trierSurLaColonne(labelDuBoutonDeTri: string) {  
    await userEvent.click(screen.getByLabelText(labelDuBoutonDeTri));
  }

  render() {
    render(
      <Tableau
        colonnes={this.colonnes}
        données={this.données}
        titre="Liste des données"
      />,
    );
  }

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }
}

let tableau: TableauTest;

beforeEach(() => {
  // GIVEN
  tableau = new TableauTest();

  // WHEN
  tableau.render();
});

test('le tableau comporte le nombre de lignes adéquat', () => {
  // THEN
  expect(tableau.récupérerLeNombreDeLignesDuTableau()).toBe(tableau.nombreDeDonnées());
});

test('le tableau comporte les données d\'entrée', () => {
  // THEN
  expect(screen.getByText('#1')).toBeInTheDocument();
  expect(screen.getByText('Déployer le programme FR')).toBeInTheDocument();
});

describe("quand l'utilisateur clique sur le bouton de tri croissant d'une colonne", () => {
  test('les éléments du tableau sont triés par ordre croissant', async () => {
    // WHEN
    await tableau.trierSurLaColonne('trier la colonne "nom" par ordre croissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('Déployer');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('Election');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('Lutter');
  });
});

describe("quand l'utilisateur clique sur le bouton de tri décroissant d'une colonne", () => {
  test('les éléments du tableau sont triés par ordre décroissant', async () => {
    // WHEN
    await tableau.trierSurLaColonne('trier la colonne "nom" par ordre décroissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('Lutter');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('Election');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('Déployer');
  });
});
