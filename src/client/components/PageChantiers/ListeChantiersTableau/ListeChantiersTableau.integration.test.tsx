import '@testing-library/jest-dom';
import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListeChantiersTableau from './ListeChantiersTableau';

// eslint-disable-next-line unicorn/prefer-module
jest.mock('next/router', () => require('next-router-mock'));

class ListeChantiersTableauTest {
  private données = [
    {
      porteur: 'Ministère 1',
      nom: 'Déployer le programme FR',
      id: '1',
      avancement: 97,
      météo: 'COUVERT' as const,
      estBaromètre: false,
    },
    {
      porteur: 'Ministère 1',
      nom: 'Lutter contre la fraude fiscale',
      id: '2',
      avancement: 98,
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

  nombreDeDonnées() {
    return this.données.length;
  }

  filtrerParContenuTextuel(texte: string) {
    return waitFor(() => userEvent.type(screen.getByRole('textbox'), texte));
  }

  récupérerLeNombreDeLignesDuTableau() {
    return this.récupérerLesLignesDuTableau().length;
  }

  récupérerUneLigneDuTableau(numéroDeLigne: number) {
    return this.récupérerLesLignesDuTableau()[numéroDeLigne - 1];
  }

  trierSurLaColonne(labelDuBoutonDeTri: string) {
    return waitFor(() => userEvent.click(screen.getByLabelText(labelDuBoutonDeTri)));
  }

  render() {
    waitFor(() => render(
      <ListeChantiersTableau
        données={this.données}
      />,
    ));
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
  expect(screen.getByText('Déployer le programme FR')).toBeInTheDocument();
  expect(screen.getByText('Lutter contre la fraude fiscale')).toBeInTheDocument();
  expect(screen.getByText('Elections du maire')).toBeInTheDocument();
});

describe("quand l'utilisateur clique sur le bouton de tri croissant d'une colonne", () => {
  test('les éléments du tableau sont triés par ordre croissant', async () => {
    // WHEN
    await tableau.trierSurLaColonne('trier la colonne Avancement par ordre croissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('97');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('98');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('99');
  });
});

describe("quand l'utilisateur clique sur le bouton de tri décroissant d'une colonne", () => {
  test('les éléments du tableau sont triés par ordre décroissant', async () => {
    // WHEN
    await tableau.trierSurLaColonne('trier la colonne Avancement par ordre décroissant');
    
    // THEN
    expect(tableau.récupérerUneLigneDuTableau(1)).toHaveTextContent('99');
    expect(tableau.récupérerUneLigneDuTableau(2)).toHaveTextContent('98');
    expect(tableau.récupérerUneLigneDuTableau(3)).toHaveTextContent('97');
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
