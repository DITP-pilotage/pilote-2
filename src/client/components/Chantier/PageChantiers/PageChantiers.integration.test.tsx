import { getAllByRole, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ChantiersFixture from '@/fixtures/ChantiersFixture';
import PérimètresMinistérielsFixture from '@/fixtures/PérimètresMinistérielsFixture';
import PageChantiers from './PageChantiers';

class PageChantiersTest {

  périmètresMinistériels = PérimètresMinistérielsFixture.générerPlusieurs(2);

  chantiers = ChantiersFixture.générerPlusieurs(3, [
    { id_périmètre: this.périmètresMinistériels[0].id }, 
    { id_périmètre: this.périmètresMinistériels[0].id }, 
    { id_périmètre: this.périmètresMinistériels[1].id },
  ]);

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }

  async filtrerParPérimètreMinistériel(nomDuPérimètreMinistériel: string) {
    const caseÀCocherDuFiltre = screen.getByLabelText(nomDuPérimètreMinistériel);
    await userEvent.click(caseÀCocherDuFiltre);
  }

  render() {
    render(
      <PageChantiers
        chantiers={this.chantiers}
        périmètresMinistériels={this.périmètresMinistériels}
      />,     
    );
  }
}

let pageChantiers: PageChantiersTest;

beforeEach(() => {
  // GIVEN
  pageChantiers = new PageChantiersTest();
  pageChantiers.render();
});

describe('quand aucun filtre n\'est sélectionné', () => {
  test('tous les chantiers sont affichés', () => {
    // WHEN
    const tableauLignes = pageChantiers.récupérerLesLignesDuTableau();

    // THEN
    tableauLignes.forEach((ligne, index) => {
      expect(ligne).toHaveTextContent(pageChantiers.chantiers[index].nom);
    });
  });
});

describe('quand on sélectionne un filtre', () => {
  test('les chantiers affichés dans le tableau sont correctement filtrés', async () => {
    // WHEN
    const filtrePérimètreMinistériel = pageChantiers.périmètresMinistériels[0];
    await pageChantiers.filtrerParPérimètreMinistériel(filtrePérimètreMinistériel.nom);
    const tableauLignes = pageChantiers.récupérerLesLignesDuTableau();

    // THEN
    tableauLignes.forEach((ligne, index) => {
      expect(ligne).toHaveTextContent(pageChantiers.chantiers[index].nom);
    });
  });
});
