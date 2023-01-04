/*eslint-disable sonarjs/no-duplicate-string*/
import { getAllByRole, getByLabelText, getByText, queryByText, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ChantierInfosFixture from '@/fixtures/ChantierInfoFixture';
import PérimètreMinistérielFixture from '@/fixtures/PérimètreMinistérielFixture';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PageChantiers from './PageChantiers';

// eslint-disable-next-line unicorn/consistent-function-scoping
jest.mock('@/components/_commons/Cartographie/Cartographie.tsx', () => function Cartographie() { return 'Carto'; });

class PageChantiersTest {
  périmètresMinistériels = PérimètreMinistérielFixture.générerPlusieurs(2);

  chantiers = ChantierInfosFixture.générerPlusieurs(3, [
    { périmètreIds: [this.périmètresMinistériels[0].id] },
    { périmètreIds: [this.périmètresMinistériels[0].id] },
    { périmètreIds: [this.périmètresMinistériels[1].id] },
  ]);

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }

  async affecterEtatDuFiltrePérimètreMinistériel(nomDuPérimètreMinistériel: string, état: boolean) {
    const caseÀCocherDuFiltre = screen.getByLabelText(nomDuPérimètreMinistériel, { selector: 'input' }) as HTMLInputElement;
    const étatCaseÀCocherDuFiltre = caseÀCocherDuFiltre.checked;
    if (état !== étatCaseÀCocherDuFiltre) {
      await userEvent.click(caseÀCocherDuFiltre);
    }
  }

  async supprimerTag(nomDuPérimètreMinistériel: string) {
    const liste = screen.getByRole('list', {  name : 'liste des tags des filtres actifs' });
    const tag = getByText(liste, nomDuPérimètreMinistériel);
    const button = within(tag).getByRole('button');
    await userEvent.click(button);
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

  test('la zone de filtre ne s\'affiche pas', async () =>{
    expect(screen.queryByRole('list', {  name : 'liste des tags des filtres actifs' })).toBeNull();
  });
});

describe('quand on sélectionne un filtre', () => {

  let filtrePérimètreMinistériel: PérimètreMinistériel;

  beforeEach(async () => {
    filtrePérimètreMinistériel = pageChantiers.périmètresMinistériels[0];
    await pageChantiers.affecterEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom, true);
  });

  test('le tag correspondant au filtre est affiché', async () =>{
    const listeFiltresActifs = screen.getByRole('list', {  name : 'liste des tags des filtres actifs' });
    expect(getByText(listeFiltresActifs, filtrePérimètreMinistériel.nom)).toBeInTheDocument();
  });

  test('les chantiers affichés dans le tableau sont correctement filtrés', async () => {
    const tableauLignes = pageChantiers.récupérerLesLignesDuTableau();
    expect(tableauLignes.length).toEqual(2);
    expect(tableauLignes[0]).toHaveTextContent(pageChantiers.chantiers[0].nom);
    expect(tableauLignes[1]).toHaveTextContent(pageChantiers.chantiers[1].nom);
  });
});

describe('quand je retire un filtre via le tag',  () => {
  test('la checkbox correspondant au filtre n\'est plus cochée', async () =>{
    const filtrePérimètreMinistériel = pageChantiers.périmètresMinistériels[0];
    await pageChantiers.affecterEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom, true);
    await pageChantiers.supprimerTag(filtrePérimètreMinistériel.nom);

    const choixFiltres = screen.getByRole('list', { name : 'Liste des filtres périmètresMinistériels' });
    const caseÀCocherDuFiltre = getByLabelText(choixFiltres, filtrePérimètreMinistériel.nom);
    expect(caseÀCocherDuFiltre).not.toBeChecked();
  });
});

describe('quand je retire un des filtres via les cases à cocher', () => {
  test('le tag correspondant à ce filtre est supprimé', async () => {
    const filtrePérimètreMinistériel1 = pageChantiers.périmètresMinistériels[0];
    const filtrePérimètreMinistériel2 = pageChantiers.périmètresMinistériels[1];
    await pageChantiers.affecterEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel1.nom, true);
    await pageChantiers.affecterEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom, true);
    await pageChantiers.affecterEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom, false);

    const listeFiltresActifs = screen.getByRole('list', {  name : 'liste des tags des filtres actifs' });
    expect(queryByText(listeFiltresActifs, filtrePérimètreMinistériel2.nom)).toBeNull();
  });
});



