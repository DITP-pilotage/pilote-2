import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Tableau from './Tableau';
import { createColumnHelper } from '@tanstack/react-table';

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
      cell: id => '#' + id.getValue(),
    }),
    columnHelper.accessor('nom', {
      header: 'Nom du chantier',
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

  async trierSurLaColonne(labelDeLaColonne: string) {
    await userEvent.click(screen.getByRole('button', {
      name: new RegExp(labelDeLaColonne),
    }));
  }

  render() {
    render(
      <Tableau
        colonnes={this.colonnes}
        données={this.données}
        entité='chantiers'
        titre="Liste des données"
      />);
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

test('le tri par colonne réarrange l\'ordre des lignes', async () => {
  // WHEN
  await tableau.trierSurLaColonne('Nom du chantier');
  
  // THEN
  expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('Déployer');
  expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('Election');
  expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('Lutter');
});

test('la recherche applique un filtre sur les lignes', async () => {
  // WHEN
  await tableau.filtrerParContenuTextuel('fr');
  
  // THEN
  expect(tableau.récupérerLeNombreDeLignesDuTableau()).toBe(2);
  tableau.récupérerLesLignesDuTableau().forEach((ligne) => {
    expect(ligne).toHaveTextContent(/.*fr.*/i);
  });
});
