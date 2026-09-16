# Éditeur du centre d'aide ppg — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'éditeur du centre d'aide de `apps/pilote-ppg` par une édition live calquée sur kpilote — barre flottante, menu « / », arbre au glisser-déposer — et ouvrir la lecture de vidéo à `fichiers.numerique.gouv.fr`.

**Architecture:** Réécriture ciblée dans ppg avec ses propres primitives (`shared/Modale`, `registreIcones`, jetons Tailwind DSFR). Le contrat HTML des blocs callout / accordéon / icône est déjà identique à celui de kpilote, donc aucune migration de contenu n'est nécessaire ; seule la vidéo change de format, avec double tolérance au parsing. La logique de glisser-déposer et celle de réordonnancement serveur sont des unités pures, testées isolément.

**Tech Stack:** Next.js (pages router), React 19, tiptap 3.30.5, `@tiptap/suggestion`, `@dnd-kit/{core,sortable,utilities}`, tRPC, Prisma, Tailwind (DSFR), vitest.

**Spec:** `docs/superpowers/specs/2026-09-16-editeur-centre-aide-ppg-design.md`

## Global Constraints

- Gestionnaire de paquets : **pnpm** (v10). Jamais `npm`.
- Les paquets tiptap sont **épinglés à la version exacte `3.30.5`** dans `apps/pilote-ppg/package.json` (pas de `^`). Toute nouvelle dépendance tiptap suit cette règle.
- `apps/pilote-ppg` ne dépend d'**aucun** paquet `@pilote/kpilote-*`. Frontière volontaire : on copie et on adapte, on n'importe pas.
- Pas de `lucide-react` dans ppg : les icônes viennent de `src/client/components/_commons/Icones/` via `registreIcones`.
- Nommage : verbes et termes techniques en anglais, noms d'entités métier en français.
- Pas de couleurs en dur hors palette : utiliser les jetons Tailwind du projet (`primary`, `dsfr-*`) ou les utilitaires Tailwind standard déjà employés dans ces fichiers.
- Helper de classes : `clsxm` depuis `@/utils/clsxm`. Jamais `cn`.
- Pas de commentaires explicatifs superflus. Un commentaire n'existe que pour expliquer un « pourquoi » non évident.
- Tests client : `src/client/**/*.unit.test.{ts,tsx}` (`pnpm --filter @pilote/ppg test:client:unit`). Tests serveur : `src/server/**/*.unit.test.ts` (`pnpm --filter @pilote/ppg test:server:unit`).
- Aucun test end-to-end ni test de composant React n'est écrit dans ce plan : la validation de l'interface est manuelle.
- `pnpm lint` doit passer avant chaque commit.

---

### Task 1: Le sanitizer accepte le format vidéo cible

Le serveur passe tout contenu d'article dans `SanitizerHTML.sanitize`. Aujourd'hui il n'autorise sur `div` que `data-type`, `data-title`, `data-color`, `style` — donc un `data-src` serait effacé silencieusement, sans erreur, au premier enregistrement. Cette tâche prépare le terrain avant d'écrire quoi que ce soit côté éditeur.

**Files:**
- Modify: `apps/pilote-ppg/src/server/app/domain/SanitizerHTML.ts`
- Test: `apps/pilote-ppg/src/server/app/domain/SanitizerHTML.unit.test.ts` (créer)

**Interfaces:**
- Consomme : rien.
- Produit : `SanitizerHTML.sanitize(html: string): string` préserve désormais `div[data-type="video"][data-src]`, les balises `<video>` / `<source>`, et les iframes servies par `fichiers.numerique.gouv.fr`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/pilote-ppg/src/server/app/domain/SanitizerHTML.unit.test.ts` :

```ts
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

describe("SanitizerHTML", () => {
  it("Doit conserver le data-src d'un bloc vidéo", () => {
    const html =
      '<div data-type="video" data-src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"></div>';

    expect(SanitizerHTML.sanitize(html)).toContain(
      'data-src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"',
    );
  });

  it("Doit conserver une balise video avec ses contrôles", () => {
    const html =
      '<video src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4" controls preload="metadata"></video>';

    const sanitized = SanitizerHTML.sanitize(html);

    expect(sanitized).toContain("<video");
    expect(sanitized).toContain("controls");
    expect(sanitized).toContain('preload="metadata"');
  });

  it("Doit conserver une iframe servie par fichiers.numerique.gouv.fr", () => {
    const html =
      '<iframe src="https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4"></iframe>';

    expect(SanitizerHTML.sanitize(html)).toContain("fichiers.numerique.gouv.fr");
  });

  it("Doit toujours retirer la source d'une iframe d'un hôte non autorisé", () => {
    const html = '<iframe src="https://exemple.invalide/film.mp4"></iframe>';

    expect(SanitizerHTML.sanitize(html)).not.toContain("exemple.invalide");
  });

  it("Doit toujours retirer un script", () => {
    const html = '<p>Bonjour</p><script>alert("xss")</script>';

    const sanitized = SanitizerHTML.sanitize(html);

    expect(sanitized).toContain("<p>Bonjour</p>");
    expect(sanitized).not.toContain("script");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm --filter @pilote/ppg test:server:unit src/server/app/domain/SanitizerHTML.unit.test.ts`

Expected: FAIL — les trois premiers tests échouent (`data-src` absent, balise `video` supprimée, iframe purgée). Les deux derniers passent déjà.

- [ ] **Step 3: Élargir la liste blanche du sanitizer**

Dans `apps/pilote-ppg/src/server/app/domain/SanitizerHTML.ts` :

Ajouter `"video"` et `"source"` au tableau `allowedTags`, juste après `"iframe"`.

Dans `allowedAttributes`, remplacer la ligne `div` et ajouter deux entrées :

```ts
      div: ["data-type", "data-title", "data-color", "data-src", "style"],
      video: ["src", "controls", "preload", "poster", "width", "height"],
      source: ["src", "type"],
```

Dans `allowedSchemesByTag`, ajouter :

```ts
        video: ["http", "https"],
        source: ["http", "https"],
```

Remplacer `allowedIframeHostnames` par :

```ts
      allowedIframeHostnames: [
        "video.finances.gouv.fr",
        "fichiers.numerique.gouv.fr",
      ],
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm --filter @pilote/ppg test:server:unit src/server/app/domain/SanitizerHTML.unit.test.ts`

Expected: PASS — 5 tests.

- [ ] **Step 5: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server/app/domain/SanitizerHTML.ts apps/pilote-ppg/src/server/app/domain/SanitizerHTML.unit.test.ts
git commit -m "feat(centre-aide): autorise le format video cible dans le sanitizer"
```

---

### Task 2: Déplacement d'article par parent et index

Le glisser-déposer produit une cible `{ parentId, index }`, là où le use case attend aujourd'hui une des quatre actions `monter` / `descendre` / `sortir` / `entrer`. On remplace la signature et on supprime les quatre actions, qui n'auront plus d'appelant.

**Files:**
- Modify: `apps/pilote-ppg/src/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase.ts`
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts:138-151`
- Test: `apps/pilote-ppg/src/server/parametrage-centre-aide/__tests__/usecases/DeplacerArticleCentreAideUseCase.unit.test.ts` (créer)

**Interfaces:**
- Consomme : `ArticleCentreAideRepository.listerParParent(parentId)` (déjà trié par `ordre` croissant), `.recupererParId(id)`, `.modifierOrdreEtParent(id, ordre, parentId)`, `Transaction.run(fn)`.
- Produit :
  - `DeplacerArticleCentreAideUseCase.execute({ id: string; parentId: string | null; index: number }): Promise<void>`
  - Entrée tRPC `parametrageCentreAide.deplacer` : `{ id: string; parentId: string | null; index: number }`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/pilote-ppg/src/server/parametrage-centre-aide/__tests__/usecases/DeplacerArticleCentreAideUseCase.unit.test.ts` :

```ts
import { MockProxy, mock } from "vitest-mock-extended";
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { DeplacerArticleCentreAideUseCase } from "@/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase";
import { ArticleCentreAide } from "@/server/parametrage-centre-aide/domain/ArticleCentreAide";
import { Transaction } from "@/server/db/Transaction";

const creerArticle = (
  id: string,
  ordre: number,
  parentId: string | null = null,
  type: "GROUPE" | "PAGE" = "PAGE",
) =>
  ArticleCentreAide.creerArticle({
    id,
    titre: id,
    type,
    ordre,
    parentId,
  });

describe("DeplacerArticleCentreAideUseCase", () => {
  let deplacerArticleCentreAideUseCase: DeplacerArticleCentreAideUseCase;
  let articleCentreAideRepository: MockProxy<ArticleCentreAideRepository>;
  let transaction: MockProxy<Transaction>;

  beforeEach(() => {
    articleCentreAideRepository = mock<ArticleCentreAideRepository>();
    transaction = mock<Transaction>();
    transaction.run.mockImplementation(async (callback) => callback());
    deplacerArticleCentreAideUseCase = new DeplacerArticleCentreAideUseCase({
      articleCentreAideRepository,
      transaction,
    });
  });

  it("Doit réindexer la fratrie quand l'article change de position au même niveau", async () => {
    // Given
    const a = creerArticle("a", 0);
    const b = creerArticle("b", 1);
    const c = creerArticle("c", 2);
    articleCentreAideRepository.recupererParId.mockResolvedValue(c);
    articleCentreAideRepository.listerParParent.mockResolvedValue([a, b, c]);

    // When
    await deplacerArticleCentreAideUseCase.execute({
      id: "c",
      parentId: null,
      index: 0,
    });

    // Then
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("c", 0, null);
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("a", 1, null);
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("b", 2, null);
  });

  it("Doit réindexer les deux fratries quand l'article change de parent", async () => {
    // Given
    const groupe = creerArticle("groupe", 0, null, "GROUPE");
    const page = creerArticle("page", 1);
    const enfant = creerArticle("enfant", 0, "groupe");
    articleCentreAideRepository.recupererParId.mockImplementation(async (id) =>
      id === "page" ? page : id === "groupe" ? groupe : null,
    );
    articleCentreAideRepository.listerParParent.mockImplementation(
      async (parentId) =>
        parentId === null ? [groupe, page] : [enfant],
    );

    // When
    await deplacerArticleCentreAideUseCase.execute({
      id: "page",
      parentId: "groupe",
      index: 0,
    });

    // Then
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("page", 0, "groupe");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("enfant", 1, "groupe");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).toHaveBeenCalledWith("groupe", 0, null);
  });

  it("Doit refuser de déplacer un article sous l'un de ses descendants", async () => {
    // Given
    const parent = creerArticle("parent", 0, null, "GROUPE");
    const enfant = creerArticle("enfant", 0, "parent", "GROUPE");
    articleCentreAideRepository.recupererParId.mockImplementation(async (id) =>
      id === "parent" ? parent : id === "enfant" ? enfant : null,
    );

    // When / Then
    await expect(
      deplacerArticleCentreAideUseCase.execute({
        id: "parent",
        parentId: "enfant",
        index: 0,
      }),
    ).rejects.toThrow("Un article ne peut pas être déplacé sous lui-même");
    expect(
      articleCentreAideRepository.modifierOrdreEtParent,
    ).not.toHaveBeenCalled();
  });

  it("Doit remonter l'erreur quand l'article est introuvable", async () => {
    // Given
    articleCentreAideRepository.recupererParId.mockResolvedValue(null);

    // When / Then
    await expect(
      deplacerArticleCentreAideUseCase.execute({
        id: "inconnu",
        parentId: null,
        index: 0,
      }),
    ).rejects.toThrow("Article introuvable");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm --filter @pilote/ppg test:server:unit src/server/parametrage-centre-aide/__tests__/usecases/DeplacerArticleCentreAideUseCase.unit.test.ts`

Expected: FAIL — erreur de typage sur `execute({ id, parentId, index })`, qui attend encore `{ id, action }`.

- [ ] **Step 3: Réécrire le use case**

Remplacer intégralement le contenu de `apps/pilote-ppg/src/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase.ts` :

```ts
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import { Transaction } from "@/server/db/Transaction";
import type { Inject } from "@/server/parametrage-centre-aide/module";

export class DeplacerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  private transaction: Transaction;

  constructor({
    articleCentreAideRepository,
    transaction,
  }: Inject<"articleCentreAideRepository" | "transaction">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
    this.transaction = transaction;
  }

  async execute({
    id,
    parentId,
    index,
  }: {
    id: string;
    parentId: string | null;
    index: number;
  }) {
    const article = await this.articleCentreAideRepository.recupererParId(id);
    if (!article) throw new Error("Article introuvable");

    await this.verifierAbsenceDeCycle(id, parentId);

    const ancienParentId = article.parentId;
    const changeDeParent = ancienParentId !== parentId;

    const ancienneFratrie = (
      await this.articleCentreAideRepository.listerParParent(ancienParentId)
    ).filter((frere) => frere.id !== id);

    const nouvelleFratrie = changeDeParent
      ? (
          await this.articleCentreAideRepository.listerParParent(parentId)
        ).filter((frere) => frere.id !== id)
      : [...ancienneFratrie];

    const position = Math.max(0, Math.min(index, nouvelleFratrie.length));
    nouvelleFratrie.splice(position, 0, article);

    await this.transaction.run(async () => {
      for (const [ordre, frere] of nouvelleFratrie.entries()) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          frere.id,
          ordre,
          parentId,
        );
      }

      if (!changeDeParent) return;

      for (const [ordre, frere] of ancienneFratrie.entries()) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          frere.id,
          ordre,
          ancienParentId,
        );
      }
    });
  }

  private async verifierAbsenceDeCycle(
    id: string,
    parentId: string | null,
  ): Promise<void> {
    let ancetreId = parentId;
    while (ancetreId) {
      if (ancetreId === id) {
        throw new Error("Un article ne peut pas être déplacé sous lui-même");
      }
      const ancetre =
        await this.articleCentreAideRepository.recupererParId(ancetreId);
      ancetreId = ancetre?.parentId ?? null;
    }
  }
}
```

- [ ] **Step 4: Adapter la route tRPC**

Dans `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts`, remplacer le bloc `deplacer` :

```ts
  deplacer: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
        parentId: z.string().uuid().nullable(),
        index: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierAdmin(ctx.session.profil);

      return getContainer("parametrageCentreAide")
        .resolve("deplacerArticleCentreAideUseCase")
        .execute({
          id: input.id,
          parentId: input.parentId,
          index: input.index,
        });
    }),
```

- [ ] **Step 5: Adapter l'appelant front pour que le projet compile**

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts`, remplacer `deplacerArticle` :

```ts
  const deplacerArticle = useCallback(
    (id: string, cible: { parentId: string | null; index: number }) => {
      mutationDeplacer.mutate({ id, ...cible });
    },
    [mutationDeplacer],
  );
```

Dans `apps/pilote-ppg/src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`, supprimer la prop `onDeplacer` de `NoeudArbreProps` et de `ArborescenceCentreAideProps`, ainsi que le bloc de quatre boutons `{onDeplacer && (…)}` et le passage de `onDeplacer` aux enfants récursifs. L'arbre redevient un composant de lecture seule ; le glisser-déposer arrivera dans un composant dédié en tâche 5.

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx`, supprimer la prop `onDeplacer` de l'interface, du déstructurage et du passage à `<ArborescenceCentreAide>`.

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`, supprimer la ligne `onDeplacer={deplacerArticle}` et retirer `deplacerArticle` du déstructurage de `useEditionCentreAide()`. Il sera rebranché en tâche 5.

- [ ] **Step 6: Lancer les tests et la compilation**

Run: `pnpm --filter @pilote/ppg test:server:unit src/server/parametrage-centre-aide/`
Expected: PASS — les 4 nouveaux tests et les 3 fichiers de tests existants du dossier.

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/server apps/pilote-ppg/src/client/components/_commons/CentreAide apps/pilote-ppg/src/client/components/PagePanelAdministrateur
git commit -m "feat(centre-aide): deplace un article par parent et index"
```

---

### Task 3: Logique pure du glisser-déposer

Portage de `arbreDnd.ts` depuis kpilote sur les types de ppg. Aucune dépendance à React ni à `@dnd-kit` : c'est de la manipulation de listes, entièrement testable.

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/arbreDnd.ts`
- Test: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/arbreDnd.unit.test.ts`

**Interfaces:**
- Consomme : `ArticleCentreAideContrat` depuis `@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat`.
- Produit :
  - `type NoeudPlat = { id: string; parentId: string | null; depth: number; type: $Enums.TypeArticleCentreAide; article: ArticleCentreAideContrat }`
  - `aplatir(articles: ArticleCentreAideContrat[], replies: ReadonlySet<string>): NoeudPlat[]`
  - `retirerDescendants(plat: NoeudPlat[], id: string): NoeudPlat[]`
  - `type Projection = { depth: number; parentId: string | null; index: number }`
  - `projeter(plat: NoeudPlat[], activeId: string, overId: string, decalageX: number, indentation: number): Projection`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/arbreDnd.unit.test.ts` :

```ts
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import {
  aplatir,
  projeter,
  retirerDescendants,
} from "@/client/components/_commons/CentreAide/editeur/arbreDnd";

const article = (
  id: string,
  ordre: number,
  parentId: string | null = null,
  type: "GROUPE" | "PAGE" = "PAGE",
): ArticleCentreAideContrat => ({
  id,
  titre: id,
  contenu: null,
  titreBrouillon: null,
  contenuBrouillon: null,
  titreAffiche: null,
  titreAfficheBrouillon: null,
  type,
  ordre,
  parentId,
  estPublie: false,
  estMasque: false,
});

describe("aplatir", () => {
  it("Doit produire une liste en profondeur d'abord, triée par ordre", () => {
    const articles = [
      article("page-b", 1),
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(aplatir(articles, new Set()).map((noeud) => noeud.id)).toEqual([
      "groupe",
      "enfant",
      "page-b",
    ]);
  });

  it("Doit masquer les enfants d'un groupe replié", () => {
    const articles = [
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(
      aplatir(articles, new Set(["groupe"])).map((noeud) => noeud.id),
    ).toEqual(["groupe"]);
  });

  it("Doit calculer la profondeur de chaque nœud", () => {
    const articles = [
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(aplatir(articles, new Set()).map((noeud) => noeud.depth)).toEqual([
      0, 1,
    ]);
  });
});

describe("retirerDescendants", () => {
  it("Doit retirer les descendants du nœud déplacé, mais pas le nœud lui-même", () => {
    const plat = aplatir(
      [
        article("groupe", 0, null, "GROUPE"),
        article("enfant", 0, "groupe"),
        article("page", 1),
      ],
      new Set(),
    );

    expect(
      retirerDescendants(plat, "groupe").map((noeud) => noeud.id),
    ).toEqual(["groupe", "page"]);
  });
});

describe("projeter", () => {
  it("Doit rattacher au groupe précédent quand on décale vers la droite", () => {
    const plat = aplatir(
      [article("groupe", 0, null, "GROUPE"), article("page", 1)],
      new Set(),
    );

    expect(projeter(plat, "page", "page", 20, 20)).toMatchObject({
      depth: 1,
      parentId: "groupe",
      index: 0,
    });
  });

  it("Doit refuser une PAGE comme parent et rester au niveau frère", () => {
    const plat = aplatir(
      [article("page-a", 0), article("page-b", 1)],
      new Set(),
    );

    expect(projeter(plat, "page-b", "page-b", 20, 20)).toMatchObject({
      depth: 0,
      parentId: null,
    });
  });

  it("Doit rester à la racine quand on décale vers la gauche", () => {
    const plat = aplatir(
      [
        article("groupe", 0, null, "GROUPE"),
        article("enfant", 0, "groupe"),
      ],
      new Set(),
    );

    expect(projeter(plat, "enfant", "enfant", -20, 20)).toMatchObject({
      depth: 0,
      parentId: null,
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm --filter @pilote/ppg test:client:unit src/client/components/_commons/CentreAide/editeur/arbreDnd.unit.test.ts`

Expected: FAIL — module `arbreDnd` introuvable.

- [ ] **Step 3: Écrire la logique**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/arbreDnd.ts` :

```ts
import { $Enums } from "@prisma/client";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

export type NoeudPlat = {
  id: string;
  parentId: string | null;
  depth: number;
  type: $Enums.TypeArticleCentreAide;
  article: ArticleCentreAideContrat;
};

export type Projection = {
  depth: number;
  parentId: string | null;
  index: number;
};

const deplacer = <T>(liste: T[], de: number, vers: number): T[] => {
  const copie = [...liste];
  const [element] = copie.splice(de, 1);
  if (element !== undefined) copie.splice(vers, 0, element);
  return copie;
};

export const aplatir = (
  articles: ArticleCentreAideContrat[],
  replies: ReadonlySet<string>,
): NoeudPlat[] => {
  const enfantsDe = new Map<string | null, ArticleCentreAideContrat[]>();
  for (const article of articles) {
    const liste = enfantsDe.get(article.parentId) ?? [];
    liste.push(article);
    enfantsDe.set(article.parentId, liste);
  }
  for (const liste of enfantsDe.values()) {
    liste.sort((a, b) => a.ordre - b.ordre);
  }

  const sortie: NoeudPlat[] = [];
  const parcourir = (parentId: string | null, depth: number): void => {
    for (const article of enfantsDe.get(parentId) ?? []) {
      sortie.push({
        id: article.id,
        parentId: article.parentId,
        depth,
        type: article.type,
        article,
      });
      if (!replies.has(article.id)) parcourir(article.id, depth + 1);
    }
  };
  parcourir(null, 0);
  return sortie;
};

export const retirerDescendants = (
  plat: NoeudPlat[],
  id: string,
): NoeudPlat[] => {
  const index = plat.findIndex((noeud) => noeud.id === id);
  if (index === -1) return plat;
  const base = plat[index]?.depth ?? 0;
  const aRetirer = new Set<string>();
  for (let i = index + 1; i < plat.length && (plat[i]?.depth ?? 0) > base; i++) {
    const noeud = plat[i];
    if (noeud) aRetirer.add(noeud.id);
  }
  return plat.filter((noeud) => !aRetirer.has(noeud.id));
};

export const projeter = (
  plat: NoeudPlat[],
  activeId: string,
  overId: string,
  decalageX: number,
  indentation: number,
): Projection => {
  const indexOver = plat.findIndex((noeud) => noeud.id === overId);
  const indexActive = plat.findIndex((noeud) => noeud.id === activeId);
  const active = plat[indexActive];
  if (!active || indexOver === -1) {
    return { depth: 0, parentId: null, index: 0 };
  }

  const nouveaux = deplacer(plat, indexActive, indexOver);
  const precedent = nouveaux[indexOver - 1];
  const suivant = nouveaux[indexOver + 1];

  const profondeurDrag = Math.round(decalageX / indentation);
  const projetee = active.depth + profondeurDrag;
  const maxDepth = precedent
    ? precedent.type === "GROUPE"
      ? precedent.depth + 1
      : precedent.depth
    : 0;
  const minDepth = suivant ? suivant.depth : 0;
  const depth = Math.max(minDepth, Math.min(projetee, maxDepth));

  const parentId = ((): string | null => {
    if (depth === 0 || !precedent) return null;
    if (depth === precedent.depth) return precedent.parentId;
    if (depth > precedent.depth) return precedent.id;
    const ancetre = nouveaux
      .slice(0, indexOver)
      .reverse()
      .find((noeud) => noeud.depth === depth);
    return ancetre?.parentId ?? null;
  })();

  let index = 0;
  for (let i = 0; i < indexOver; i++) {
    const noeud = nouveaux[i];
    if (!noeud || noeud.id === activeId) continue;
    if (noeud.parentId === parentId) index++;
  }

  return { depth, parentId, index };
};
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm --filter @pilote/ppg test:client:unit src/client/components/_commons/CentreAide/editeur/arbreDnd.unit.test.ts`

Expected: PASS — 7 tests.

- [ ] **Step 5: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur
git commit -m "feat(centre-aide): ajoute la logique de projection du glisser-deposer"
```

---

### Task 4: Arborescence d'administration au glisser-déposer

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/ArbreCentreAideDnd.tsx`
- Modify: `apps/pilote-ppg/package.json`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`

**Interfaces:**
- Consomme : `aplatir`, `retirerDescendants`, `projeter`, `NoeudPlat` (tâche 3) ; `deplacerArticle(id, { parentId, index })` de `useEditionCentreAide` (tâche 2).
- Produit : `<ArbreCentreAideDnd articles={ArticleCentreAideContrat[]} selectionneId={string | null} onSelectionner={(id: string) => void} onDeplacer={(id: string, cible: { parentId: string | null; index: number }) => void} />`

- [ ] **Step 1: Installer les dépendances de glisser-déposer**

```bash
pnpm --filter @pilote/ppg add @dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0 @dnd-kit/utilities@^3.2.2
```

- [ ] **Step 2: Écrire le composant**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/ArbreCentreAideDnd.tsx` :

```tsx
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FunctionComponent, useMemo, useState } from "react";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import { clsxm } from "@/utils/clsxm";
import {
  aplatir,
  projeter,
  retirerDescendants,
  type NoeudPlat,
} from "./arbreDnd";

const INDENTATION = 20;

type CibleDeplacement = { parentId: string | null; index: number };

interface ArbreCentreAideDndProps {
  articles: ArticleCentreAideContrat[];
  selectionneId: string | null;
  onSelectionner: (id: string) => void;
  onDeplacer: (id: string, cible: CibleDeplacement) => void;
}

export const ArbreCentreAideDnd: FunctionComponent<ArbreCentreAideDndProps> = ({
  articles,
  selectionneId,
  onSelectionner,
  onDeplacer,
}) => {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [decalageX, setDecalageX] = useState(0);

  const platComplet = useMemo(
    () => aplatir(articles, replies),
    [articles, replies],
  );
  const plat = useMemo(
    () => (activeId ? retirerDescendants(platComplet, activeId) : platComplet),
    [platComplet, activeId],
  );
  const projection =
    activeId && overId
      ? projeter(plat, activeId, overId, decalageX, INDENTATION)
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const idsAvecEnfants = useMemo(() => {
    const identifiants = new Set<string>();
    for (const article of articles) {
      if (article.parentId) identifiants.add(article.parentId);
    }
    return identifiants;
  }, [articles]);

  const reinitialiser = () => {
    setActiveId(null);
    setOverId(null);
    setDecalageX(0);
  };

  const surDebut = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setOverId(String(event.active.id));
  };

  const surMouvement = (event: DragMoveEvent) => setDecalageX(event.delta.x);

  const surSurvol = (event: DragOverEvent) =>
    setOverId(event.over ? String(event.over.id) : null);

  const surFin = (_event: DragEndEvent) => {
    if (activeId && projection) {
      onDeplacer(activeId, {
        parentId: projection.parentId,
        index: projection.index,
      });
    }
    reinitialiser();
  };

  const basculerRepli = (id: string) =>
    setReplies((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });

  if (plat.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-gray-400">
        Aucun article. Créez un groupe ou une page.
      </p>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={reinitialiser}
      onDragEnd={surFin}
      onDragMove={surMouvement}
      onDragOver={surSurvol}
      onDragStart={surDebut}
      sensors={sensors}
    >
      <SortableContext
        items={plat.map((noeud) => noeud.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="select-none overflow-y-auto">
          {plat.map((noeud) => (
            <LigneArbre
              aEnfants={idsAvecEnfants.has(noeud.id)}
              depth={
                activeId === noeud.id && projection
                  ? projection.depth
                  : noeud.depth
              }
              key={noeud.id}
              noeud={noeud}
              onBasculerRepli={basculerRepli}
              onSelectionner={onSelectionner}
              replie={replies.has(noeud.id)}
              selectionne={selectionneId === noeud.id}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

const LigneArbre: FunctionComponent<{
  noeud: NoeudPlat;
  depth: number;
  selectionne: boolean;
  replie: boolean;
  aEnfants: boolean;
  onSelectionner: (id: string) => void;
  onBasculerRepli: (id: string) => void;
}> = ({
  noeud,
  depth,
  selectionne,
  replie,
  aEnfants,
  onSelectionner,
  onBasculerRepli,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: noeud.id });
  const estGroupe = noeud.type === "GROUPE";
  const titre =
    noeud.article.titreBrouillon || noeud.article.titre || "(sans titre)";

  return (
    <li
      className={clsxm("list-none", isDragging && "opacity-50")}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div
        className={clsxm(
          "group relative flex cursor-pointer items-center gap-1 rounded py-1.5 pr-2 text-sm",
          selectionne
            ? "bg-blue-50 font-medium text-blue-700"
            : "text-gray-700 hover:bg-gray-50",
          noeud.article.estMasque && "opacity-50",
        )}
        onClick={() => onSelectionner(noeud.id)}
        style={{ paddingLeft: depth * INDENTATION + 6 }}
      >
        <button
          aria-label="Déplacer"
          className="flex cursor-grab px-0.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
          type="button"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="text-xs">
            ⠿
          </span>
        </button>

        {estGroupe && aEnfants ? (
          <button
            aria-label={replie ? "Déplier" : "Replier"}
            className="flex w-3.5 shrink-0 text-gray-400"
            onClick={(event) => {
              event.stopPropagation();
              onBasculerRepli(noeud.id);
            }}
            type="button"
          >
            <span
              className={clsxm(
                "inline-block text-xs transition-transform",
                !replie && "rotate-90",
              )}
            >
              ▸
            </span>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className={clsxm("flex-1 truncate", estGroupe && "font-semibold")}>
          {titre}
        </span>

        <span
          className={clsxm(
            "size-1.5 shrink-0 rounded-full",
            noeud.article.estPublie ? "bg-green-500" : "bg-yellow-400",
          )}
          title={noeud.article.estPublie ? "Publié" : "Brouillon"}
        />
      </div>
    </li>
  );
};
```

- [ ] **Step 3: Brancher le nouvel arbre dans l'administration**

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx` :

- Remplacer l'import `ArborescenceCentreAide` par
  `import { ArbreCentreAideDnd } from "@/components/_commons/CentreAide/editeur/ArbreCentreAideDnd";`
- Remplacer l'import de `NoeudArbre` par
  `import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";`
- Remplacer la prop `arbre: NoeudArbre[]` par `articles: ArticleCentreAideContrat[]`
- Rétablir la prop `onDeplacer: (id: string, cible: { parentId: string | null; index: number }) => void`
- Remplacer le bloc `<ArborescenceCentreAide … />` final par :

```tsx
      <ArbreCentreAideDnd
        articles={articles}
        onDeplacer={onDeplacer}
        onSelectionner={onSelectionItem}
        selectionneId={itemSelectionneId}
      />
```

Dans `PagePanelAdministrateurCentreAide.tsx`, récupérer `articles` et `deplacerArticle` depuis `useEditionCentreAide()` et passer :

```tsx
            <ArborescenceCentreAideAdmin
              articles={articles}
              itemSelectionneId={itemSelectionneId}
              onCreerGroupe={creerGroupe}
              onCreerPage={creerPage}
              onDeplacer={deplacerArticle}
              onSelectionItem={selectionnerItem}
            />
```

- [ ] **Step 4: Vérifier la compilation et les tests**

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur.

Run: `pnpm --filter @pilote/ppg test:unit`
Expected: PASS.

- [ ] **Step 5: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/package.json pnpm-lock.yaml apps/pilote-ppg/src/client/components
git commit -m "feat(centre-aide): reordonne l'arborescence au glisser-deposer"
```

---

### Task 5: Lecteur vidéo commun et format de nœud aligné

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/LecteurVideo.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/extensions/VideoExtension.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx`
- Test: `apps/pilote-ppg/src/client/components/_commons/CentreAide/LecteurVideo.unit.test.ts`

**Interfaces:**
- Consomme : rien des tâches précédentes.
- Produit :
  - `estUrlHttpSure(url: string): boolean`
  - `sansAutoplay(url: string): string`
  - `estFichierVideoDirect(url: string): boolean`
  - `<LecteurVideo src={string} titre?={string} className?={string} />`
  - Commande tiptap `insertVideo({ src: string })` — **remplace** l'ancienne `setVideo`
  - Format sérialisé : `<div data-type="video" data-src="…"></div>`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/LecteurVideo.unit.test.ts` :

```ts
import {
  estFichierVideoDirect,
  estUrlHttpSure,
  sansAutoplay,
} from "@/client/components/_commons/CentreAide/LecteurVideo";

describe("estUrlHttpSure", () => {
  it("Doit accepter une URL https", () => {
    expect(estUrlHttpSure("https://video.finances.gouv.fr/x")).toBe(true);
  });

  it("Doit refuser un schéma javascript", () => {
    expect(estUrlHttpSure("javascript:alert(1)")).toBe(false);
  });

  it("Doit refuser une chaîne qui n'est pas une URL", () => {
    expect(estUrlHttpSure("pas une url")).toBe(false);
  });
});

describe("sansAutoplay", () => {
  it("Doit retirer les paramètres d'autoplay", () => {
    expect(
      sansAutoplay("https://video.finances.gouv.fr/x?autoplay=1&start=3"),
    ).toBe("https://video.finances.gouv.fr/x?start=3");
  });

  it("Doit laisser intacte une URL sans autoplay", () => {
    expect(sansAutoplay("https://video.finances.gouv.fr/x")).toBe(
      "https://video.finances.gouv.fr/x",
    );
  });
});

describe("estFichierVideoDirect", () => {
  it("Doit reconnaître un média servi par fichiers.numerique.gouv.fr", () => {
    expect(
      estFichierVideoDirect(
        "https://fichiers.numerique.gouv.fr/media/preview/item/abc/film.mp4",
      ),
    ).toBe(true);
  });

  it("Doit refuser un hôte d'intégration classique", () => {
    expect(estFichierVideoDirect("https://video.finances.gouv.fr/x")).toBe(
      false,
    );
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm --filter @pilote/ppg test:client:unit src/client/components/_commons/CentreAide/LecteurVideo.unit.test.ts`

Expected: FAIL — module `LecteurVideo` introuvable.

- [ ] **Step 3: Écrire le lecteur**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/LecteurVideo.tsx` :

```tsx
import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";

const HOTE_FICHIERS = "fichiers.numerique.gouv.fr";
const PARAMETRES_AUTOPLAY = ["autoplay", "auto_play", "autostart"];

export const estUrlHttpSure = (url: string): boolean => {
  try {
    const protocole = new URL(url).protocol;
    return protocole === "http:" || protocole === "https:";
  } catch {
    return false;
  }
};

export const sansAutoplay = (url: string): string => {
  try {
    const analysee = new URL(url);
    for (const parametre of PARAMETRES_AUTOPLAY) {
      analysee.searchParams.delete(parametre);
    }
    return analysee.toString().replace(/\?$/, "");
  } catch {
    return url;
  }
};

export const estFichierVideoDirect = (url: string): boolean => {
  try {
    return new URL(url).hostname === HOTE_FICHIERS;
  } catch {
    return false;
  }
};

export const LecteurVideo: FunctionComponent<{
  src: string;
  titre?: string;
  className?: string;
}> = ({ src, titre, className }) => {
  if (!estUrlHttpSure(src)) return null;

  if (estFichierVideoDirect(src)) {
    return (
      <video
        className={clsxm("w-full rounded max-w-[560px]", className)}
        controls
        preload="metadata"
        src={src}
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <div
      className={clsxm(
        "aspect-video w-full max-w-[560px] overflow-hidden rounded",
        className,
      )}
    >
      <iframe
        allowFullScreen
        className="size-full"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        src={sansAutoplay(src)}
        title={titre ?? "Lecteur vidéo"}
      />
    </div>
  );
};
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm --filter @pilote/ppg test:client:unit src/client/components/_commons/CentreAide/LecteurVideo.unit.test.ts`

Expected: PASS — 7 tests.

- [ ] **Step 5: Réécrire l'extension vidéo**

Remplacer intégralement `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/extensions/VideoExtension.tsx` :

```tsx
import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { LecteurVideo } from "@/client/components/_commons/CentreAide/LecteurVideo";

function VideoNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? "";

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      {src ? (
        <LecteurVideo src={src} />
      ) : (
        <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Vidéo sans URL
        </div>
      )}
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: { src: string }) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-src") ??
          element.getAttribute("src") ??
          "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-src": attributes.src,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }, { tag: "iframe[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "video" }, HTMLAttributes)];
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src: attrs.src } }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});
```

La double entrée de `parseHTML` est ce qui fait remonter les anciens articles — stockés en `<iframe src>` — dans le nouveau nœud ; ils seront réécrits au format `data-src` au prochain enregistrement.

- [ ] **Step 6: Rendre la vidéo côté lecture**

Dans `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx` :

Ajouter l'import :

```ts
import { LecteurVideo } from "@/client/components/_commons/CentreAide/LecteurVideo";
```

Dans `renderNode`, juste après le bloc `if (dataType === "icone") { … }`, ajouter :

```tsx
  if (dataType === "video") {
    const src = element.getAttribute("data-src");
    if (!src) return null;
    return <LecteurVideo src={src} />;
  }
```

Et pour que les articles pas encore réenregistrés s'affichent avec le même lecteur, ajouter juste avant `const tag = element.tagName.toLowerCase();` :

```tsx
  if (element.tagName === "IFRAME") {
    const src = element.getAttribute("src");
    if (!src) return null;
    return <LecteurVideo src={src} titre={element.getAttribute("title") ?? undefined} />;
  }
```

- [ ] **Step 7: Vérifier la compilation et les tests**

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur. `setVideo` n'a aucun appelant hors de `MenuBar.tsx` ; si `tsc` en signale un, remplacer l'appel par `insertVideo({ src })`.

Run: `pnpm --filter @pilote/ppg test:unit`
Expected: PASS.

- [ ] **Step 8: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/client/components/_commons
git commit -m "feat(centre-aide): unifie le rendu video derriere un lecteur commun"
```

---

### Task 6: Insertion d'une vidéo hébergée sur fichiers.numerique.gouv.fr

`ModaleInsertionUrl` sait déjà reconstruire une URL de média à partir d'un lien de partage : c'est le mode « Fichiers numériques » utilisé pour les images. Il suffit de l'ouvrir au type `video`, aujourd'hui bridé par une liste d'extensions vide et un unique domaine autorisé.

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx:4-15`

**Interfaces:**
- Consomme : rien des tâches précédentes.
- Produit : `<ModaleInsertionUrl type="video">` propose les deux modes et accepte les hôtes `video.finances.gouv.fr` et `fichiers.numerique.gouv.fr`.

- [ ] **Step 1: Ouvrir le type vidéo aux fichiers numériques**

Dans `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx`, remplacer les deux constantes de tête :

```ts
const EXTENSIONS_PAR_TYPE = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
  lien: ["pdf", "xlsx", "ods", "docx", "odt", "csv"],
  video: ["mp4", "webm"],
} as const;

type TypeInsertion = keyof typeof EXTENSIONS_PAR_TYPE;

const DOMAINES_AUTORISES_PAR_TYPE: Partial<Record<TypeInsertion, string[]>> = {
  image: ["fichiers.numerique.gouv.fr"],
  video: ["video.finances.gouv.fr", "fichiers.numerique.gouv.fr"],
};
```

- [ ] **Step 2: Adapter le libellé du champ de nom**

Toujours dans le même fichier, remplacer le `placeholder` du champ `nom-fichier` par `"ma_video"` quand le type est `video` :

```tsx
                placeholder={type === "video" ? "ma_video" : "mon_image"}
```

Rappel : le service refuse les accents et les espaces dans les noms de fichier — le placeholder doit rester en snake_case.

- [ ] **Step 3: Vérifier la compilation**

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx
git commit -m "feat(centre-aide): accepte une video hebergee sur fichiers.numerique.gouv.fr"
```

---

### Task 7: Registre de blocs et menu « / »

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/blocs.tsx`
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/SlashCommand.tsx`
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/index.ts`
- Test: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/miseEnTitre.unit.test.ts`
- Modify: `apps/pilote-ppg/package.json`

**Interfaces:**
- Consomme : `insertVideo({ src })` (tâche 5) ; `insertCallout({ color })`, `insertAccordion()`, `insertIcone({ type })` des extensions existantes de `_commons/EditeurRiche/extensions/` ; `registreIcones` et `listeIcones` de `_commons/EditeurRiche/registreIcones`.
- Produit :
  - `type OptionBloc = { label: string; keywords: string; Icone: ComponentType<{ className?: string; fill?: string }>; run?: () => void; sousOptions?: OptionBloc[] }`
  - `type ActionsBlocs = { ouvrirImage?: () => void; ouvrirVideo?: () => void; ouvrirLien?: () => void; ouvrirIcone?: () => void }`
  - `construireOptionsBlocs(editor: Editor, actions: ActionsBlocs): OptionBloc[]`
  - `SlashCommand` (extension tiptap, configurée par `ActionsBlocs`)
  - `extensionsCentreAide(actions?: ActionsBlocs, placeholder?: string): Extensions`

- [ ] **Step 1: Installer @tiptap/suggestion**

```bash
pnpm --filter @pilote/ppg add @tiptap/suggestion@3.30.5
```

Vérifier que `apps/pilote-ppg/package.json` porte bien `"@tiptap/suggestion": "3.30.5"` sans accent circonflexe, comme les autres paquets tiptap.

- [ ] **Step 2: Écrire le registre de blocs**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/blocs.tsx` :

```tsx
import type { Editor } from "@tiptap/react";
import type { ComponentType } from "react";
import { registreIcones } from "@/components/_commons/EditeurRiche/registreIcones";

type ComposantIcone = ComponentType<{ className?: string; fill?: string }>;

export type OptionBloc = {
  label: string;
  keywords: string;
  Icone: ComposantIcone;
  run?: () => void;
  sousOptions?: OptionBloc[];
};

export type ActionsBlocs = {
  ouvrirImage?: () => void;
  ouvrirVideo?: () => void;
  ouvrirLien?: () => void;
  ouvrirIcone?: () => void;
};

const icone = (nom: string): ComposantIcone =>
  registreIcones[nom] ?? registreIcones.InformationPleineIcon;

const COULEURS_CALLOUT = [
  { color: "info", label: "Info", icone: "InformationPleineIcon" },
  { color: "success", label: "Succès", icone: "CheckboxCirclePleineIcon" },
  { color: "warning", label: "Attention", icone: "WarningIcon" },
  { color: "error", label: "Alerte", icone: "ErrorWarningIcon" },
] as const;

export const construireOptionsBlocs = (
  editor: Editor,
  actions: ActionsBlocs = {},
): OptionBloc[] => [
  {
    label: "Encadré",
    keywords: "callout encadre info alerte",
    Icone: icone("InformationPleineIcon"),
    sousOptions: COULEURS_CALLOUT.map((variante) => ({
      label: variante.label,
      keywords: `callout ${variante.label.toLowerCase()}`,
      Icone: icone(variante.icone),
      run: () =>
        editor.chain().focus().insertCallout({ color: variante.color }).run(),
    })),
  },
  {
    label: "Accordéon",
    keywords: "accordeon depliant",
    Icone: icone("ArrowDownCircleIcon"),
    run: () => editor.chain().focus().insertAccordion().run(),
  },
  {
    label: "Image",
    keywords: "image photo",
    Icone: icone("ImageIcon"),
    run: () => actions.ouvrirImage?.(),
  },
  {
    label: "Vidéo",
    keywords: "video film fichier",
    Icone: icone("VideoIcon"),
    run: () => actions.ouvrirVideo?.(),
  },
  {
    label: "Lien",
    keywords: "lien url link",
    Icone: icone("LinkIcon"),
    run: () => actions.ouvrirLien?.(),
  },
  {
    label: "Icône",
    keywords: "icone pictogramme",
    Icone: icone("InformationPleineIcon"),
    run: () => actions.ouvrirIcone?.(),
  },
  {
    label: "Titre",
    keywords: "titre heading h1 h2 h3 h4 h5 h6",
    Icone: icone("FontSizeIcon"),
    sousOptions: ([1, 2, 3, 4, 5, 6] as const).map((niveau) => ({
      label: `Titre H${niveau}`,
      keywords: `titre h${niveau}`,
      Icone: icone("FontSizeIcon"),
      run: () => editor.chain().focus().toggleHeading({ level: niveau }).run(),
    })),
  },
  {
    label: "Liste à puces",
    keywords: "liste puces bullet",
    Icone: icone("ListUnorderedIcon"),
    run: () => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Liste numérotée",
    keywords: "liste numerotee ordered",
    Icone: icone("ListOrderedIcon"),
    run: () => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Séparateur",
    keywords: "separateur trait ligne horizontal",
    Icone: icone("SubtractLineIcon"),
    run: () => editor.chain().focus().setHorizontalRule().run(),
  },
];
```

Les noms d'icônes ci-dessus doivent exister dans `registreIcones`. Avant d'écrire le fichier, vérifier lesquels sont disponibles :

```bash
grep -oE '^  [A-Za-z0-9]+Icon,' apps/pilote-ppg/src/client/components/_commons/EditeurRiche/registreIcones.ts | sort -u
```

Remplacer tout nom absent par le plus proche présent dans le registre. Le repli `icone()` évite un crash mais produirait une icône générique : la substitution doit être faite à la main.

- [ ] **Step 3: Écrire le menu « / »**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/SlashCommand.tsx` :

```tsx
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import {
  Suggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import {
  construireOptionsBlocs,
  type ActionsBlocs,
  type OptionBloc,
} from "../blocs";

type ListeHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

const ListeSlash = forwardRef<ListeHandle, SuggestionProps<OptionBloc>>(
  function ListeSlash(props, ref) {
    const [index, setIndex] = useState(0);
    const [sousListe, setSousListe] = useState<OptionBloc[] | null>(null);

    // props.items change de référence à chaque transaction : ne remettre le
    // sous-menu à zéro que sur une frappe, sinon il se referme aussitôt ouvert.
    useEffect(() => {
      setSousListe(null);
      setIndex(0);
    }, [props.query]);

    const liste = sousListe ?? props.items;

    const revenir = (): boolean => {
      if (!sousListe) return false;
      setSousListe(null);
      setIndex(0);
      return true;
    };

    const choisir = (position: number) => {
      const item = liste[position];
      if (!item) return;
      if (item.sousOptions) {
        setSousListe(item.sousOptions);
        setIndex(0);
        return;
      }
      props.command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (
          event.key === "Escape" ||
          event.key === "ArrowLeft" ||
          event.key === "Backspace"
        ) {
          return revenir();
        }
        if (liste.length === 0) return false;
        if (event.key === "ArrowUp") {
          setIndex((courant) => (courant + liste.length - 1) % liste.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setIndex((courant) => (courant + 1) % liste.length);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          choisir(index);
          return true;
        }
        if (event.key === "ArrowRight") {
          if (!liste[index]?.sousOptions) return false;
          choisir(index);
          return true;
        }
        return false;
      },
    }));

    if (liste.length === 0) return null;

    return (
      <div className="w-60 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
        {sousListe && (
          <button
            className="flex w-full items-center gap-2 border-b border-gray-200 px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50"
            onClick={revenir}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            ← Retour
          </button>
        )}
        {liste.map((item, position) => (
          <button
            className={clsxm(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
              position === index && "bg-gray-100",
            )}
            key={item.label}
            onClick={() => choisir(position)}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setIndex(position)}
            type="button"
          >
            <item.Icone className="w-4 h-4 text-gray-500" fill="currentColor" />
            {item.label}
            {item.sousOptions && (
              <span className="ml-auto text-gray-400">›</span>
            )}
          </button>
        ))}
      </div>
    );
  },
);

const render = () => {
  let composant: ReactRenderer<
    ListeHandle,
    SuggestionProps<OptionBloc>
  > | null = null;
  let boite: HTMLDivElement | null = null;

  const placer = (clientRect: (() => DOMRect | null) | null | undefined) => {
    const rect = clientRect?.();
    if (!boite || !rect) return;
    boite.style.top = `${rect.bottom + 6}px`;
    boite.style.left = `${rect.left}px`;
  };

  return {
    onStart: (props: SuggestionProps<OptionBloc>) => {
      composant = new ReactRenderer(ListeSlash, {
        props,
        editor: props.editor,
      });
      boite = document.createElement("div");
      boite.style.position = "fixed";
      boite.style.zIndex = "50";
      boite.appendChild(composant.element);
      document.body.appendChild(boite);
      placer(props.clientRect);
    },
    onUpdate: (props: SuggestionProps<OptionBloc>) => {
      composant?.updateProps(props);
      placer(props.clientRect);
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === "Escape") {
        boite?.remove();
        boite = null;
        return true;
      }
      return composant?.ref?.onKeyDown(props.event) ?? false;
    },
    onExit: () => {
      boite?.remove();
      composant?.destroy();
      boite = null;
      composant = null;
    },
  };
};

export const SlashCommand = Extension.create<ActionsBlocs>({
  name: "slashCommand",

  addOptions() {
    return {};
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const actions = this.options;

    return [
      Suggestion<OptionBloc, OptionBloc>({
        editor,
        char: "/",
        items: ({ query }) => {
          const recherche = query.toLowerCase();
          return construireOptionsBlocs(editor, actions).filter(
            (option) =>
              option.label.toLowerCase().includes(recherche) ||
              option.keywords.includes(recherche),
          );
        },
        command: ({ editor: instance, range, props }) => {
          instance.chain().focus().deleteRange(range).run();
          props.run?.();
        },
        render,
      }),
    ];
  },
});
```

- [ ] **Step 4: Assembler la liste d'extensions**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/index.ts` :

```ts
import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import type { Extensions } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { AccordionExtension } from "@/components/_commons/EditeurRiche/extensions/AccordionExtension";
import { CalloutExtension } from "@/components/_commons/EditeurRiche/extensions/CalloutExtension";
import { IconeExtension } from "@/components/_commons/EditeurRiche/extensions/IconeExtension";
import { VideoExtension } from "@/components/_commons/EditeurRiche/extensions/VideoExtension";
import type { ActionsBlocs } from "../blocs";
import { SlashCommand } from "./SlashCommand";

export const extensionsCentreAide = (
  actions: ActionsBlocs = {},
  placeholder = "Écrivez, ou tapez « / » pour insérer un bloc…",
): Extensions => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    code: false,
    codeBlock: false,
  }),
  TextStyle,
  Color,
  Underline,
  Link.configure({ openOnClick: false }),
  Image.configure({
    allowBase64: false,
    HTMLAttributes: { class: "max-w-full rounded" },
  }),
  Placeholder.configure({ placeholder }),
  CalloutExtension,
  AccordionExtension,
  IconeExtension,
  VideoExtension,
  SlashCommand.configure(actions),
];
```

- [ ] **Step 5: Écrire le test de mise en titre**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/extensions/miseEnTitre.unit.test.ts` :

```ts
import { Editor } from "@tiptap/core";
import { extensionsCentreAide } from "@/client/components/_commons/CentreAide/editeur/extensions";

it("N'applique le titre qu'au paragraphe sélectionné", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: extensionsCentreAide(),
    content: "<p>A</p><p>B</p><p>C</p>",
  });

  editor.commands.setTextSelection(4);
  editor.chain().focus().toggleHeading({ level: 2 }).run();

  const html = editor.getHTML();
  expect(html).toContain("<h2>B</h2>");
  expect(html).toContain("<p>A</p>");
  expect(html).toContain("<p>C</p>");

  editor.destroy();
});
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm --filter @pilote/ppg test:client:unit src/client/components/_commons/CentreAide`

Expected: PASS — le test de mise en titre et ceux des tâches 3 et 5.

- [ ] **Step 7: Vérifier la compilation**

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 8: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/package.json pnpm-lock.yaml apps/pilote-ppg/src/client/components/_commons/CentreAide
git commit -m "feat(centre-aide): ajoute le menu slash et le registre de blocs"
```

---

### Task 8: Éditeur live et refonte de la page d'administration

Dernière tâche : on remplace l'éditeur piloté par la `MenuBar`, on supprime le panneau d'aperçu et les trois boutons de commutation, et on ajoute le bouton « Accéder à cet article ». `MenuBar.tsx` et ses modales restent en place pour `EditeurNouveauté` et `EditeurSimple`.

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/EditeurCentreAide.tsx`
- Delete: `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/EditeurCentreAide.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`

**Interfaces:**
- Consomme : `extensionsCentreAide` et `ActionsBlocs` (tâche 7) ; `ModaleInsertionUrl` avec `type="video"` (tâche 6) ; `ModaleInsertionIcone` existante ; `classesRenduContenuHtml` de `RenduContenuHtml`.
- Produit : `<EditeurCentreAide contenu={string} onChange={(contenu: string) => void} />`

- [ ] **Step 1: Écrire l'éditeur live**

Créer `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/EditeurCentreAide.tsx` :

```tsx
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { FunctionComponent, useState } from "react";
import { ModaleInsertionIcone } from "@/components/_commons/EditeurRiche/ModaleInsertionIcone";
import { ModaleInsertionUrl } from "@/components/_commons/EditeurRiche/ModaleInsertionUrl";
import { classesRenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { clsxm } from "@/utils/clsxm";
import { extensionsCentreAide } from "./extensions";

type ModaleOuverte = "image" | "video" | "lien" | "icone" | null;

const BoutonBulle: FunctionComponent<{
  actif: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ actif, label, onClick, children }) => (
  <button
    aria-label={label}
    aria-pressed={actif}
    className={clsxm(
      "flex h-8 w-8 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15",
      actif && "bg-white/20 text-white",
    )}
    // Empêche le blur : ProseMirror garde le focus et la sélection courante.
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    title={label}
    type="button"
  >
    {children}
  </button>
);

const classesContenu = clsxm(
  classesRenduContenuHtml,
  "[&_.ProseMirror]:min-h-[calc(100dvh-20rem)] [&_.ProseMirror]:outline-none",
  "[&_.ProseMirror_.is-empty]:before:pointer-events-none",
  "[&_.ProseMirror_.is-empty]:before:float-left",
  "[&_.ProseMirror_.is-empty]:before:h-0",
  "[&_.ProseMirror_.is-empty]:before:text-gray-400",
  "[&_.ProseMirror_.is-empty]:before:content-[attr(data-placeholder)]",
);

export const EditeurCentreAide: FunctionComponent<{
  contenu: string;
  onChange: (contenu: string) => void;
}> = ({ contenu, onChange }) => {
  const [modale, setModale] = useState<ModaleOuverte>(null);

  const editor = useEditor({
    extensions: extensionsCentreAide({
      ouvrirImage: () => setModale("image"),
      ouvrirVideo: () => setModale("video"),
      ouvrirLien: () => setModale("lien"),
      ouvrirIcone: () => setModale("icone"),
    }),
    content: contenu,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) =>
      onChange(instance.isEmpty ? "" : instance.getHTML()),
  });

  // tiptap v3 ne re-rend plus le composant à chaque transaction : on souscrit
  // explicitement aux états actifs pour que la bulle suive la sélection.
  const etats = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      gras: instance?.isActive("bold") ?? false,
      italique: instance?.isActive("italic") ?? false,
      souligne: instance?.isActive("underline") ?? false,
      barre: instance?.isActive("strike") ?? false,
      lien: instance?.isActive("link") ?? false,
    }),
  });

  if (!editor || !etats) return null;

  const poserLien = (url: string) => {
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <BubbleMenu
        className="flex items-center gap-0.5 rounded-lg bg-gray-800 p-1 shadow-lg"
        editor={editor}
      >
        <BoutonBulle
          actif={etats.gras}
          label="Gras"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="text-sm font-bold">G</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.italique}
          label="Italique"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="text-sm italic">I</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.souligne}
          label="Souligné"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="text-sm underline">S</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.barre}
          label="Barré"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="text-sm line-through">B</span>
        </BoutonBulle>
        <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
        <BoutonBulle
          actif={etats.lien}
          label="Lien"
          onClick={() => setModale("lien")}
        >
          <span className="text-sm">🔗</span>
        </BoutonBulle>
      </BubbleMenu>

      <EditorContent className={classesContenu} editor={editor} />

      <ModaleInsertionUrl
        onOpenChange={(ouvert) => !ouvert && setModale(null)}
        onValider={(url) =>
          editor.chain().focus().setImage({ src: url }).run()
        }
        open={modale === "image"}
        titre="Insérer une image"
        type="image"
      />
      <ModaleInsertionUrl
        onOpenChange={(ouvert) => !ouvert && setModale(null)}
        onValider={(url) => editor.chain().focus().insertVideo({ src: url }).run()}
        open={modale === "video"}
        titre="Insérer une vidéo"
        type="video"
      />
      <ModaleInsertionUrl
        onOpenChange={(ouvert) => !ouvert && setModale(null)}
        onValider={poserLien}
        open={modale === "lien"}
        titre="Insérer un lien"
        type="lien"
      />
      <ModaleInsertionIcone
        onOpenChange={(ouvert) => !ouvert && setModale(null)}
        onValider={(nomIcone) =>
          editor.chain().focus().insertIcone({ type: nomIcone }).run()
        }
        open={modale === "icone"}
      />
    </div>
  );
};
```

- [ ] **Step 2: Supprimer l'ancien éditeur du centre d'aide**

```bash
git rm apps/pilote-ppg/src/client/components/_commons/EditeurRiche/EditeurCentreAide.tsx
```

- [ ] **Step 3: Refondre la page d'administration**

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx` :

Remplacer l'import de l'éditeur :

```ts
import { EditeurCentreAide } from "@/components/_commons/CentreAide/editeur/EditeurCentreAide";
```

Supprimer les imports `classesRenduContenuHtml` et `RenduContenuHtml`, ainsi que les trois `useState` `afficherArbo`, `afficherEditeurCol`, `afficherApercu`, le helper `toggleButtonClass` et tout le bloc de trois boutons en tête de rendu.

L'arborescence n'est plus conditionnée : retirer `{afficherArbo && (…)}` et garder la colonne telle quelle.

Remplacer la colonne d'édition et le panneau d'aperçu par une colonne unique. L'en-tête reste identique — badges, champs « Nom (arborescence) » et « Titre affiché (contenu) », boutons d'action — et la zone de contenu devient :

```tsx
                {aContenu ? (
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
                    <div className="mx-auto max-w-screen-md">
                      <EditeurCentreAide
                        contenu={contenu!}
                        onChange={setContenu}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Ce groupe n'a pas de contenu éditable.
                  </div>
                )}
```

La largeur `max-w-screen-md` est celle de la colonne d'article de `PageCentreAidePilote` : c'est ce qui rend l'aperçu inutile. Si elle diverge, aligner les deux valeurs.

- [ ] **Step 4: Ajouter le bouton « Accéder à cet article »**

Toujours dans le même fichier, dans le groupe de boutons d'action de l'en-tête, avant le bouton de suppression :

```tsx
                      <a
                        aria-disabled={
                          !itemSelectionne?.estPublie || itemSelectionne?.estMasque
                        }
                        className={clsxm(
                          "p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center",
                          (!itemSelectionne?.estPublie ||
                            itemSelectionne?.estMasque) &&
                            "pointer-events-none opacity-50",
                        )}
                        href={`/centre-aide-pilote?article=${itemSelectionneId}`}
                        rel="noreferrer"
                        target="_blank"
                        title={
                          !itemSelectionne?.estPublie
                            ? "L'article doit être publié pour être consultable"
                            : itemSelectionne?.estMasque
                              ? "L'article est masqué côté visualisation"
                              : "Accéder à cet article"
                        }
                      >
                        <Icone className="w-5 h-5" icone={ExternalLinkIcon} />
                      </a>
```

Ajouter les imports correspondants :

```ts
import { clsxm } from "@/utils/clsxm";
import { ExternalLinkIcon } from "@/components/_commons/Icones/ExternalLinkIcon";
```

Vérifier que `ExternalLinkIcon` existe :

```bash
ls apps/pilote-ppg/src/client/components/_commons/Icones/ | grep -i external
```

S'il est absent, utiliser une autre icône présente dans le dossier (par exemple `ShareBoxIcon` ou `ArrowGoForwardContourIcon`) plutôt que d'en créer une.

- [ ] **Step 5: Vérifier la compilation et l'ensemble des tests**

Run: `pnpm --filter @pilote/ppg exec tsc --noEmit`
Expected: aucune erreur.

Run: `pnpm --filter @pilote/ppg test:unit`
Expected: PASS.

- [ ] **Step 6: Lint et commit**

```bash
pnpm lint
git add apps/pilote-ppg/src/client/components
git commit -m "feat(centre-aide): passe l'edition en live et supprime le double panneau"
```

- [ ] **Step 7: Validation manuelle par l'utilisateur**

Demander à l'utilisateur de lancer l'application et de vérifier :

1. L'éditeur s'affiche sans panneau d'aperçu, à la largeur de la page de lecture.
2. Sélectionner du texte fait apparaître la bulle ; gras / italique / souligné / barré / lien fonctionnent.
3. Taper « / » ouvre le menu de blocs ; les sous-menus encadré et titre se parcourent au clavier (↑ ↓ → ← Entrée Échap).
4. Insérer une image par URL directe et par le mode « Fichiers numériques ».
5. Insérer une vidéo `video.finances.gouv.fr` et une vidéo `fichiers.numerique.gouv.fr`, puis enregistrer, recharger, et vérifier que les deux survivent au sanitizer.
6. Un article existant contenant une ancienne `<iframe>` s'ouvre toujours avec sa vidéo.
7. Glisser un nœud dans l'arborescence : réordonner au même niveau, faire entrer dans un groupe, faire ressortir à la racine ; recharger et vérifier la persistance.
8. Le bouton « Accéder à cet article » ouvre l'article côté visualisation, et reste désactivé sur un brouillon ou un article masqué.

Ne pas conclure la tâche avant le retour de l'utilisateur. Le rendu vidéo de `fichiers.numerique.gouv.fr` (point 5) est la décision différée du spec : si l'URL sert une page au lieu d'un binaire, basculer `estFichierVideoDirect` pour renvoyer `false` sur cet hôte, ce qui rebascule le rendu sur l'iframe. Aucun autre fichier n'est concerné.

---

## Après le plan

Une fois les 8 tâches terminées et validées, ouvrir la PR vers `dev` et mettre à jour PIL-1685 en précisant que la corbeille (point #2 du ticket) reste à traiter dans un ticket dédié.
