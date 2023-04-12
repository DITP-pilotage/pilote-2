/*eslint-disable sonarjs/no-duplicate-string*/
import { getAllByRole, getByText, queryByText, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import AxeBuilder from '@/server/domain/axe/Axe.builder';
import PpgBuilder from '@/server/domain/ppg/Ppg.builder';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import MinistèreBuilder from '@/server/domain/ministère/Ministère.builder';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import PageChantiers from './PageChantiers';

// eslint-disable-next-line unicorn/consistent-function-scoping
jest.mock('@/components/_commons/Cartographie/Cartographie.tsx', () => function Cartographie() { return 'Carto'; });
// eslint-disable-next-line unicorn/prefer-module
jest.mock('next/router', () => require('next-router-mock'));

class PageChantiersTest {
  axes: Axe[];

  ppg: Ppg[];

  ministères: Ministère[];

  chantiers: Chantier[];

  constructor() {
    this.axes = Array.from({ length: 6 }).map(() => new AxeBuilder().build());
    this.ppg = Array.from({ length: 40 }).map(() => new PpgBuilder().build());
    this.ministères = Array.from({ length: 2 }).map(() => new MinistèreBuilder().build());
    this.chantiers = [
      new ChantierBuilder()
        .avecPérimètreIds([this.ministères[0].périmètresMinistériels[0].id])
        .avecAxe(this.axes[0].nom)
        .avecPpg(this.ppg[0].nom)
        .build(),
      new ChantierBuilder()
        .avecPérimètreIds([this.ministères[0].périmètresMinistériels[0].id])
        .avecAxe(this.axes[1].nom)
        .avecPpg(this.ppg[1].nom)
        .build(),
      new ChantierBuilder()
        .avecPérimètreIds([this.ministères[1].périmètresMinistériels[0].id])
        .avecAxe(this.axes[2].nom)
        .avecPpg(this.ppg[0].nom)
        .build(),
    ];
  }

  récupérerLesLignesDuTableau() {
    const conteneur = document.querySelector('tbody');
    return getAllByRole(conteneur!, 'row');
  }

  async basculerEtatDuFiltrePérimètreMinistériel(nomDuPérimètreMinistériel: string) {
    const filtresMinistères = screen.getByRole('list', { name : 'Liste des filtres ministères' });
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
    waitFor(() => render(
      <PageChantiers
        axes={this.axes}
        chantiers={this.chantiers}
        ministères={this.ministères}
        ppg={this.ppg}
      />,
    ));
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
  test('la tuile correspondante au filtre n\'est plus activée', async () =>{
    const filtrePérimètreMinistériel = pageChantiers.ministères[0].périmètresMinistériels[0];
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel.nom);
    await pageChantiers.supprimerTag(filtrePérimètreMinistériel.nom);

    const choixFiltres = screen.getByRole('list', { name : 'Liste des filtres ministères' });
    const boutonFiltrePérimètre = getByText(choixFiltres, filtrePérimètreMinistériel.nom);
    expect(boutonFiltrePérimètre).not.toHaveClass('actif');
  });
});

describe('quand je retire un des filtres via les cases à cocher', () => {
  test('le tag correspondant à ce filtre est supprimé', async () => {
    const filtrePérimètreMinistériel1 = pageChantiers.ministères[0].périmètresMinistériels[0];
    const filtrePérimètreMinistériel2 = pageChantiers.ministères[1].périmètresMinistériels[0];
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
    const filtrePérimètreMinistériel2 = pageChantiers.ministères[1].périmètresMinistériels[0];
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel1.nom);
    await pageChantiers.basculerEtatDuFiltrePérimètreMinistériel(filtrePérimètreMinistériel2.nom);

    await pageChantiers.réinitialiserLesFiltres();

    expect(pageChantiers.estAffichéFiltresActifs()).toBe(false);
  });
});
