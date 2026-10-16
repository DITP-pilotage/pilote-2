import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import {
  pagesVisibles,
  urlPageCentreAide,
} from "@/server/parametrage-centre-aide/domain/pagesVisibles";

const GROUPE_NOTIONS = "0192a000-0000-7000-8000-000000000001";
const PAGE_TAUX = "0192a000-0000-7000-8000-000000000002";
const PAGE_METEO = "0192a000-0000-7000-8000-000000000003";
const GROUPE_ARCHIVES = "0192a000-0000-7000-8000-000000000004";
const PAGE_ARCHIVEE = "0192a000-0000-7000-8000-000000000005";
const PAGE_MASQUEE = "0192a000-0000-7000-8000-000000000006";

const groupe = (
  id: string,
  titre: string,
  options: { ordre?: number; estPublie?: boolean; estMasque?: boolean } = {},
) =>
  ArticleCentreAide.creerArticle({
    id,
    titre,
    type: "GROUPE",
    ordre: options.ordre ?? 0,
    estPublie: options.estPublie ?? true,
    estMasque: options.estMasque ?? false,
  });

const page = (
  id: string,
  titre: string,
  options: {
    parentId?: string | null;
    ordre?: number;
    contenu?: string | null;
    titreAffiche?: string | null;
    contenuBrouillon?: string | null;
    estPublie?: boolean;
    estMasque?: boolean;
  } = {},
) =>
  ArticleCentreAide.creerArticle({
    id,
    titre,
    type: "PAGE",
    parentId: options.parentId ?? null,
    ordre: options.ordre ?? 0,
    contenu: options.contenu === undefined ? "<p>Contenu</p>" : options.contenu,
    titreAffiche: options.titreAffiche ?? null,
    contenuBrouillon: options.contenuBrouillon ?? null,
    estPublie: options.estPublie ?? true,
    estMasque: options.estMasque ?? false,
  });

describe("pagesVisibles", () => {
  it("renvoie les pages publiées avec le chemin de leurs groupes, dans l'ordre de l'arbre", () => {
    // Given
    const articles = [
      page(PAGE_METEO, "La météo", { parentId: GROUPE_NOTIONS, ordre: 2 }),
      groupe(GROUPE_NOTIONS, "Notions clés"),
      page(PAGE_TAUX, "Le taux", { parentId: GROUPE_NOTIONS, ordre: 1 }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages).toEqual([
      {
        id: PAGE_TAUX,
        titre: "Le taux",
        chemin: ["Notions clés"],
        contenu: "<p>Contenu</p>",
      },
      {
        id: PAGE_METEO,
        titre: "La météo",
        chemin: ["Notions clés"],
        contenu: "<p>Contenu</p>",
      },
    ]);
  });

  it("exclut une page publiée dont un groupe ancêtre est dépublié ou masqué", () => {
    // Given
    const articles = [
      groupe(GROUPE_ARCHIVES, "Archives", { estPublie: false }),
      page(PAGE_ARCHIVEE, "Procédure 2024", { parentId: GROUPE_ARCHIVES }),
      groupe(GROUPE_NOTIONS, "Notions clés", { estMasque: true }),
      page(PAGE_TAUX, "Le taux", { parentId: GROUPE_NOTIONS }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages).toEqual([]);
  });

  it("exclut les pages masquées, non publiées ou sans contenu", () => {
    // Given
    const articles = [
      page(PAGE_MASQUEE, "Masquée", { estMasque: true }),
      page(PAGE_ARCHIVEE, "Brouillon jamais publié", { estPublie: false }),
      page(PAGE_METEO, "Vide", { contenu: "" }),
      page(PAGE_TAUX, "Sans contenu", { contenu: null }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages).toEqual([]);
  });

  it("traite un groupe qui a du contenu comme une page, sans le retirer du chemin de ses enfants", () => {
    // Given
    const articles = [
      ArticleCentreAide.creerArticle({
        id: GROUPE_NOTIONS,
        titre: "Accès et vue dans PILOTE",
        type: "GROUPE",
        ordre: 0,
        estPublie: true,
        contenu: "<p>Présentation des accès</p>",
      }),
      page(PAGE_TAUX, "Règles d'accès", { parentId: GROUPE_NOTIONS }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages).toEqual([
      {
        id: GROUPE_NOTIONS,
        titre: "Accès et vue dans PILOTE",
        chemin: [],
        contenu: "<p>Présentation des accès</p>",
      },
      {
        id: PAGE_TAUX,
        titre: "Règles d'accès",
        chemin: ["Accès et vue dans PILOTE"],
        contenu: "<p>Contenu</p>",
      },
    ]);
  });

  it("ne lit jamais le brouillon d'une page publiée", () => {
    // Given
    const articles = [
      page(PAGE_TAUX, "Le taux", {
        contenu: "<p>Version publiée</p>",
        contenuBrouillon: "<p>Version en cours</p>",
      }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages).toEqual([
      {
        id: PAGE_TAUX,
        titre: "Le taux",
        chemin: [],
        contenu: "<p>Version publiée</p>",
      },
    ]);
  });

  it("préfère le titre affiché, et retombe sur le titre quand il est vide", () => {
    // Given
    const articles = [
      page(PAGE_TAUX, "Taux", {
        titreAffiche: "Le taux d'avancement",
        ordre: 1,
      }),
      page(PAGE_METEO, "Météo", { titreAffiche: "", ordre: 2 }),
    ];

    // When
    const pages = pagesVisibles(articles);

    // Then
    expect(pages.map((pageVisible) => pageVisible.titre)).toEqual([
      "Le taux d'avancement",
      "Météo",
    ]);
  });
});

describe("urlPageCentreAide", () => {
  it("pointe vers la page publique du centre d'aide", () => {
    // When
    const url = urlPageCentreAide(PAGE_TAUX);

    // Then
    expect(url).toBe(`/centre-aide-pilote?article=${PAGE_TAUX}`);
  });
});
