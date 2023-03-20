import '@testing-library/jest-dom';
import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumnHelper } from '@tanstack/react-table';
import ListeChantiersTableau from './ListeChantiersTableau';
import { DonnéesTableauChantiers } from './ListeChantiersTableau.interface';

// eslint-disable-next-line unicorn/prefer-module
jest.mock('next/router', () => require('next-router-mock'));

const columnHelper = createColumnHelper<DonnéesTableauChantiers>();

class ListeChantiersTableauTest {
  private données = [
    {
      porteur: 'Ministère 1',
      nom: 'Déployer le programme FR',
      id: '1',
      avancement: 99,
      météo: 'COUVERT' as const,
      estBaromètre: false,
    },
    {
      porteur: 'Ministère 1',
      nom: 'Lutter contre la fraude fiscale',
      id: '2',
      avancement: 99,
      météo: 'COUVERT' as const,
      estBaromètre: false,
    },
    {
      porteur: 'Ministère 2',
      nom: 'Elections du maire',
      id: '3',
      avancement: 99,
      météo: 'SOLEIL' as const,
      estBaromètre: false,
    },
  ];

  private colonnes = [
    columnHelper.accessor('porteur', {
      header: 'Porteur',
      cell: porteur => porteur.getValue(),
    }),
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

  async trierSurLaColonne(labelDuBoutonDeTri: string) {  
    await userEvent.click(screen.getByLabelText(labelDuBoutonDeTri));
  }

  render() {
    render(
      <ListeChantiersTableau
        colonnes={this.colonnes}
        données={this.données}
      />,
    );
  }

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }
}

let tableau: ListeChantiersTableauTest;

beforeEach(() => {
  // GIVEN
  tableau = new ListeChantiersTableauTest();

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
    await tableau.trierSurLaColonne('trier la colonne Nom du chantier par ordre croissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('Déployer');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('Election');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('Lutter');
  });
});

describe("quand l'utilisateur clique sur le bouton de tri décroissant d'une colonne", () => {
  test('les éléments du tableau sont triés par ordre décroissant', async () => {
    // WHEN
    await tableau.trierSurLaColonne('trier la colonne Nom du chantier par ordre décroissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('Lutter');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('Election');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('Déployer');
  });
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
