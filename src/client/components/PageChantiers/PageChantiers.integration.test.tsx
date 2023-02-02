/*eslint-disable sonarjs/no-duplicate-string*/
import { getAllByRole, getByText, queryByText, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ChantierFixture from '@/fixtures/ChantierFixture';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PageChantiers from './PageChantiers';

// eslint-disable-next-line unicorn/consistent-function-scoping
jest.mock('@/components/_commons/Cartographie/Cartographie.tsx', () => function Cartographie() { return 'Carto'; });

class PageChantiersTest {
  // TODO temporaire en attendant la fixture
  ministères = [
    {
      nom: 'Agriculture et Alimentation',
      périmètresMinistériels: [
        { id: 'PER-001', nom: 'Agriculture' },
        { id: 'PER-002', nom: 'Alimentation' },
      ],
    },
    {
      nom: 'Cohésion des territoires et relations avec les collectivités territoriales',
      périmètresMinistériels: [
        { id: 'PER-003', nom: 'Cohésion des territoires, ville' },
        { id: 'PER-004', nom: 'Aménagement du territoire' },
        { id: 'PER-005', nom: 'Logement' },
      ],
    },
  ];

  chantiers = ChantierFixture.générerPlusieurs(3, [
    { périmètreIds: [this.ministères[0].périmètresMinistériels[0].id] },
    { périmètreIds: [this.ministères[0].périmètresMinistériels[0].id] },
    { périmètreIds: [this.ministères[0].périmètresMinistériels[1].id] },
  ]);

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }

  async basculerEtatDuFiltrePérimètreMinistériel(nomDuPérimètreMinistériel: string) {
    const filtresMinistères = screen.getByRole('list', { name : 'Liste des filtres Ministères' });
    const boutonFiltrePérimètre = within(filtresMinistères).getByText(nomDuPérimètreMinistériel);
    await userEvent.click(boutonFiltrePérimètre);
  }

  async supprimerTag(nomDuPérimètreMinistériel: string) {
    if (!this.estAffichéFiltresActifs())
      return;
    const liste = screen.getByRole('list', { name : 'liste des tags des filtres actifs' });
    const tag = within(liste).getByText(nomDuPérimètreMinistériel);
    const button = within(tag).getByRole('button');
    await userEvent.click(button);
  }

  async réinitialiserLesFiltres() {
    if (!this.estAffichéFiltresActifs())
      return;
    const button = screen.getByText('Réinitialiser les filtres');
    await userEvent.click(button);
  }

  estAffichéFiltresActifs() {
    return !!screen.queryByRole('list', { name : 'liste des tags des filtres actifs' });
  }

  render() {
    render(
      <PageChantiers
        chantiers={this.chantiers}
        ministères={this.ministères}
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
    filtrePérimètreMinistériel = pageChantiers.ministères[0].périmètresMinistériels[0];
  });

  test('le tag correspondant au filtre est affiché', async () => {
    await pageChantiers.réinitialiserLesFiltres();
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom);
    const listeFiltresActifs = screen.getByRole('list', {  name : 'liste des tags des filtres actifs' });
    expect(getByText(listeFiltresActifs, filtrePérimètreMinistériel.nom)).toBeInTheDocument();
  });

  test('les chantiers affichés dans le tableau sont correctement filtrés', async () => {
    await pageChantiers.réinitialiserLesFiltres();
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom);
    const tableauLignes = pageChantiers.récupérerLesLignesDuTableau();
    expect(tableauLignes.length).toEqual(2);
    expect(tableauLignes[0]).toHaveTextContent(pageChantiers.chantiers[0].nom);
    expect(tableauLignes[1]).toHaveTextContent(pageChantiers.chantiers[1].nom);
  });
});

describe('quand je retire un filtre via le tag',  () => {
  test('la checkbox correspondant au filtre n\'est plus surlignée', async () =>{
    const filtrePérimètreMinistériel = pageChantiers.ministères[0].périmètresMinistériels[0];
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom);
    await pageChantiers.supprimerTag(filtrePérimètreMinistériel.nom);

    const choixFiltres = screen.getByRole('list', { name : 'Liste des filtres Ministères' });
    const boutonFiltrePérimètre = getByText(choixFiltres, filtrePérimètreMinistériel.nom);
    expect(boutonFiltrePérimètre).not.toHaveClass('surligné');
  });
});

describe('quand je retire un des filtres via les cases à cocher', () => {
  test('le tag correspondant à ce filtre est supprimé', async () => {
    const filtrePérimètreMinistériel1 = pageChantiers.ministères[0].périmètresMinistériels[0];
    const filtrePérimètreMinistériel2 = pageChantiers.ministères[0].périmètresMinistériels[1];
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel1.nom);
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom);
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom);

    const listeFiltresActifs = screen.getByRole('list', {  name : 'liste des tags des filtres actifs' });
    expect(queryByText(listeFiltresActifs, filtrePérimètreMinistériel2.nom)).toBeNull();
  });
});

describe('quand je clic sur le bouton de réinitisalisation de filtre', () => {
  test('les filtres se désactivent', async () => {
    const filtrePérimètreMinistériel1 = pageChantiers.ministères[0].périmètresMinistériels[0];
    const filtrePérimètreMinistériel2 = pageChantiers.ministères[0].périmètresMinistériels[1];
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel1.nom);
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom);

    await pageChantiers.réinitialiserLesFiltres();

    expect(pageChantiers.estAffichéFiltresActifs()).toBe(false);
  });
});
