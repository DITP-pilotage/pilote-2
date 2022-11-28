import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from './Pagination';
import userEvent from '@testing-library/user-event';

const PREMIERE_PAGE = 'Première page';
const DERNIERE_PAGE = 'Dernière page';
const PAGE_SUIVANTE = 'Page suivante';
const PAGE_PRECEDENTE = 'Page précédente';

class PaginationTest {
  changementDePageCallback: jest.Mock;

  constructor() {
    this.changementDePageCallback = jest.fn();
  }

  récupérerLesElementsDeListe() {
    const elements = screen.getAllByRole('listitem');
    return elements.map((element) => element.textContent);
  }

  récupérerLaPageCourante() {
    const pageSurlignée = screen.getByRole('button', { current: 'page' });
    return pageSurlignée ? pageSurlignée.textContent : null;
  }

  récupérerBoutonPagePrécédente() {
    return screen.getByRole('button', {
      name: PAGE_PRECEDENTE,
    });
  }

  récupérerBoutonPageSuivante() {
    return screen.getByRole('button', {
      name: PAGE_SUIVANTE,
    });
  }

  récupérerBoutonPremièrePage() {
    return screen.getByRole('button', {
      name: PREMIERE_PAGE,
    });
  }

  récupérerBoutonDernièrePage() {
    return screen.getByRole('button', {
      name: DERNIERE_PAGE,
    });
  }

  async allerALaPage(numéroDePage: number) {
    await userEvent.click(screen.getByRole('button', {
      name: String(numéroDePage),
    }));
  }

  async allerALaPagePrécédente() {
    await userEvent.click(this.récupérerBoutonPagePrécédente());
  }

  async allerALaPageSuivante() {
    await userEvent.click(this.récupérerBoutonPageSuivante());
  }

  async allerALaPremièrePage() {
    await userEvent.click(this.récupérerBoutonPremièrePage());
  }

  async allerALaDernièrePage() {
    await userEvent.click(this.récupérerBoutonDernièrePage());
  }
  
  render(nombreDePages: number, numéroDePageInitiale = 1) {
    render(
      <Pagination
        changementDePageCallback={this.changementDePageCallback}
        nombreDePages={nombreDePages}
        numéroDePageInitiale={numéroDePageInitiale}
      />);
  }
}

describe('quand il y a plus de 5 pages', () => {
  const donnéesDeTest = [
    {
      pageCourante: 1,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '2', '...', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 2,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '2', '3',  '...', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 3,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '2', '3', '4',  '...', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 4,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '...', '3', '4', '5',  '...', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 10,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '...', '9', '10', '11', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 11,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '...', '10', '11', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
    {
      pageCourante: 12,
      listeDElementsAttendus: [ PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '...', '11', '12', PAGE_SUIVANTE, DERNIERE_PAGE ],
    },
  ];

  donnéesDeTest.forEach((casDeTest) => {
    describe(`si la page courante est la page ${casDeTest.pageCourante}`, () => {
      let pagination: PaginationTest;
      beforeEach(() => {
        // GIVEN
        pagination = new PaginationTest();
        // WHEN
        pagination.render(12, casDeTest.pageCourante);
      });
      
      test(`définit le "current page" à la page ${casDeTest.pageCourante}`, () => {
        // THEN
        expect(pagination.récupérerLaPageCourante()).toEqual(String(casDeTest.pageCourante));
      });
      
      test('affiche les éléments de pagination', () => {
        // THEN
        expect(pagination.récupérerLesElementsDeListe()).toEqual(casDeTest.listeDElementsAttendus);
      });
    });
  });
});

describe('quand il y a moins de 6 pages', () => {

  const listeDePages = [1, 2, 3, 4, 5];

  listeDePages.forEach((pageCourante) => {
    describe(`si la page courante est la page ${pageCourante}`, () => {
      let pagination: PaginationTest;
      beforeEach(() => {
        // GIVEN
        pagination = new PaginationTest();
        // WHEN
        pagination.render(5, pageCourante);
      });
      
      test(`définit le "current page" à la page ${pageCourante}`, () => {
        // THEN
        expect(pagination.récupérerLaPageCourante()).toEqual(String(pageCourante));
      });
      
      test('affiche les éléments de pagination', () => {
        const renduAttendu = [PREMIERE_PAGE, PAGE_PRECEDENTE, '1', '2', '3', '4', '5', PAGE_SUIVANTE, DERNIERE_PAGE];
        // THEN
        expect(pagination.récupérerLesElementsDeListe()).toEqual(renduAttendu);
      });
    });
  });
});

describe('quand l\'utilisateur clique sur les éléments de pagination', () => {
  let pagination: PaginationTest;

  beforeEach(() => {
    // GIVEN
    pagination = new PaginationTest();
  });

  test('au clic sur "page suivante", l\'utilisateur est amené à la page suivante', async () => {
    // WHEN
    pagination.render(12, 1);
    await pagination.allerALaPageSuivante();
    // THEN
    expect(pagination.récupérerLaPageCourante()).toEqual('2');
    expect(pagination.changementDePageCallback).toHaveBeenCalledTimes(1);
  });

  test('au clic sur "page précédente", l\'utilisateur est amené à la page précédente', async () => {
    // WHEN
    pagination.render(12, 3);
    await pagination.allerALaPagePrécédente();
    // THEN
    expect(pagination.récupérerLaPageCourante()).toEqual('2');
    expect(pagination.changementDePageCallback).toHaveBeenCalledTimes(1);
  });

  test('au clic sur "première page", l\'utilisateur est amené à la première page', async () => {
    // WHEN
    pagination.render(12, 3);
    await pagination.allerALaPremièrePage();
    // THEN
    expect(pagination.récupérerLaPageCourante()).toEqual('1');
    expect(pagination.changementDePageCallback).toHaveBeenCalledTimes(1);
  });

  test('au clic sur "dernière page", l\'utilisateur est amené à la dernière page', async () => {
    // WHEN
    pagination.render(12, 3);
    await pagination.allerALaDernièrePage();
    // THEN
    expect(pagination.récupérerLaPageCourante()).toEqual('12');
    expect(pagination.changementDePageCallback).toHaveBeenCalledTimes(1);
  });

  test('au clic sur "5", l\'utilisateur est amené à la page 5', async () => {
    // WHEN
    pagination.render(12, 4);
    await pagination.allerALaPage(5);
    // THEN
    expect(pagination.récupérerLaPageCourante()).toEqual('5');
    expect(pagination.changementDePageCallback).toHaveBeenCalledTimes(1);
  });
});

describe('quand on est à la première page', () => {
  let pagination: PaginationTest;

  beforeEach(() => {
    // GIVEN
    pagination = new PaginationTest();
  });

  test('les boutons "première page" et "page précédente" sont désactivés', async () => {
    // WHEN
    pagination.render(12, 1);
    // THEN
    expect(pagination.récupérerBoutonPremièrePage()).toBeDisabled();
    expect(pagination.récupérerBoutonPagePrécédente()).toBeDisabled();
  });
});

describe('quand on est à la dernière page', () => {
  let pagination: PaginationTest;

  beforeEach(() => {
    // GIVEN
    pagination = new PaginationTest();
  });

  test('les boutons "dernière page" et "page suivante" sont désactivés', async () => {
    // WHEN
    pagination.render(12, 12);
    // THEN
    expect(pagination.récupérerBoutonDernièrePage()).toBeDisabled();
    expect(pagination.récupérerBoutonPageSuivante()).toBeDisabled();
  });
});