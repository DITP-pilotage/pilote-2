# Assistant IA et centre d'aide — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** l'assistant IA répond aux questions métier à partir des pages publiées
du centre d'aide, affiche les pages utilisées, et oriente vers l'équipe PILOTE
quand le centre d'aide ne couvre pas la question.

**Architecture :** un outil `consulter_centre_aide` exposé à l'agent principal
encapsule un sous-agent en deux appels LLM à sortie structurée. Le premier
choisit au plus 3 pages dans le sommaire, le second répond à partir de leur
contenu converti en markdown. Les pages viennent de deux queries exportées par
le module `parametrageCentreAide`, qui appliquent la règle de visibilité côté
serveur. L'interface rend les sources dans un encart déterministe.

**Tech Stack :** Next.js, tRPC, Prisma, Awilix (système de modules maison),
Vercel AI SDK v7 (Albert, compatible OpenAI), `turndown`, Vitest, Testing
Library, Evalite.

**Spec :** `docs/superpowers/specs/2026-10-15-albert-centre-aide-design.md`
(maquettes : https://claude.ai/artifact/Gfb2JDUgCywuzXbSwycLS3)

## Global Constraints

- Toutes les commandes se lancent depuis `apps/pilote-ppg/` du worktree.
- Exports et imports nommés uniquement, jamais de `default`.
- Pas de variable d'un ou deux caractères (`e` → `error`, `a` → `article`).
- Tests : `// Given`, `// When`, `// Then` ; `expect(result).toEqual([{...}])`
  plutôt que `toHaveLength` suivi d'un accès par index ; aucun autre
  commentaire, sauf pour souligner une donnée propre au test.
- Données de test : valeurs fixes, UUID écrits en dur, pas de hasard.
- Avant `pnpm lint:tsc` ou les tests d'intégration :
  `DOTENV_CONFIG_PATH=.env.test pnpm exec prisma generate`.
- URL d'une page du centre d'aide : `/centre-aide-pilote?article=<id>`.
- Le contact support est le bouton existant `BoutonContacterEquipePilote`
  (`mailto:pilote.ditp@modernisation.gouv.fr`), importé depuis
  `@/components/PageAccueil/BoutonContacterEquipePilote` comme le font déjà
  `EnTete` et `BaseNavigation`. Il n'est pas déplacé.
- Nom de l'outil : `consulter_centre_aide`. Libellé dans les sources : « Centre
  d'aide ». État de chargement : « consulte le centre d'aide ».
- Commits en français, au format `feat: … (PIL-1863)`, terminés par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Article dont `titreAffiche` vaut `""`.** Le titre retombe sur `titre`,
   comme `PageCentreAidePilote` (`titreAffiche || titre`). Le test est dans la
   tâche 2.
2. **Centre d'aide vide** (aucune page visible). L'outil renvoie
   `trouve: false` sans appeler le LLM. Le test est dans la tâche 4.
3. **Le LLM renvoie deux fois le même id dans `sourcesIds`.** L'encart liste la
   page une seule fois. Le test est dans la tâche 4.
4. **Le LLM sélectionne plus de 3 pages.** On n'en lit que 3, sans erreur de
   schéma. Le schéma ne porte donc pas de `max` : on tronque dans le code. Le
   test est dans la tâche 4.
5. **Deux appels à `consulter_centre_aide` dans un même message.** Un seul
   encart s'affiche, celui du dernier appel. Le test est dans la tâche 7.

---

### Task 1 : conversion du HTML du centre d'aide en markdown

**Files :**
- Modify : `package.json` (dépendances `turndown`, `@types/turndown`)
- Create : `src/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown.ts`
- Test : `src/server/parametrage-centre-aide/__tests__/app/convertirHtmlEnMarkdown.unit.test.ts`

**Interfaces :**
- Produces :
  - `convertirHtmlEnMarkdown(html: string): string` ;
  - `extraireIntertitres(markdown: string): string[]`, qui renvoie les titres de
    niveau 1 à 3. L'éditeur autorise les niveaux 1 à 6, et les titres
    d'accordéon sont en `####`.

- [ ] **Step 1 : installer la dépendance**

```bash
pnpm add turndown && pnpm add -D @types/turndown
```

Expected : `turndown` dans `dependencies` et `@types/turndown` dans
`devDependencies` de `apps/pilote-ppg/package.json`. Si `minimumReleaseAge`
bloque la dernière version, prendre la plus récente de plus de deux semaines,
sans ajouter d'exclusion.

- [ ] **Step 2 : écrire le test qui échoue**

```ts
import {
  convertirHtmlEnMarkdown,
  extraireIntertitres,
} from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

describe("convertirHtmlEnMarkdown", () => {
  it("convertit les titres et les paragraphes", () => {
    // Given
    const html = "<p>Introduction</p><h2>Calcul</h2><p>Le détail.</p>";

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("Introduction\n\n## Calcul\n\nLe détail.");
  });

  it("déplie un accordéon sous son titre", () => {
    // Given
    const html =
      '<div data-type="accordion-item" data-title="Pour aller plus loin"><p>Contenu replié.</p></div>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("#### Pour aller plus loin\n\nContenu replié.");
  });

  it("rend un callout en citation", () => {
    // Given
    const html =
      '<div data-type="callout" data-color="info"><p>Attention au jalon.</p></div>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("> Attention au jalon.");
  });

  it("remplace une vidéo, même sans contenu, par une mention", () => {
    // Given
    const html =
      '<p>Avant</p><div data-type="video" data-src="https://tube.fr/v/1"></div><p>Après</p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe(
      "Avant\n\n[Vidéo disponible sur la page]\n\nAprès",
    );
  });

  it("remplace une iframe par une mention de vidéo", () => {
    // Given
    const html = '<iframe src="https://tube.fr/v/2"></iframe>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("[Vidéo disponible sur la page]");
  });

  it("décrit une image par son texte alternatif", () => {
    // Given
    const html =
      '<p>Voir <img src="/capture.png" alt="Écran d\'import"> ci-dessus</p><p><img src="/sans-alt.png"></p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe(
      "Voir [Image : Écran d'import] ci-dessus\n\n[Image disponible sur la page]",
    );
  });

  it("supprime les icônes décoratives", () => {
    // Given
    const html =
      '<p><span data-type="icone" data-icon-type="InformationPleineIcon"></span>Information</p>';

    // When
    const markdown = convertirHtmlEnMarkdown(html);

    // Then
    expect(markdown).toBe("Information");
  });
});

describe("extraireIntertitres", () => {
  it("garde les titres de niveau 1 à 3, dans l'ordre", () => {
    // Given
    const markdown =
      "# Vue d'ensemble\n\ntexte\n\n## Calcul\n\n### Cas particulier\n\n#### Pour aller plus loin";

    // When
    const intertitres = extraireIntertitres(markdown);

    // Then
    expect(intertitres).toEqual([
      "Vue d'ensemble",
      "Calcul",
      "Cas particulier",
    ]);
  });
});
```

- [ ] **Step 3 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide/__tests__/app/convertirHtmlEnMarkdown`
Expected : FAIL, module `convertirHtmlEnMarkdown` introuvable.

- [ ] **Step 4 : implémenter**

```ts
import TurndownService from "turndown";

const MENTION_VIDEO = "[Vidéo disponible sur la page]";

const aLeType = (node: HTMLElement, type: string) =>
  node.getAttribute?.("data-type") === type;

/**
 * Turndown aiguille les nœuds vides vers `blankReplacement` avant toute
 * règle : une vidéo est un `div` vide, qui n'atteindrait jamais la règle
 * `video`.
 */
const creerService = () => {
  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    blankReplacement: (_contenu, node) => {
      if (aLeType(node as HTMLElement, "video")) {
        return `\n\n${MENTION_VIDEO}\n\n`;
      }
      return (node as { isBlock?: boolean }).isBlock ? "\n\n" : "";
    },
  });

  service.addRule("accordeon", {
    filter: (node) => aLeType(node, "accordion-item"),
    replacement: (contenu, node) =>
      `\n\n#### ${(node as HTMLElement).getAttribute("data-title") ?? ""}\n\n${contenu.trim()}\n\n`,
  });

  service.addRule("callout", {
    filter: (node) => aLeType(node, "callout"),
    replacement: (contenu) =>
      `\n\n${contenu
        .trim()
        .split("\n")
        .map((ligne) => `> ${ligne}`.trimEnd())
        .join("\n")}\n\n`,
  });

  service.addRule("video", {
    filter: (node) => aLeType(node, "video") || node.nodeName === "IFRAME",
    replacement: () => `\n\n${MENTION_VIDEO}\n\n`,
  });

  service.addRule("image", {
    filter: "img",
    replacement: (_contenu, node) => {
      const texteAlternatif = (node as HTMLElement)
        .getAttribute("alt")
        ?.trim();
      return texteAlternatif
        ? `[Image : ${texteAlternatif}]`
        : "[Image disponible sur la page]";
    },
  });

  service.addRule("icone", {
    filter: (node) => aLeType(node, "icone"),
    replacement: () => "",
  });

  return service;
};

const service = creerService();

export const convertirHtmlEnMarkdown = (html: string): string =>
  service.turndown(html).trim();

const INTERTITRE = /^#{1,3}\s+(.+)$/;

export const extraireIntertitres = (markdown: string): string[] =>
  markdown.split("\n").flatMap((ligne) => {
    const correspondance = INTERTITRE.exec(ligne.trim());
    return correspondance ? [correspondance[1].trim()] : [];
  });
```

- [ ] **Step 5 : lancer le test pour vérifier qu'il passe**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide/__tests__/app/convertirHtmlEnMarkdown`
Expected : PASS, 8 tests. Si turndown échappe un caractère (`'` ou `[`) dans
un texte, ajuster l'attendu au comportement réel de turndown sur le texte
seulement : les remplacements des règles ne sont jamais échappés.

- [ ] **Step 6 : commit**

```bash
git add package.json ../../pnpm-lock.yaml src/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown.ts src/server/parametrage-centre-aide/__tests__/app/convertirHtmlEnMarkdown.unit.test.ts
git commit -m "feat: convertit le HTML du centre d'aide en markdown (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : règle de visibilité des pages

**Files :**
- Create : `src/server/parametrage-centre-aide/domain/pagesVisibles.ts`
- Test : `src/server/parametrage-centre-aide/__tests__/domain/pagesVisibles.unit.test.ts`

**Interfaces :**
- Consumes : `ArticleCentreAide`, déjà dans `domain/ArticleCentreAide.ts`.
- Produces :
  - `type PageVisible = { id: string; titre: string; chemin: string[]; contenu: string }` ;
  - `pagesVisibles(articles: ArticleCentreAide[]): PageVisible[]`, dans l'ordre
    de l'arbre (profondeur d'abord, `ordre` croissant). Tout article visible qui
    a du contenu est une page, groupe compris : la page publique affiche un
    groupe avec contenu comme une page, et le centre d'aide réel en a un
    (« Accès et vue dans PILOTE ») ;
  - `urlPageCentreAide(id: string): string`.

- [ ] **Step 1 : écrire le test qui échoue**

```ts
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
      page(PAGE_TAUX, "Taux", { titreAffiche: "Le taux d'avancement", ordre: 1 }),
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
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide/__tests__/domain/pagesVisibles`
Expected : FAIL, module `pagesVisibles` introuvable.

- [ ] **Step 3 : implémenter**

```ts
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";

export type PageVisible = {
  id: string;
  titre: string;
  chemin: string[];
  contenu: string;
};

const titreDe = (article: ArticleCentreAide) =>
  article.titreAffiche || article.titre;

const estVisible = (article: ArticleCentreAide) =>
  article.estPublie && !article.estMasque;

/**
 * Ce qu'un lecteur du centre d'aide voit : la même règle que la page publique,
 * appliquée côté serveur. Un article invisible masque toute sa descendance,
 * et seuls les champs publiés sont lus.
 */
export const pagesVisibles = (
  articles: ArticleCentreAide[],
): PageVisible[] => {
  const enfantsVisibles = (parentId: string | null) =>
    articles
      .filter((article) => article.parentId === parentId && estVisible(article))
      .sort((premier, second) => premier.ordre - second.ordre);

  const parcourir = (
    parentId: string | null,
    chemin: string[],
  ): PageVisible[] =>
    enfantsVisibles(parentId).flatMap((article) => {
      // Un groupe qui a du contenu s'affiche comme une page
      // (`estGroupeSansContenu` dans `PageCentreAidePilote`).
      const page = article.contenu
        ? [
              {
                id: article.id,
                titre: titreDe(article),
                chemin,
                contenu: article.contenu,
              },
            ]
          : [];
      return [...page, ...parcourir(article.id, [...chemin, titreDe(article)])];
    });

  return parcourir(null, []);
};

export const urlPageCentreAide = (id: string) =>
  `/centre-aide-pilote?article=${id}`;
```

- [ ] **Step 4 : lancer le test pour vérifier qu'il passe**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide/__tests__/domain/pagesVisibles`
Expected : PASS, 7 tests.

- [ ] **Step 5 : commit**

```bash
git add src/server/parametrage-centre-aide/domain/pagesVisibles.ts src/server/parametrage-centre-aide/__tests__/domain/pagesVisibles.unit.test.ts
git commit -m "feat: règle de visibilité des pages du centre d'aide côté serveur (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : queries du sommaire et des pages, exportées par le module

**Files :**
- Create : `src/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery.ts`
- Create : `src/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery.ts`
- Modify : `src/server/parametrage-centre-aide/module.ts`
- Test : `src/server/parametrage-centre-aide/__tests__/queries/GetSommaireCentreAideQuery.unit.test.ts`
- Test : `src/server/parametrage-centre-aide/__tests__/queries/GetPagesCentreAideQuery.integration.test.ts`

**Interfaces :**
- Consumes : `pagesVisibles`, `urlPageCentreAide` (tâche 2) ;
  `convertirHtmlEnMarkdown`, `extraireIntertitres` (tâche 1) ;
  `ArticleCentreAideRepository.lister()`.
- Produces :
  - `type EntreeSommaireCentreAide = { id: string; titre: string; chemin: string[]; intertitres: string[]; url: string }` ;
  - `GetSommaireCentreAideQuery.execute(): Promise<EntreeSommaireCentreAide[]>` ;
  - `type PageCentreAide = { id: string; titre: string; chemin: string[]; url: string; contenuMarkdown: string }` ;
  - `GetPagesCentreAideQuery.execute({ ids }: { ids: string[] }): Promise<PageCentreAide[]>`,
    qui renvoie les pages dans l'ordre de `ids` et ignore les ids invisibles ;
  - `type ParametrageCentreAideExports = { getSommaireCentreAideQuery: GetSommaireCentreAideQuery; getPagesCentreAideQuery: GetPagesCentreAideQuery }`,
    exporté par `parametrage-centre-aide/module.ts`.

- [ ] **Step 1 : écrire le test unitaire du sommaire, qui échoue**

```ts
import { mock } from "vitest-mock-extended";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { GetSommaireCentreAideQuery } from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";

const GROUPE = "0192a000-0000-7000-8000-000000000011";
const PAGE = "0192a000-0000-7000-8000-000000000012";

describe("GetSommaireCentreAideQuery", () => {
  it("renvoie chaque page visible avec son chemin, ses intertitres et son url", async () => {
    // Given
    const articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    articleCentreAideRepository.lister.mockResolvedValue([
      ArticleCentreAide.creerArticle({
        id: GROUPE,
        titre: "Notions clés",
        type: "GROUPE",
        ordre: 0,
        estPublie: true,
      }),
      ArticleCentreAide.creerArticle({
        id: PAGE,
        titre: "Le taux d'avancement",
        type: "PAGE",
        ordre: 0,
        parentId: GROUPE,
        estPublie: true,
        contenu:
          "<p>Définition</p><h2>Pour un indicateur</h2><p>…</p><h3>Bornes</h3>",
      }),
    ]);
    const query = new GetSommaireCentreAideQuery({
      articleCentreAideRepository,
    });

    // When
    const sommaire = await query.execute();

    // Then
    expect(sommaire).toEqual([
      {
        id: PAGE,
        titre: "Le taux d'avancement",
        chemin: ["Notions clés"],
        intertitres: ["Pour un indicateur", "Bornes"],
        url: `/centre-aide-pilote?article=${PAGE}`,
      },
    ]);
  });
});
```

- [ ] **Step 2 : écrire le test d'intégration des pages, qui échoue**

```ts
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaArticleCentreAideRepository } from "@/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository";
import { GetPagesCentreAideQuery } from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const PAGE_IMPORT = "0192a000-0000-7000-8000-000000000021";
const PAGE_EXPORT = "0192a000-0000-7000-8000-000000000022";
const PAGE_MASQUEE = "0192a000-0000-7000-8000-000000000023";
const INCONNUE = "0192a000-0000-7000-8000-000000000029";

describe("GetPagesCentreAideQuery", () => {
  it(
    "renvoie le contenu publié en markdown des pages visibles demandées, dans l'ordre demandé",
    createIntegrationTest(async (tx) => {
      // Given
      await tx.article_centre_aide.createMany({
        data: [
          {
            id: PAGE_IMPORT,
            titre: "Importer des mesures",
            contenu: "<p>Déposez le fichier.</p>",
            contenu_brouillon: "<p>Texte en cours de rédaction</p>",
            type: "PAGE",
            ordre: 1,
            est_publie: true,
          },
          {
            id: PAGE_EXPORT,
            titre: "Exporter les données",
            contenu: "<p>Cliquez sur Exporter.</p>",
            type: "PAGE",
            ordre: 2,
            est_publie: true,
          },
          {
            id: PAGE_MASQUEE,
            titre: "Ancienne procédure",
            contenu: "<p>Obsolète</p>",
            type: "PAGE",
            ordre: 3,
            est_publie: true,
            est_masque: true,
          },
        ],
      });
      const query = new GetPagesCentreAideQuery({
        articleCentreAideRepository: new PrismaArticleCentreAideRepository({
          prisma: new PrismaPilote(),
        }),
      });

      // When
      const pages = await query.execute({
        ids: [PAGE_EXPORT, PAGE_MASQUEE, INCONNUE, PAGE_IMPORT],
      });

      // Then
      expect(pages).toEqual([
        {
          id: PAGE_EXPORT,
          titre: "Exporter les données",
          chemin: [],
          url: `/centre-aide-pilote?article=${PAGE_EXPORT}`,
          contenuMarkdown: "Cliquez sur Exporter.",
        },
        {
          id: PAGE_IMPORT,
          titre: "Importer des mesures",
          chemin: [],
          url: `/centre-aide-pilote?article=${PAGE_IMPORT}`,
          contenuMarkdown: "Déposez le fichier.",
        },
      ]);
    }),
  );
});
```

- [ ] **Step 3 : lancer les tests pour vérifier qu'ils échouent**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide/__tests__/queries && pnpm test:server:integration src/server/parametrage-centre-aide/__tests__/queries`
Expected : FAIL, modules des queries introuvables.

- [ ] **Step 4 : implémenter les deux queries**

`src/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery.ts` :

```ts
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import {
  pagesVisibles,
  urlPageCentreAide,
} from "@/server/parametrage-centre-aide/domain/pagesVisibles";
import {
  convertirHtmlEnMarkdown,
  extraireIntertitres,
} from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

export type EntreeSommaireCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  intertitres: string[];
  url: string;
};

/**
 * Lu à chaque appel, sans cache : une page republiée est prise en compte
 * immédiatement. Une trentaine de lignes, la lecture ne coûte rien.
 */
export class GetSommaireCentreAideQuery {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: {
    articleCentreAideRepository: ArticleCentreAideRepository;
  }) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute(): Promise<EntreeSommaireCentreAide[]> {
    const pages = pagesVisibles(await this.articleCentreAideRepository.lister());

    return pages.map((page) => ({
      id: page.id,
      titre: page.titre,
      chemin: page.chemin,
      intertitres: extraireIntertitres(convertirHtmlEnMarkdown(page.contenu)),
      url: urlPageCentreAide(page.id),
    }));
  }
}
```

`src/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery.ts` :

```ts
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import {
  pagesVisibles,
  urlPageCentreAide,
} from "@/server/parametrage-centre-aide/domain/pagesVisibles";
import { convertirHtmlEnMarkdown } from "@/server/parametrage-centre-aide/app/convertirHtmlEnMarkdown";

export type PageCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  url: string;
  contenuMarkdown: string;
};

/**
 * Un id inconnu ou invisible est ignoré sans erreur : l'appelant compare ce
 * qu'il a demandé à ce qu'il reçoit.
 */
export class GetPagesCentreAideQuery {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: {
    articleCentreAideRepository: ArticleCentreAideRepository;
  }) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ ids }: { ids: string[] }): Promise<PageCentreAide[]> {
    const pages = new Map(
      pagesVisibles(await this.articleCentreAideRepository.lister()).map(
        (page) => [page.id, page],
      ),
    );

    return ids.flatMap((id) => {
      const page = pages.get(id);
      return page
        ? [
            {
              id: page.id,
              titre: page.titre,
              chemin: page.chemin,
              url: urlPageCentreAide(page.id),
              contenuMarkdown: convertirHtmlEnMarkdown(page.contenu),
            },
          ]
        : [];
    });
  }
}
```

- [ ] **Step 5 : exporter les queries depuis le module**

Dans `src/server/parametrage-centre-aide/module.ts` :

1. Ajouter les imports :

```ts
import { GetSommaireCentreAideQuery } from "./queries/GetSommaireCentreAideQuery";
import { GetPagesCentreAideQuery } from "./queries/GetPagesCentreAideQuery";
```

2. Retirer `type NoExports,` de l'import de `@/server/module-system`.

3. Déclarer les exports, et les inclure dans le cradle :

```ts
type ParametrageCentreAideExports = {
  getSommaireCentreAideQuery: GetSommaireCentreAideQuery;
  getPagesCentreAideQuery: GetPagesCentreAideQuery;
};

type ParametrageCentreAideCradle = ParametrageCentreAideExports & {
  creerArticleCentreAideUseCase: CreerArticleCentreAideUseCase;
  // … le reste du cradle actuel, inchangé
};
```

4. Remplacer `defineModule<NoExports, ParametrageCentreAideCradle>()` par
`defineModule<ParametrageCentreAideExports, ParametrageCentreAideCradle>()` et
`exports: []` par :

```ts
  exports: ["getSommaireCentreAideQuery", "getPagesCentreAideQuery"],
```

5. Dans `container.register({ … })`, ajouter :

```ts
      getSommaireCentreAideQuery: asModuleClass(GetSommaireCentreAideQuery),
      getPagesCentreAideQuery: asModuleClass(GetPagesCentreAideQuery),
```

6. En fin de fichier :

```ts
export type { ParametrageCentreAideExports };
```

- [ ] **Step 6 : lancer les tests pour vérifier qu'ils passent**

Run : `pnpm test:server:unit src/server/parametrage-centre-aide && DOTENV_CONFIG_PATH=.env.test pnpm exec prisma generate && pnpm test:server:integration src/server/parametrage-centre-aide`
Expected : PASS. Les tests existants des use cases restent verts.

- [ ] **Step 7 : commit**

```bash
git add src/server/parametrage-centre-aide
git commit -m "feat: queries du sommaire et des pages visibles du centre d'aide (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : outil `consulter_centre_aide`

**Files :**
- Create : `src/server/albert/subagents/centreAideSelectionSystemPrompt.ts`
- Create : `src/server/albert/subagents/centreAideReponseSystemPrompt.ts`
- Create : `src/server/albert/tools/consulterCentreAide.ts`
- Modify : `src/server/albert/module.ts`
- Modify : `src/server/albert/AssistantIA.ts:44-101` (`construireTools`)
- Modify : `src/server/albert/PiloteUIMessage.ts` (`PiloteUITools`)
- Test : `src/server/albert/__tests__/tools/consulterCentreAide.unit.test.ts`

**Interfaces :**
- Consumes : `GetSommaireCentreAideQuery`, `GetPagesCentreAideQuery`,
  `EntreeSommaireCentreAide`, `PageCentreAide`, `ParametrageCentreAideExports`
  (tâche 3) ; `Albert.generateStructuredOutput` ; `filtrerHallucinations`.
- Produces :
  - `consulterCentreAideInputSchema = z.object({ question: z.string().min(1) })` ;
  - `type SourceCentreAide = { id: string; titre: string; chemin: string[]; url: string }` ;
  - `type ConsulterCentreAideOutput = { trouve: boolean; reponse: string; sources: SourceCentreAide[]; _output_instructions: string }` ;
  - `createConsulterCentreAideTool(deps) => () => Tool` ;
  - l'outil `consulter_centre_aide` dans `AssistantIA` et dans `PiloteUITools`.

- [ ] **Step 1 : écrire le test qui échoue**

```ts
import { afterEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { Albert } from "@/server/albert/Albert";
import { createConsulterCentreAideTool } from "@/server/albert/tools/consulterCentreAide";
import type {
  EntreeSommaireCentreAide,
  GetSommaireCentreAideQuery,
} from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";
import type {
  GetPagesCentreAideQuery,
  PageCentreAide,
} from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const entree = (id: string, titre: string): EntreeSommaireCentreAide => ({
  id,
  titre,
  chemin: ["Notions clés"],
  intertitres: [],
  url: `/centre-aide-pilote?article=${id}`,
});

const pageCentreAide = (id: string, titre: string): PageCentreAide => ({
  id,
  titre,
  chemin: ["Notions clés"],
  url: `/centre-aide-pilote?article=${id}`,
  contenuMarkdown: `Contenu de ${titre}`,
});

const buildTool = ({
  sommaire,
  pages,
}: {
  sommaire: EntreeSommaireCentreAide[];
  pages: PageCentreAide[];
}) => {
  const getSommaireCentreAideQuery = mock<GetSommaireCentreAideQuery>({
    execute: async () => sommaire,
  });
  const getPagesCentreAideQuery = mock<GetPagesCentreAideQuery>({
    execute: async ({ ids }) => pages.filter((page) => ids.includes(page.id)),
  });
  const tool = createConsulterCentreAideTool({
    getSommaireCentreAideQuery,
    getPagesCentreAideQuery,
  })();
  return { tool, getPagesCentreAideQuery };
};

const executeTool = (
  tool: ReturnType<ReturnType<typeof createConsulterCentreAideTool>>,
  question: string,
) =>
  tool.execute!(
    { question },
    { toolCallId: "test", messages: [], abortSignal: undefined, context: {} },
  );

const NON_TROUVE = {
  trouve: false,
  reponse: "",
  sources: [],
  _output_instructions: expect.any(String),
};

describe("createConsulterCentreAideTool execute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("répond avec les pages réellement utilisées", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux", "meteo"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "TA = (VA − VI) / (VC − VI)",
        sourcesIds: ["taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux"), entree("meteo", "La météo")],
      pages: [pageCentreAide("taux", "Le taux"), pageCentreAide("meteo", "La météo")],
    });

    // When
    const result = await executeTool(tool, "comment est calculé le taux d'avancement");

    // Then
    expect(result).toEqual({
      trouve: true,
      reponse: "TA = (VA − VI) / (VC − VI)",
      sources: [
        {
          id: "taux",
          titre: "Le taux",
          chemin: ["Notions clés"],
          url: "/centre-aide-pilote?article=taux",
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("ne lit que les pages du sommaire, et au plus trois", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({
        ids: ["inventee", "p1", "p2", "p3", "p4"],
        reasoning: "test",
      })
      .mockResolvedValueOnce({ trouve: false, reponse: "", sourcesIds: [] });
    const { tool, getPagesCentreAideQuery } = buildTool({
      sommaire: ["p1", "p2", "p3", "p4"].map((id) => entree(id, id)),
      pages: [],
    });

    // When
    await executeTool(tool, "question");

    // Then
    expect(getPagesCentreAideQuery.execute).toHaveBeenCalledWith({
      ids: ["p1", "p2", "p3"],
    });
  });

  test("ne consulte pas le LLM quand le centre d'aide est vide", async () => {
    // Given
    const appelLLM = vi.spyOn(Albert, "generateStructuredOutput");
    const { tool } = buildTool({ sommaire: [], pages: [] });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
    expect(appelLLM).not.toHaveBeenCalled();
  });

  test("ne rédige pas de réponse quand aucune page n'est sélectionnée", async () => {
    // Given
    const appelLLM = vi
      .spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: [], reasoning: "hors sujet" });
    const { tool } = buildTool({ sommaire: [entree("taux", "Le taux")], pages: [] });

    // When
    const result = await executeTool(tool, "alertes par mail");

    // Then
    expect(result).toEqual(NON_TROUVE);
    expect(appelLLM).toHaveBeenCalledTimes(1);
  });

  test("bascule en non trouvé quand aucune source citée n'a été lue", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "Réponse sans source",
        sourcesIds: ["inventee"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
  });

  test("bascule en non trouvé quand le sous-agent ne trouve pas", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: false,
        reponse: "Une tentative",
        sourcesIds: ["taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual(NON_TROUVE);
  });

  test("ne liste qu'une fois une source citée deux fois", async () => {
    // Given
    vi.spyOn(Albert, "generateStructuredOutput")
      .mockResolvedValueOnce({ ids: ["taux"], reasoning: "test" })
      .mockResolvedValueOnce({
        trouve: true,
        reponse: "Réponse",
        sourcesIds: ["taux", "taux"],
      });
    const { tool } = buildTool({
      sommaire: [entree("taux", "Le taux")],
      pages: [pageCentreAide("taux", "Le taux")],
    });

    // When
    const result = await executeTool(tool, "question");

    // Then
    expect(result).toEqual({
      trouve: true,
      reponse: "Réponse",
      sources: [
        {
          id: "taux",
          titre: "Le taux",
          chemin: ["Notions clés"],
          url: "/centre-aide-pilote?article=taux",
        },
      ],
      _output_instructions: expect.any(String),
    });
  });
});
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:server:unit src/server/albert/__tests__/tools/consulterCentreAide`
Expected : FAIL, module `consulterCentreAide` introuvable.

- [ ] **Step 3 : écrire les prompts des sous-agents**

`src/server/albert/subagents/centreAideSelectionSystemPrompt.ts` :

```ts
export const buildCentreAideSelectionSystemPrompt =
  () => `Tu es un sous-agent de l'assistant IA de PILOTE. Ta seule tâche : choisir, dans le sommaire du centre d'aide de PILOTE, les pages qui permettent de répondre à la question de l'utilisateur.

Tu reçois :
- la question, dans <question> ;
- le sommaire, dans <sommaire> : pour chaque page, son \`id\`, son \`titre\`, son \`chemin\` (les rubriques qui la contiennent) et ses \`intertitres\`.

Règles :
- Retiens au plus 3 pages, de la plus pertinente à la moins pertinente.
- Ne retiens une page que si son titre, son chemin ou ses intertitres montrent qu'elle traite la question. Une page seulement voisine du sujet ne suffit pas.
- Si aucune page ne traite la question, renvoie une liste \`ids\` vide.
- N'invente jamais d'identifiant : recopie les \`id\` du sommaire à l'identique.
- Dans \`reasoning\`, explique en une ou deux phrases pourquoi tu retiens ces pages, ou pourquoi aucune.`;
```

`src/server/albert/subagents/centreAideReponseSystemPrompt.ts` :

```ts
export const buildCentreAideReponseSystemPrompt =
  () => `Tu es un sous-agent de l'assistant IA de PILOTE. Tu réponds à une question sur le fonctionnement de PILOTE **uniquement** à partir des pages du centre d'aide qui te sont fournies.

Tu reçois :
- la question, dans <question> ;
- les pages, dans <pages> : chaque <page> porte son \`id\` et son \`titre\`, et contient la page en markdown.

Règles :
- Réponds uniquement avec ce qui est écrit dans les pages. N'ajoute aucune connaissance générale, aucune supposition, aucun exemple qui n'y figure pas.
- Si les pages ne permettent pas de répondre, renvoie \`trouve: false\`, une \`reponse\` vide et une liste \`sourcesIds\` vide. Ne tente pas de réponse partielle déduite.
- Sinon, renvoie \`trouve: true\`, ta réponse dans \`reponse\` et, dans \`sourcesIds\`, les \`id\` des pages dont tu as réellement utilisé le contenu.
- Rédige en français, de façon concise et structurée (paragraphes courts, listes si utile). Conserve les formules et les termes exacts des pages.
- N'écris ni lien, ni URL, ni identifiant de page dans \`reponse\` : les pages sont affichées à l'utilisateur à part.
- Une mention « [Vidéo disponible sur la page] » ou « [Image …] » signale un contenu que tu ne vois pas : n'en déduis rien.`;
```

- [ ] **Step 4 : implémenter l'outil**

`src/server/albert/tools/consulterCentreAide.ts` :

```ts
import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { filtrerHallucinations } from "@/server/albert/subagents/filtrerHallucinations";
import { buildCentreAideSelectionSystemPrompt } from "@/server/albert/subagents/centreAideSelectionSystemPrompt";
import { buildCentreAideReponseSystemPrompt } from "@/server/albert/subagents/centreAideReponseSystemPrompt";
import type {
  EntreeSommaireCentreAide,
  GetSommaireCentreAideQuery,
} from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";
import type {
  GetPagesCentreAideQuery,
  PageCentreAide,
} from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const NOMBRE_MAX_PAGES = 3;

export const consulterCentreAideInputSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe(
      "Question autonome, compréhensible sans la conversation (ex : « comment est calculé le taux d'avancement d'un indicateur »). Sans valeur chiffrée.",
    ),
});

// Pas de `max` : un sous-agent qui renvoie quatre ids ferait échouer la
// validation du schéma. On tronque après filtrage.
const selectionOutputSchema = z.object({
  ids: z.array(z.string()),
  reasoning: z.string(),
});

const reponseOutputSchema = z.object({
  trouve: z.boolean(),
  reponse: z.string(),
  sourcesIds: z.array(z.string()),
});

export type SourceCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  url: string;
};

export type ConsulterCentreAideOutput = {
  trouve: boolean;
  reponse: string;
  sources: SourceCentreAide[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS_TROUVE = `Restitue fidèlement \`reponse\` à l'utilisateur : ne la complète pas avec le glossaire ni avec d'autres connaissances, et n'en retire rien d'important.
Si la conversation contient déjà des valeurs auxquelles la réponse s'applique (par exemple VI, VA et VC d'un indicateur), tu peux l'illustrer avec ces valeurs, sans appeler d'autre outil.
N'écris aucun lien ni URL : les pages du centre d'aide sont affichées sous ta réponse.`;

const OUTPUT_INSTRUCTIONS_NON_TROUVE = `Le centre d'aide ne couvre pas cette question. Dis-le à l'utilisateur en une phrase, sans affirmer de réponse, même partielle, et sans t'appuyer sur tes connaissances générales.
Indique que l'équipe PILOTE peut lui répondre : un bouton pour la contacter est affiché sous ta réponse. N'écris pas d'adresse mail.`;

const nonTrouve = (): ConsulterCentreAideOutput => ({
  trouve: false,
  reponse: "",
  sources: [],
  _output_instructions: OUTPUT_INSTRUCTIONS_NON_TROUVE,
});

const sansDoublon = (ids: string[]) => [...new Set(ids)];

const buildPromptSelection = (
  question: string,
  sommaire: EntreeSommaireCentreAide[],
) => `<question>${question}</question>

<sommaire>
${JSON.stringify(
  sommaire.map(({ id, titre, chemin, intertitres }) => ({
    id,
    titre,
    chemin: chemin.join(" > "),
    intertitres,
  })),
)}
</sommaire>`;

const buildPromptReponse = (
  question: string,
  pages: PageCentreAide[],
) => `<question>${question}</question>

<pages>
${pages
  .map(
    (page) => `<page id="${page.id}" titre="${page.titre}">
${page.contenuMarkdown}
</page>`,
  )
  .join("\n")}
</pages>`;

export function createConsulterCentreAideTool({
  getSommaireCentreAideQuery,
  getPagesCentreAideQuery,
}: {
  getSommaireCentreAideQuery: GetSommaireCentreAideQuery;
  getPagesCentreAideQuery: GetPagesCentreAideQuery;
}) {
  return () =>
    tool({
      description: `Répond à une question sur le fonctionnement de PILOTE à partir du centre d'aide (les pages publiées de l'aide en ligne).

Utilise ce tool quand l'utilisateur demande :
- la définition d'une notion de PILOTE (taux d'avancement, météo, jalon, maille, PPG…) ;
- comment une valeur est calculée ;
- comment faire quelque chose dans PILOTE : saisir ou importer des données, exporter, gérer les propositions de valeur d'avancement (PVA), gérer les utilisateurs ;
- comment fonctionne une page ou une fonctionnalité de PILOTE.

N'utilise PAS ce tool pour une question sur les valeurs d'un chantier, d'un indicateur ou d'un territoire : utilise les tools de données.

\`question\` doit être autonome, compréhensible sans la conversation : remplace « ce taux », « cette page » par ce qu'ils désignent (ex : « comment est calculé le taux d'avancement d'un indicateur »). N'y mets pas de valeurs chiffrées.`,
      inputSchema: consulterCentreAideInputSchema,
      execute: async (
        { question },
        { abortSignal },
      ): Promise<ConsulterCentreAideOutput> => {
        const sommaire = await getSommaireCentreAideQuery.execute();
        if (sommaire.length === 0) return nonTrouve();

        const selection = await Albert.generateStructuredOutput({
          systemPrompt: buildCentreAideSelectionSystemPrompt(),
          prompt: buildPromptSelection(question, sommaire),
          schema: selectionOutputSchema,
          abortSignal,
        });

        const idsRetenus = filtrerHallucinations({
          items: sansDoublon(selection.ids),
          references: new Map(sommaire.map((entree) => [entree.id, entree])),
          getId: (id) => id,
        })
          .slice(0, NOMBRE_MAX_PAGES)
          .map((entree) => entree.id);
        if (idsRetenus.length === 0) return nonTrouve();

        const pages = await getPagesCentreAideQuery.execute({
          ids: idsRetenus,
        });
        if (pages.length === 0) return nonTrouve();

        const reponse = await Albert.generateStructuredOutput({
          systemPrompt: buildCentreAideReponseSystemPrompt(),
          prompt: buildPromptReponse(question, pages),
          schema: reponseOutputSchema,
          abortSignal,
        });

        const sources = filtrerHallucinations({
          items: sansDoublon(reponse.sourcesIds),
          references: new Map(pages.map((page) => [page.id, page])),
          getId: (id) => id,
        }).map(({ id, titre, chemin, url }) => ({ id, titre, chemin, url }));

        if (!reponse.trouve || sources.length === 0) return nonTrouve();

        return {
          trouve: true,
          reponse: reponse.reponse,
          sources,
          _output_instructions: OUTPUT_INSTRUCTIONS_TROUVE,
        };
      },
    });
}
```

- [ ] **Step 5 : lancer le test pour vérifier qu'il passe**

Run : `pnpm test:server:unit src/server/albert/__tests__/tools/consulterCentreAide`
Expected : PASS, 7 tests.

- [ ] **Step 6 : câbler l'outil**

`src/server/albert/module.ts` :

```ts
import { createConsulterCentreAideTool } from "@/server/albert/tools/consulterCentreAide";
import type { ParametrageCentreAideExports } from "@/server/parametrage-centre-aide/module";

type AlbertImports = FrameworkDependencies &
  ChantierExports &
  ParametrageCentreAideExports;
```

Dans `AlbertOwnCradle`, ajouter :

```ts
  createConsulterCentreAideTool: ReturnType<
    typeof createConsulterCentreAideTool
  >;
```

Remplacer `imports: ["framework", "chantiers"]` par
`imports: ["framework", "chantiers", "parametrageCentreAide"]`, puis, dans
`container.register({ … })` :

```ts
      createConsulterCentreAideTool: asModuleFunction(
        createConsulterCentreAideTool,
      ),
```

`src/server/albert/AssistantIA.ts`, dans l'objet renvoyé par
`construireTools`, juste après `search_territoires` :

```ts
      consulter_centre_aide: container.resolve(
        "createConsulterCentreAideTool",
      )(),
```

`src/server/albert/PiloteUIMessage.ts` : ajouter les imports, puis l'entrée
dans `PiloteUITools`, après `search_territoires` :

```ts
import {
  consulterCentreAideInputSchema,
  type ConsulterCentreAideOutput,
} from "@/server/albert/tools/consulterCentreAide";

  consulter_centre_aide: {
    input: z.input<typeof consulterCentreAideInputSchema>;
    output: ConsulterCentreAideOutput;
  };
```

- [ ] **Step 7 : vérifier le typage et les tests d'Albert**

Run : `DOTENV_CONFIG_PATH=.env.test pnpm exec prisma generate && pnpm lint:tsc && pnpm test:server:unit src/server/albert`
Expected : aucune erreur de type, tous les tests d'Albert passent.

- [ ] **Step 8 : commit**

```bash
git add src/server/albert
git commit -m "feat: outil consulter_centre_aide, un sous-agent qui répond à partir du centre d'aide (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : prompt système

**Files :**
- Modify : `src/server/albert/systemPrompt.ts` (sections `# Identité et périmètre`, `## clarify_with_choices`)
- Test : `src/server/albert/__tests__/systemPrompt.unit.test.ts`

**Interfaces :**
- Consumes : le nom d'outil `consulter_centre_aide` (tâche 4).
- Produces : le prompt contient la section `## consulter_centre_aide`.

- [ ] **Step 1 : écrire le test qui échoue**

À la fin de `systemPrompt.unit.test.ts` :

```ts
describe("buildChatSystemPrompt — centre d'aide", () => {
  it("fait primer le centre d'aide sur le glossaire pour les questions d'aide", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: false,
      },
    });

    // Then
    expect(prompt).toContain("## consulter_centre_aide");
    expect(prompt).toContain("il prime sur le glossaire de ce prompt");
  });
});
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:server:unit src/server/albert/__tests__/systemPrompt`
Expected : FAIL sur `## consulter_centre_aide`.

- [ ] **Step 3 : modifier le prompt**

1. Dans « **Ce que tu peux faire :** », après
   `- Produire des synthèses et des rapports structurés`, ajouter :

```
- Expliquer le fonctionnement de PILOTE, ses notions et ses procédures, à partir du centre d'aide
```

2. À la fin de la ligne qui commence par
   `- Détailler le contenu des propositions de valeur d'avancement (PVA)` (elle
   se termine par `sans détailler leur contenu`), ajouter :

```
. Le **fonctionnement** des PVA (à quoi elles servent, comment les proposer ou les traiter) relève en revanche du centre d'aide : utilise \`consulter_centre_aide\`
```

3. Juste avant la ligne `## clarify_with_choices`, insérer :

```
## consulter_centre_aide
Le centre d'aide de PILOTE documente les notions, les méthodes de calcul et les procédures de l'outil. **Pour expliquer une notion ou une procédure à l'utilisateur, il prime sur le glossaire de ce prompt** : le glossaire sert à interpréter les résultats des outils, pas à répondre aux questions d'aide.

**Appelle** \`consulter_centre_aide\` dès que l'utilisateur demande :
- une définition (« qu'est-ce que le taux d'avancement ? », « que veut dire la météo ? ») ;
- comment une valeur est calculée ;
- comment faire quelque chose dans PILOTE (saisie, import, export, PVA, gestion des utilisateurs) ;
- comment fonctionne une page ou une fonctionnalité.

Ne réponds jamais à ces questions de mémoire, même si le glossaire semble suffire.

**Cas frontière** : après l'affichage d'une donnée, « comment est calculé ce taux ? » est une question d'aide. Appelle \`consulter_centre_aide\` avec une question autonome (« comment est calculé le taux d'avancement d'un indicateur »), puis applique la définition aux valeurs déjà présentes dans la conversation. Ne pose pas de question de clarification et ne rappelle pas d'outil de données si ces valeurs sont déjà là.

Suis les \`_output_instructions\` du résultat. N'écris jamais de lien vers le centre d'aide : les pages consultées sont affichées sous ta réponse.

```

4. Dans la liste « **N'utilise PAS** \`clarify_with_choices\` pour : », après
   `- une salutation ou une question générale sur ce que tu sais faire.`,
   remplacer le point final de cette ligne par une virgule et ajouter :

```
- une question de définition ou de calcul posée juste après l'affichage d'une donnée (« comment est calculé ce taux ? ») : appelle \`consulter_centre_aide\` (voir plus haut).
```

- [ ] **Step 4 : lancer le test pour vérifier qu'il passe**

Run : `pnpm test:server:unit src/server/albert/__tests__/systemPrompt`
Expected : PASS.

- [ ] **Step 5 : commit**

```bash
git add src/server/albert/systemPrompt.ts src/server/albert/__tests__/systemPrompt.unit.test.ts
git commit -m "feat: le prompt de l'assistant oriente les questions d'aide vers le centre d'aide (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : sources consultées et état de chargement

**Files :**
- Modify : `src/client/components/_commons/ChatUI/SourcesConsultees.tsx:12-42`
- Modify : `src/client/components/_commons/ChatUI/deriverEtatAssistant.ts`
- Test : `src/client/components/_commons/ChatUI/deriverEtatAssistant.unit.test.ts`

**Interfaces :**
- Consumes : `tool-consulter_centre_aide` dans `PiloteUITools` (tâche 4).
- Produces :
  - `EtatAssistant` gagne `"consulte-le-centre-d-aide"` ;
  - `SourceToolPart` inclut `tool-consulter_centre_aide`, avec le libellé
    « Centre d'aide ».

- [ ] **Step 1 : écrire le test qui échoue**

Dans `deriverEtatAssistant.unit.test.ts`, dans le `describe` :

```ts
  test("consulte le centre d'aide quand l'outil du centre d'aide est en cours", () => {
    // Given
    const dernier = message([
      {
        type: "tool-consulter_centre_aide",
        toolCallId: "appel-1",
        state: "input-available",
        input: { question: "comment est calculé le taux d'avancement" },
      },
    ]);

    // When
    const etat = deriverEtatAssistant({ message: dernier, status: "streaming" });

    // Then
    expect(etat).toBe("consulte-le-centre-d-aide");
  });
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:client:unit src/client/components/_commons/ChatUI/deriverEtatAssistant`
Expected : FAIL, reçu `"consulte-les-sources"`.

- [ ] **Step 3 : implémenter**

Dans `deriverEtatAssistant.ts` :

```ts
export type EtatAssistant =
  | "reflechit"
  | "consulte-les-sources"
  | "consulte-le-centre-d-aide"
  | "redige"
  | "compose-le-tableau-de-bord"
  | "genere-le-rapport";

export const LIBELLES_ETAT_ASSISTANT: Record<EtatAssistant, string> = {
  reflechit: "réfléchit",
  "consulte-les-sources": "consulte les sources",
  "consulte-le-centre-d-aide": "consulte le centre d'aide",
  redige: "rédige",
  "compose-le-tableau-de-bord": "compose le tableau de bord",
  "genere-le-rapport": "génère le rapport",
};
```

Et, juste après `if (derniere.type === "tool-export_rapport") return "genere-le-rapport";` :

```ts
  if (derniere.type === "tool-consulter_centre_aide") {
    return "consulte-le-centre-d-aide";
  }
```

Dans `SourcesConsultees.tsx`, ajouter `| "tool-consulter_centre_aide"` à
l'union de `SourceToolPart`, puis dans `LIBELLES` :

```ts
  "tool-consulter_centre_aide": "Centre d'aide",
```

- [ ] **Step 4 : lancer les tests pour vérifier qu'ils passent**

Run : `pnpm test:client:unit src/client/components/_commons/ChatUI && pnpm lint:tsc`
Expected : PASS, aucune erreur de type.

- [ ] **Step 5 : commit**

```bash
git add src/client/components/_commons/ChatUI/SourcesConsultees.tsx src/client/components/_commons/ChatUI/deriverEtatAssistant.ts src/client/components/_commons/ChatUI/deriverEtatAssistant.unit.test.ts
git commit -m "feat: le centre d'aide apparaît dans les sources et l'état de l'assistant (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : encart des pages et encart support

**Files :**
- Create : `src/client/components/_commons/Icones/ArrowRightLineIcon.tsx`
- Create : `src/client/components/_commons/ChatUI/CentreAideEncart.tsx`
- Modify : `src/client/components/_commons/ChatUI/AssistantMessageText.tsx:99-131` (extraction de `LienInterneAssistant`)
- Modify : `src/client/components/_commons/ChatUI/AssistantMessage.tsx` (rendu de l'encart, avant les choix)
- Test : `src/client/components/_commons/ChatUI/CentreAideEncart.integration.test.tsx`

**Interfaces :**
- Consumes : `ConsulterCentreAideOutput` (tâche 4) ; `BoutonContacterEquipePilote` ;
  `markCopyableBlock("text")`.
- Produces :
  - `LienInterneAssistant({ href, className, children })`, exporté par
    `AssistantMessageText.tsx` : navigation dans l'app et réduction du chat ;
  - `derniereConsultationCentreAide(parts): ConsulterCentreAideOutput | null` ;
  - `CentreAideEncart({ output })`.

- [ ] **Step 1 : écrire le test qui échoue**

```tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  CentreAideEncart,
  derniereConsultationCentreAide,
} from "@/components/_commons/ChatUI/CentreAideEncart";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

vi.mock("next/router", async () => await vi.importActual("next-router-mock"));
vi.mock("@/components/_commons/ChatUI/AlbertConversationProvider", () => ({
  useAlbertConversation: () => ({ minimize: vi.fn() }),
}));

const SOURCE_TAUX = {
  id: "taux",
  titre: "Le taux d'avancement",
  chemin: ["Introduction et notions clés"],
  url: "/centre-aide-pilote?article=taux",
};

test("liste les pages utilisées avec leur emplacement dans le centre d'aide", () => {
  // Given
  const output = {
    trouve: true,
    reponse: "TA = (VA − VI) / (VC − VI)",
    sources: [SOURCE_TAUX],
    _output_instructions: "",
  };

  // When
  render(<CentreAideEncart output={output} />);

  // Then
  expect(screen.getByText("Pour plus d'informations")).toBeInTheDocument();
  expect(screen.getByText("Introduction et notions clés")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Le taux d'avancement/ }),
  ).toHaveAttribute("href", "/centre-aide-pilote?article=taux");
});

test("propose de contacter l'équipe PILOTE quand le centre d'aide ne répond pas", () => {
  // Given
  const output = {
    trouve: false,
    reponse: "",
    sources: [],
    _output_instructions: "",
  };

  // When
  render(<CentreAideEncart output={output} />);

  // Then
  expect(
    screen.getByRole("link", { name: /Contacter l'équipe PILOTE/ }),
  ).toHaveAttribute("href", "mailto:pilote.ditp@modernisation.gouv.fr");
  expect(screen.queryByText("Pour plus d'informations")).not.toBeInTheDocument();
});

test("ne retient que la dernière consultation du centre d'aide d'un message", () => {
  // Given
  const consultation = (id: string, titre: string) => ({
    type: "tool-consulter_centre_aide" as const,
    toolCallId: id,
    state: "output-available" as const,
    input: { question: titre },
    output: {
      trouve: true,
      reponse: titre,
      sources: [{ ...SOURCE_TAUX, id, titre }],
      _output_instructions: "",
    },
  });
  const parts: PiloteUIMessage["parts"] = [
    consultation("premiere", "Première"),
    { type: "text", text: "Réponse" },
    consultation("seconde", "Seconde"),
  ];

  // When
  const derniere = derniereConsultationCentreAide(parts);

  // Then
  expect(derniere?.reponse).toBe("Seconde");
});
```

- [ ] **Step 2 : lancer le test pour vérifier qu'il échoue**

Run : `pnpm test:client:integration src/client/components/_commons/ChatUI/CentreAideEncart`
Expected : FAIL, module `CentreAideEncart` introuvable.

- [ ] **Step 3 : ajouter l'icône flèche**

`src/client/components/_commons/Icones/ArrowRightLineIcon.tsx` (Remix Icon
`arrow-right-line`) :

```tsx
export const ArrowRightLineIcon = ({
  fill = "currentColor",
  className,
}: {
  fill?: string;
  className?: string;
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
      fill={fill}
    />
  </svg>
);
```

- [ ] **Step 4 : extraire le lien interne de `AssistantMessageText.tsx`**

Remplacer `MarkdownLink` par :

```tsx
/**
 * Un lien vers une page de PILOTE depuis le chat : il navigue sans recharger
 * et réduit la conversation dans le dock.
 */
export const LienInterneAssistant = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) => {
  const router = useRouter();
  const { minimize } = useAlbertConversation();

  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        // Let middle-click, Ctrl/Cmd-click and "open in new tab" through.
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        minimize();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
};

const MarkdownLink = ({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) => {
  if (!href?.startsWith("/")) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return <LienInterneAssistant href={href}>{children}</LienInterneAssistant>;
};
```

- [ ] **Step 5 : écrire l'encart**

`src/client/components/_commons/ChatUI/CentreAideEncart.tsx` :

```tsx
import { BoutonContacterEquipePilote } from "@/components/PageAccueil/BoutonContacterEquipePilote";
import { Icone } from "@/components/_commons/Icone";
import { ArrowRightLineIcon } from "@/components/_commons/Icones/ArrowRightLineIcon";
import { Book2ContourIcon } from "@/components/_commons/Icones/Book2ContourIcon";
import { LienInterneAssistant } from "@/components/_commons/ChatUI/AssistantMessageText";
import { markCopyableBlock } from "@/components/_commons/ChatUI/copyResponse";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";

/**
 * L'agent peut consulter le centre d'aide plusieurs fois dans un tour : seul
 * le dernier résultat ferme la réponse.
 */
export const derniereConsultationCentreAide = (
  parts: PiloteUIMessage["parts"],
): ConsulterCentreAideOutput | null =>
  (parts ?? []).reduce<ConsulterCentreAideOutput | null>(
    (derniere, part) =>
      part.type === "tool-consulter_centre_aide" &&
      part.state === "output-available"
        ? part.output
        : derniere,
    null,
  );

export const CentreAideEncart = ({
  output,
}: {
  output: ConsulterCentreAideOutput;
}) => {
  if (!output.trouve || output.sources.length === 0) {
    return (
      <div
        className="flex flex-col items-start gap-2.5 border border-dsfr-grey-925 bg-dsfr-grey-1000 px-3.5 py-3"
        {...markCopyableBlock("text")}
      >
        <p className="mb-0 text-[13px] leading-5 text-dsfr-mention-grey">
          Une question sur PILOTE que le centre d&apos;aide ne couvre pas ?
          L&apos;équipe PILOTE vous répond par mail.
        </p>
        <BoutonContacterEquipePilote variant="secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" {...markCopyableBlock("text")}>
      <p className="mb-0 flex items-center gap-1.5 text-[13px] font-bold leading-5 text-dsfr-grey-200">
        <Icone className="h-4 w-4 text-primary" icone={Book2ContourIcon} />
        Pour plus d&apos;informations
      </p>
      <ul className="m-0 flex list-none flex-col border border-dsfr-grey-925 p-0">
        {output.sources.map((source) => (
          <li
            className="border-t border-dsfr-grey-925 p-0 first:border-t-0"
            key={source.id}
          >
            <LienInterneAssistant
              className="flex items-center gap-3 bg-none px-3 py-2.5 hover:bg-dsfr-alt-blue-france"
              href={source.url}
            >
              <span className="flex flex-col">
                {source.chemin.length > 0 && (
                  <span className="text-xs leading-[18px] text-dsfr-mention-grey">
                    {source.chemin.join(" › ")}
                  </span>
                )}
                <span className="text-sm font-semibold leading-5 text-primary">
                  {source.titre}
                </span>
              </span>
              <Icone
                className="ml-auto h-[18px] w-[18px] shrink-0 text-primary"
                icone={ArrowRightLineIcon}
              />
            </LienInterneAssistant>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

- [ ] **Step 6 : rendre l'encart dans `AssistantMessage.tsx`**

Importer `CentreAideEncart` et `derniereConsultationCentreAide`. Après
`const sources = parts.filter(estSourcePart);`, ajouter :

```tsx
  const consultationCentreAide = derniereConsultationCentreAide(parts);
```

Puis, juste avant le commentaire
`{/* Les choix ferment la réponse, même si le modèle a écrit du texte après l'appel. */}` :

```tsx
      {/* Sous le texte, qui suit l'appel de l'outil dans les parts. */}
      {consultationCentreAide && (
        <CentreAideEncart output={consultationCentreAide} />
      )}
```

- [ ] **Step 7 : lancer les tests pour vérifier qu'ils passent**

Run : `pnpm test:client:integration src/client/components/_commons/ChatUI/CentreAideEncart && pnpm test:client:unit src/client/components/_commons/ChatUI && pnpm lint:tsc`
Expected : PASS, 3 tests pour l'encart, les tests existants du chat restent
verts, aucune erreur de type.

- [ ] **Step 8 : vérifier dans le navigateur**

Lancer l'app (preview `pnpm dev`), ouvrir l'assistant en plein écran et poser
« Comment est calculé le taux d'avancement ? ». S'il faut des pages en local,
créer un groupe et une page publiés depuis `/panel-administrateur/centre-aide`.
Vérifier :
- la puce « Centre d'aide » dans les sources ;
- l'état « consulte le centre d'aide » pendant la recherche ;
- l'encart sous le texte : un clic réduit le chat et ouvre la page ;
- « Copier » inclut l'encart ;
- avec une question hors corpus, l'encart support et son bouton mailto.

Faire une capture de chaque cas.

- [ ] **Step 9 : commit**

```bash
git add src/client/components/_commons
git commit -m "feat: encart des pages du centre d'aide et du support sous la réponse (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : evals de niveau 2, sélection de l'outil

**Files :**
- Create : `evals/seedCentreAide.ts`
- Modify : `evals/world.ts:389-401` (`clearEvalWorld`)
- Modify : `evals/2-tools/toolSelectionEval.ts` (`FAMILLES`, seed du monde)
- Create : `evals/2-tools/2.4-aide/consulterCentreAide.eval.ts`

**Interfaces :**
- Produces (pour la tâche 9) :
  - `seedCentreAide(): Promise<void>` ;
  - `IDS_PAGES_VISIBLES: string[]` ;
  - `MARQUEURS_INVISIBLES: string[]` ;
  - `PAGE_TAUX`, `PAGE_IMPORT` (ids).

- [ ] **Step 1 : écrire le seed du centre d'aide**

`evals/seedCentreAide.ts` :

```ts
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

const GROUPE_NOTIONS = "0192a000-0000-7000-8000-0000000000a1";
export const PAGE_TAUX = "0192a000-0000-7000-8000-0000000000a2";
const PAGE_METEO = "0192a000-0000-7000-8000-0000000000a3";
const GROUPE_SAISIE = "0192a000-0000-7000-8000-0000000000b1";
export const PAGE_IMPORT = "0192a000-0000-7000-8000-0000000000b2";
const PAGE_IMPORT_MASQUEE = "0192a000-0000-7000-8000-0000000000b3";
const PAGE_EXPORT = "0192a000-0000-7000-8000-0000000000b4";
const GROUPE_ARCHIVES = "0192a000-0000-7000-8000-0000000000c1";
const PAGE_ARCHIVEE = "0192a000-0000-7000-8000-0000000000c2";

export const IDS_PAGES_VISIBLES = [
  PAGE_TAUX,
  PAGE_METEO,
  PAGE_IMPORT,
  PAGE_EXPORT,
];

/**
 * Chaque contenu invisible porte un marqueur : le retrouver dans une réponse
 * prouve une fuite.
 */
const MARQUEUR_MASQUE = "ZEPHYR-MASQUE";
const MARQUEUR_DEPUBLIE = "ZEPHYR-DEPUBLIE";
const MARQUEUR_BROUILLON = "ZEPHYR-BROUILLON";
export const MARQUEURS_INVISIBLES = [
  MARQUEUR_MASQUE,
  MARQUEUR_DEPUBLIE,
  MARQUEUR_BROUILLON,
];

/**
 * Un centre d'aide réduit, fictif, aux formulations propres : les evals
 * vérifient que l'assistant restitue CE contenu, pas qu'il connaît PILOTE.
 */
export async function seedCentreAide() {
  await getPrisma().article_centre_aide.createMany({
    data: [
      {
        id: GROUPE_NOTIONS,
        titre: "Introduction et notions clés",
        type: "GROUPE",
        ordre: 1,
        est_publie: true,
      },
      {
        id: PAGE_TAUX,
        titre: "Le taux d'avancement",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_NOTIONS,
        est_publie: true,
        contenu:
          "<p>Le taux d'avancement mesure la progression d'un indicateur entre sa valeur initiale (VI) et sa valeur cible (VC), au regard de sa valeur actuelle (VA).</p><h2>Pour un indicateur</h2><p>TA = (VA − VI) / (VC − VI) × 100. Le taux est plafonné à 100 %.</p><h2>Pour un chantier</h2><p>Le taux d'avancement d'un chantier est la moyenne des taux d'avancement de ses indicateurs, pondérée par le poids de chaque indicateur.</p>",
      },
      {
        id: PAGE_METEO,
        titre: "La météo d'un chantier",
        type: "PAGE",
        ordre: 2,
        parent_id: GROUPE_NOTIONS,
        est_publie: true,
        contenu:
          "<p>La météo exprime le niveau de confiance du responsable du chantier dans l'atteinte de ses objectifs. Elle est renseignée chaque mois.</p><h2>Les quatre niveaux</h2><ul><li>Objectifs sécurisés</li><li>Objectifs atteignables</li><li>Appuis nécessaires</li><li>Objectifs compromis</li></ul>",
      },
      {
        id: GROUPE_SAISIE,
        titre: "Saisie et import des données",
        type: "GROUPE",
        ordre: 2,
        est_publie: true,
      },
      {
        id: PAGE_IMPORT,
        titre: "Importer des mesures d'indicateurs",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        contenu:
          "<p>Les mesures d'indicateurs s'importent depuis la page « Import de mesures ».</p><h2>Étapes</h2><ol><li>Téléchargez le modèle de fichier.</li><li>Remplissez une ligne par mesure.</li><li>Déposez le fichier : PILOTE le vérifie avant de l'enregistrer.</li></ol>",
      },
      {
        id: PAGE_IMPORT_MASQUEE,
        titre: "Ancienne procédure d'import",
        type: "PAGE",
        ordre: 2,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        est_masque: true,
        contenu: `<p>Envoyez le fichier par mail au référent ${MARQUEUR_MASQUE}.</p>`,
      },
      {
        id: PAGE_EXPORT,
        titre: "Exporter les données",
        type: "PAGE",
        ordre: 3,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        contenu:
          "<p>Le bouton « Exporter » de la page d'un chantier télécharge ses données au format Excel.</p>",
        contenu_brouillon: `<p>Export au format CSV ${MARQUEUR_BROUILLON}.</p>`,
      },
      {
        id: GROUPE_ARCHIVES,
        titre: "Archives",
        type: "GROUPE",
        ordre: 3,
        est_publie: false,
      },
      {
        id: PAGE_ARCHIVEE,
        titre: "Procédure d'export 2024",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_ARCHIVES,
        est_publie: true,
        contenu: `<p>L'export se demandait par ticket ${MARQUEUR_DEPUBLIE}.</p>`,
      },
    ],
  });
}
```

- [ ] **Step 2 : vider le centre d'aide avec le monde**

Dans `evals/world.ts`, `clearEvalWorld`, en première ligne après
`const prisma = getPrisma();` :

```ts
  await prisma.article_centre_aide.deleteMany();
```

- [ ] **Step 3 : semer le centre d'aide pour toutes les suites de niveau 2**

Dans `evals/2-tools/toolSelectionEval.ts` :

```ts
import { seedCentreAide } from "../seedCentreAide";

const FAMILLES = {
  recherche: "2.1 · Recherche",
  donnees: "2.2 · Données",
  rendu: "2.3 · Rendu",
  aide: "2.4 · Aide",
};
```

Et dans le seed du monde, avant `return seeded;` :

```ts
    // L'outil du centre d'aide est toujours exposé : un cas négatif d'une
    // autre suite peut l'appeler, il doit trouver un vrai sommaire.
    await seedCentreAide();
```

- [ ] **Step 4 : écrire la suite**

`evals/2-tools/2.4-aide/consulterCentreAide.eval.ts` :

```ts
import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `consulter_centre_aide`.
 *
 * L'agent appelle l'outil pour une définition, un calcul ou une procédure.
 * Le piège principal : le glossaire du prompt définit déjà le taux
 * d'avancement et la météo, et l'agent est tenté de répondre de mémoire.
 *
 * Les négatifs sont des questions de données, y compris avec le vocabulaire
 * du glossaire (« en retard »).
 */

const ATTENDU = [{ toolName: "consulter_centre_aide" }];
const INTERDIT = ["consulter_centre_aide"];

const CASES: ToolCase[] = [
  {
    question: "Comment est calculé le taux d'avancement d'un chantier ?",
    reason: "définition aussi présente dans le glossaire : le centre d'aide prime",
    expected: ATTENDU,
  },
  {
    question: "Que signifie la météo d'un chantier ?",
    reason: "définition aussi présente dans le glossaire",
    expected: ATTENDU,
  },
  {
    question: "Comment importer les mesures de mes indicateurs ?",
    reason: "procédure de saisie et d'import",
    expected: ATTENDU,
  },
  {
    question: "Comment exporter les données d'un chantier ?",
    reason: "procédure d'export",
    expected: ATTENDU,
  },
  {
    question: "À quoi sert une proposition de valeur d'avancement ?",
    reason: "fonctionnement des PVA, pas leur contenu",
    expected: ATTENDU,
  },
  {
    question: "Comment donner accès à PILOTE à un collègue ?",
    reason: "gestion des utilisateurs",
    expected: ATTENDU,
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "donnée pure, vocabulaire d'une notion",
    forbidden: INTERDIT,
  },
  {
    question: "Quels sont les chantiers en retard en Bretagne ?",
    reason: "donnée pure, vocabulaire « en retard » du glossaire",
    forbidden: INTERDIT,
  },
  {
    question: "Quelle est l'ambition du CH-007 ?",
    reason: "objectifs d'un chantier, pas une question d'aide",
    forbidden: INTERDIT,
  },
];

toolSelectionEval({
  famille: "aide",
  tool: "consulter_centre_aide",
  cases: CASES,
});
```

- [ ] **Step 5 : lancer la suite et noter les scores**

Run : `pnpm eval evals/2-tools/2.4-aide`
Expected : la suite tourne sans erreur. Noter le score par cas dans le
message de commit. Si un positif est sous 2/3, ajuster la description de
l'outil ou la section du prompt (tâches 4 et 5), relancer, et noter les deux
runs. On ne change pas un cas pour faire monter le score.

- [ ] **Step 6 : vérifier que les autres suites de niveau 2 tiennent**

Run : `pnpm eval evals/2-tools/2.2-donnees`
Expected : aucun cas ne régresse à cause d'un appel à `consulter_centre_aide`.
Sinon, le noter et ajuster le prompt.

- [ ] **Step 7 : commit**

```bash
git add evals
git commit -m "test: evals de sélection de consulter_centre_aide (PIL-1863)

<scores par cas>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : evals de niveau 3, scénarios du centre d'aide

**Files :**
- Modify : `evals/3-scenarios/scenarioEval.ts` (`GROUPS`, option `seedSupplementaire`)
- Create : `evals/3-scenarios/3.3-centre-aide/centreAide.criteria.ts`
- Create : `evals/3-scenarios/3.3-centre-aide/questionCouverte.eval.ts`
- Create : `evals/3-scenarios/3.3-centre-aide/horsCorpus.eval.ts`
- Create : `evals/3-scenarios/3.3-centre-aide/casFrontiere.eval.ts`

**Interfaces :**
- Consumes : `seedCentreAide`, `IDS_PAGES_VISIBLES`, `MARQUEURS_INVISIBLES`,
  `PAGE_TAUX`, `PAGE_IMPORT` (tâche 8) ; `ConsulterCentreAideOutput` (tâche 4) ;
  `mechanical`, `judged`, `withBase` (`criterion.ts`).

- [ ] **Step 1 : ouvrir `scenarioEval` à un seed supplémentaire**

Dans `evals/3-scenarios/scenarioEval.ts` :

```ts
export const GROUPS = {
  synthese: "3.1 · Synthèse",
  comparaison: "3.2 · Comparaison",
  aide: "3.3 · Centre d'aide",
};
```

Ajouter le paramètre à `scenarioEval` :

```ts
  /** Données semées en plus du monde territorial, une fois par fichier. */
  seedSupplementaire,
```

typé `seedSupplementaire?: () => Promise<void>;`. Puis, dans `seedWorldPerFile`,
après `await seedMondeTerritorial({ authorId: seeded.userId });` :

```ts
    await seedSupplementaire?.();
```

- [ ] **Step 2 : écrire les critères**

`evals/3-scenarios/3.3-centre-aide/centreAide.criteria.ts` :

```ts
import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";
import { judged, mechanical, withBase, type Criterion } from "../criterion";
import type { Evidence } from "../evidence";
import {
  IDS_PAGES_VISIBLES,
  MARQUEURS_INVISIBLES,
} from "../../seedCentreAide";

const consultations = (evidence: Evidence) =>
  evidence.toolResults
    .filter((result) => result.toolName === "consulter_centre_aide")
    .map((result) => result.output as ConsulterCentreAideOutput);

const consulte = mechanical({
  id: "Centre d'aide consulté",
  rule: "consulter_centre_aide : appelle-le dès qu'une question porte sur une définition, un calcul ou une procédure",
  check: (evidence) => {
    const ok = evidence.toolCalls.some(
      (call) => call.toolName === "consulter_centre_aide",
    );
    return { ok, detail: ok ? "appelé" : "jamais appelé" };
  },
});

const sourcesVisibles = mechanical({
  id: "Sources visibles",
  rule: "Le centre d'aide ne s'appuie que sur les pages publiées et non masquées",
  check: (evidence) => {
    const invisibles = consultations(evidence)
      .flatMap((output) => output.sources)
      .filter((source) => !IDS_PAGES_VISIBLES.includes(source.id));
    return {
      ok: invisibles.length === 0,
      detail:
        invisibles.length === 0
          ? "toutes visibles"
          : `invisibles : ${invisibles.map((source) => source.titre).join(", ")}`,
    };
  },
});

const aucuneFuite = mechanical({
  id: "Aucune fuite",
  rule: "Jamais de contenu masqué, dépublié ou en brouillon",
  check: (evidence) => {
    const fuites = MARQUEURS_INVISIBLES.filter((marqueur) =>
      evidence.answer.includes(marqueur),
    );
    return {
      ok: fuites.length === 0,
      detail: fuites.length === 0 ? "aucune" : `fuite : ${fuites.join(", ")}`,
    };
  },
});

const pasDeLien = mechanical({
  id: "Pas de lien dans le texte",
  rule: "N'écris jamais de lien vers le centre d'aide : les pages sont affichées sous ta réponse",
  check: (evidence) => {
    const ok = !/centre-aide-pilote|https?:\/\//.test(evidence.answer);
    return { ok, detail: ok ? "aucun lien" : "lien écrit dans la réponse" };
  },
});

const fidele = judged({
  id: "Fidèle au centre d'aide",
  rule: "_output_instructions : restitue fidèlement `reponse`, sans la compléter avec le glossaire ni d'autres connaissances",
  instruction:
    "Compare la réponse au champ `reponse` du résultat de consulter_centre_aide. Chaque affirmation sur une notion ou une procédure de PILOTE doit s'y trouver. Une définition, une règle ou une étape absente de `reponse` est non conforme. Les valeurs chiffrées reprises de la conversation pour illustrer ne comptent pas comme des ajouts.",
  applicable: (evidence) =>
    consultations(evidence).some((output) => output.trouve),
});

/** Questions couvertes : la bonne page, citée, fidèlement restituée. */
export const pageAttendue = (pagesParQuestion: Record<string, string>) =>
  mechanical({
    id: "Bonne page",
    rule: "Le centre d'aide indique les pages utilisées",
    check: (evidence) => {
      const attendue = pagesParQuestion[evidence.question];
      const citees = consultations(evidence).flatMap((output) =>
        output.sources.map((source) => source.id),
      );
      const ok = citees.includes(attendue);
      return {
        ok,
        detail: ok ? "page attendue citée" : `citées : ${citees.join(", ") || "aucune"}`,
      };
    },
  });

export const criteresQuestionCouverte = (
  pagesParQuestion: Record<string, string>,
): Criterion[] =>
  withBase({
    criteria: [
      consulte,
      pageAttendue(pagesParQuestion),
      sourcesVisibles,
      aucuneFuite,
      pasDeLien,
      fidele,
    ],
  });

export const criteresHorsCorpus = (questionsSansReponse: string[]) =>
  withBase({
    criteria: [
      consulte,
      aucuneFuite,
      pasDeLien,
      mechanical({
        id: "Non trouvé",
        rule: "Si le centre d'aide ne permet pas de répondre, l'outil renvoie trouve: false",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
        check: (evidence) => {
          const ok = consultations(evidence).every((output) => !output.trouve);
          return { ok, detail: ok ? "non trouvé" : "une réponse a été trouvée" };
        },
      }),
      judged({
        id: "Limite signalée",
        rule: "_output_instructions (non trouvé) : dis que le centre d'aide ne couvre pas la question, sans affirmer de réponse",
        instruction:
          "La réponse dit que l'information n'est pas disponible dans le centre d'aide et n'affirme aucune réponse à la question, même partielle ou présentée comme probable. Une réponse tirée de connaissances générales est non conforme.",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
      }),
      judged({
        id: "Renvoi vers l'équipe PILOTE",
        rule: "_output_instructions (non trouvé) : indique que l'équipe PILOTE peut répondre",
        instruction:
          "La réponse oriente l'utilisateur vers l'équipe PILOTE (ou le support). Elle n'écrit pas d'adresse mail.",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
      }),
    ],
  });

export const criteresCasFrontiere = withBase({
  criteria: [
    consulte,
    sourcesVisibles,
    pasDeLien,
    fidele,
    judged({
      id: "Définition appliquée",
      rule: "Cas frontière : applique la définition aux valeurs déjà présentes dans la conversation",
      instruction:
        "La réponse donne la formule du taux d'avancement, puis l'applique aux valeurs VI, VA et VC de l'indicateur affichées au tour précédent, avec le résultat. Une définition seule, sans application aux valeurs, est non conforme. Une question de clarification au lieu d'une réponse est non conforme.",
    }),
  ],
});
```

- [ ] **Step 3 : écrire les trois scénarios**

`evals/3-scenarios/3.3-centre-aide/questionCouverte.eval.ts` :

```ts
import { scenarioEval } from "../scenarioEval";
import { PAGE_IMPORT, PAGE_TAUX, seedCentreAide } from "../../seedCentreAide";
import { criteresQuestionCouverte } from "./centreAide.criteria";

/**
 * Scénario « Question couverte par le centre d'aide » (PIL-1863). Une
 * définition que le glossaire du prompt connaît aussi, et une procédure qu'il
 * ne connaît pas. Le centre d'aide semé contient une page masquée, un groupe
 * dépublié et un brouillon, chacun marqué : rien ne doit en sortir.
 */

const QUESTION_TAUX = "Comment est calculé le taux d'avancement d'un chantier ?";
const QUESTION_IMPORT = "Comment importer les mesures de mes indicateurs ?";

scenarioEval({
  suite: "Question couverte par le centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresQuestionCouverte({
    [QUESTION_TAUX]: PAGE_TAUX,
    [QUESTION_IMPORT]: PAGE_IMPORT,
  }),
  cases: [
    {
      question: QUESTION_TAUX,
      reason: "définition concurrente du glossaire",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
    {
      question: QUESTION_IMPORT,
      reason: "procédure, avec une ancienne version masquée",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
```

`evals/3-scenarios/3.3-centre-aide/horsCorpus.eval.ts` :

```ts
import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresHorsCorpus } from "./centreAide.criteria";

/**
 * Scénario « Question hors du centre d'aide » (PIL-1863). La première
 * question n'a aucune page. La seconde n'a de réponse que dans une page
 * dépubliée : l'assistant ne doit ni la trouver ni en citer le contenu.
 */

const QUESTION_ALERTES =
  "Est-ce que je peux recevoir une alerte par mail quand un indicateur est mis à jour ?";
const QUESTION_ARCHIVE = "Comment se demandait l'export des données en 2024 ?";

scenarioEval({
  suite: "Question hors du centre d'aide",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresHorsCorpus([QUESTION_ALERTES]),
  cases: [
    {
      question: QUESTION_ALERTES,
      reason: "aucune page ne traite la question",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
    {
      question: QUESTION_ARCHIVE,
      reason: "réponse seulement dans un groupe dépublié",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "consulter_centre_aide" }],
    },
  ],
});
```

`evals/3-scenarios/3.3-centre-aide/casFrontiere.eval.ts` :

```ts
import { scenarioEval } from "../scenarioEval";
import { seedCentreAide } from "../../seedCentreAide";
import { criteresCasFrontiere } from "./centreAide.criteria";

/**
 * Scénario « Cas frontière aide / donnée » (PIL-1863, point d'attention de
 * la recette). Après l'affichage du taux d'un indicateur, « comment est
 * calculé ce taux ? » demande la définition ET son application aux valeurs
 * affichées, sans question de clarification.
 */

scenarioEval({
  suite: "Cas frontière aide / donnée",
  group: "aide",
  seedSupplementaire: seedCentreAide,
  criteria: criteresCasFrontiere,
  cases: [
    {
      history: ["Quel est le taux d'avancement de l'indicateur IND-894 en Bretagne ?"],
      question: "Comment est calculé ce taux ?",
      reason: "« ce taux » renvoie au tour précédent",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [{ toolName: "consulter_centre_aide" }],
      forbidden: ["clarify_with_choices"],
    },
  ],
});
```

- [ ] **Step 4 : vérifier le typage**

Run : `pnpm lint:tsc`
Expected : aucune erreur. Si `ScenarioCase` refuse un champ, s'aligner sur
son type dans `scenarioEval.ts`, qui fait foi.

- [ ] **Step 5 : lancer les scénarios et noter les scores**

Run : `pnpm eval evals/3-scenarios/3.3-centre-aide`
Expected : les trois suites tournent. Noter les scores par critère dans
l'en-tête de chaque `.eval.ts`, comme le font les suites 3.1 (« Référence
observée le 2026-10-… »). Les critères mécaniques « Aucune fuite » et
« Sources visibles » doivent être à 3/3 : sinon, c'est un bug de la règle de
visibilité. Pour les critères jugés, ajuster les prompts (tâches 4 et 5) si
c'est justifié, et consigner chaque run.

- [ ] **Step 6 : commit**

```bash
git add evals
git commit -m "test: scénarios de niveau 3 du centre d'aide (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 : vérification finale

- [ ] **Step 1 : lint complet**

Run : `pnpm lint`
Expected : oxlint, tsc et prettier passent. Sinon, `pnpm format` puis
`pnpm lint:fix`, et relancer.

- [ ] **Step 2 : tests unitaires et d'intégration**

Run : `pnpm test:unit && pnpm test:server:integration && pnpm test:client:integration`
Expected : tout passe.

- [ ] **Step 3 : evals rapides**

Run : `pnpm eval:rapide`
Expected : `1-keywords` passe. L'outil est toujours exposé et
`capacities.eval.ts` ne vérifie que les outils conditionnels.

- [ ] **Step 4 : commit des corrections éventuelles**

```bash
git add -A
git commit -m "chore: lint et format (PIL-1863)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Ne committer que s'il y a des corrections. Puis demander à Antoine s'il faut
lancer les e2e (`pnpm test:e2e`), car la feature est transverse.
