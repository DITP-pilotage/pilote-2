# 5. Tests E2E : Page Object Model et isolation des données

Date : 2026-01-26 (mise à jour : 2026-03-16)

## Statut

Accepté

## Contexte

Les tests E2E de la codebase présentaient deux problèmes distincts :

### Problème 1 : Sélecteurs dupliqués et fragiles

Les tests manipulaient directement les sélecteurs Playwright dans chaque fichier de test :

**Code dupliqué et fragile :**
```typescript
// Ancien pattern : sélecteurs dispersés dans chaque test
await page.getByRole("button", { name: "Se connecter" }).click();
await page.getByLabel("Identifiant").fill(username);
await page.getByLabel(/Mot de passe/).fill(password);
await page.getByRole("button").click();
// ... répété dans chaque test nécessitant une authentification
```

**Problèmes identifiés :**
- **Duplication massive** : les mêmes sélecteurs et interactions copiés dans chaque test
- **Maintenance coûteuse** : un changement d'UI nécessite de modifier tous les tests impactés
- **Lisibilité réduite** : les tests mélangent logique métier et détails d'implémentation UI
- **Pas de réutilisation** : impossible de factoriser des scénarios communs (login, navigation)
- **Tests fragiles** : les sélecteurs magiques rendent les tests difficiles à déboguer

### Problème 2 : Pollution des données entre tests

La base de données est seedée une seule fois au `globalSetup` (le seed complet est trop long pour être exécuté avant chaque test). Les tests partagent donc les mêmes données. Quand un test crée des entités (propositions PVA, commentaires, etc.) et échoue en cours de route, les données restent en base et polluent les retries et les tests suivants :

```typescript
// Le test crée une PVA via l'UI
const modal = await indicateur.clickProposerAutreValeur();
await modal.publierProposition();

// Échoue plus tard dans le test
await appActions.switchUser(autreUtilisateur); // 💥 Timeout

// Au retry, la PVA existe toujours en base.
// Le bouton "Proposer une autre valeur" n'est plus visible → échec en cascade.
```

**Problèmes identifiés :**
- **Couplage temporel** : l'ordre d'exécution et le résultat des tests précédents impactent les suivants
- **Retries inutiles** : un test qui échoue pour une raison transitoire échoue aussi en retry à cause de données résiduelles
- **Cleanup via l'UI fragile** : tenter de nettoyer les données via des interactions UI (boutons "Supprimer") est lui-même sujet à des timeouts et ajoute de la complexité

## Décision

Nous utilisons le pattern **Page Object Model (POM)** pour structurer nos tests E2E Playwright, un **API Object Model** pour les tests d'API, et un **E2ETestContext** pour l'isolation des données entre tests.

### Page Object Model (tests UI)

**Principe** :
- Chaque page de l'application est représentée par une classe dédiée
- Les interactions avec l'UI sont encapsulées dans des méthodes
- Les sélecteurs sont centralisés dans les classes de page
- Les composants réutilisables (header, modales) sont extraits dans des classes dédiées
- Les actions transversales (login) sont regroupées dans des classes d'actions

**Structure du dossier `tests/` :**
```
tests/
├── e2e-test-context.ts       # Context d'isolation des données
├── fixtures.ts               # Fixture Playwright (injection du context)
├── pages/                    # Page Objects
│   ├── base.page.ts          # Classe abstraite de base
│   ├── page-accueil.ts
│   ├── page-chantier.ts
│   └── admin/
│       ├── page-utilisateurs.ts
│       └── page-gestion-token-api.ts
├── components/               # Composants réutilisables
│   ├── header.component.ts
│   └── export-csv.modal.ts
├── actions/                  # Actions transversales
│   └── app.actions.ts
├── open-api/                 # Tests API
│   ├── api-client/           # API Object Model
│   │   ├── open-api.client.ts
│   │   ├── api-test-context.ts
│   │   └── unauthenticated-api.client.ts
│   ├── authentification.spec.ts
│   └── ...
├── login.spec.ts             # Fichiers de test UI
├── information-chantier.spec.ts
└── ...
```

**Implémentation :**

1. **Classe de base** :
```typescript
// tests/pages/base.page.ts
export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly e2eContext: E2ETestContext,
  ) {}
}
```

2. **Page Object** :
```typescript
// tests/pages/page-login.ts
export class PageLogin extends BasePage {
  private get usernameInput() {
    return this.page.getByLabel("Identifiant");
  }

  private get passwordInput() {
    return this.page.getByLabel(/Mot de passe/);
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button").click();
    await this.page.waitForURL("**/accueil/chantier/**");
  }
}
```

3. **Composant réutilisable** :
```typescript
// tests/components/header.component.ts
export class HeaderComponent {
  constructor(private readonly page: Page) {}

  async clickLogin(): Promise<void> {
    await this.page.getByRole("banner")
      .getByRole("button", { name: "Se connecter" }).click();
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.userButton()).toBeVisible({ timeout: 100_000 });
  }
}
```

4. **Composition des pages avec composants** :
```typescript
// tests/pages/page-accueil.ts
export class PageAccueil extends BasePage {
  readonly header: HeaderComponent;
  readonly exportModal: ExportCsvModal;

  constructor(page: Page, e2eContext: E2ETestContext) {
    super(page, e2eContext);
    this.header = new HeaderComponent(page);
    this.exportModal = new ExportCsvModal(page);
  }

  async selectChantier(nom: string, id: string): Promise<PageChantier> {
    await this.page.getByRole("table")
      .getByRole("cell", { name: nom }).click();
    await this.page.waitForURL(`**/chantier/CH-${id}/NAT-FR**`);
    return new PageChantier(this.page, this.e2eContext);
  }
}
```

5. **Actions transversales** :
```typescript
// tests/actions/app.actions.ts
export class AppActions {
  constructor(
    private readonly page: Page,
    private readonly e2eContext: E2ETestContext,
  ) {}

  async loginAs(username?: string, password?: string): Promise<PageAccueil> {
    const pageAccueilNonConnecte = new PageAccueilNonConnecte(this.page, this.e2eContext);
    await pageAccueilNonConnecte.goto();
    await pageAccueilNonConnecte.header.clickLogin();

    const pageLogin = new PageLogin(this.page, this.e2eContext);
    await pageLogin.fillCredentials(username, password);
    await pageLogin.submit();

    return new PageAccueil(this.page, this.e2eContext);
  }
}
```

**Conventions :**
- Les méthodes de navigation retournent le nouvel objet de page
- Les assertions sont encapsulées dans des méthodes `expect*`
- Les sélecteurs sont définis comme getters privés
- Les composants sont injectés via le constructeur

**Exemple de test avec POM** :
```typescript
import { test } from "./fixtures";

test("doit pouvoir consulter les données des chantiers", async ({ page, e2eContext }) => {
  const appActions = new AppActions(page, e2eContext);
  const pageAccueil = await appActions.loginAs();

  await test.step("Vérification de la structure de la page d'accueil", async () => {
    await pageAccueil.expectStructure();
  });

  await test.step("Navigation vers le chantier", async () => {
    const pageChantier = await pageAccueil.selectChantier("Mon chantier", "155");
    await pageChantier.expectTitle("155", "Mon chantier");
    await pageChantier.expectStructure();
  });
});
```

**Exemple de référence** : `tests/information-chantier.spec.ts`

### Isolation des données avec E2ETestContext

Le `E2ETestContext` est un registre d'entités créées pendant un test. Il permet de garantir que chaque test (et chaque retry) part d'un état propre, sans dépendre du résultat des tests précédents.

**Principe :**
- Le context est injecté dans les tests via une fixture Playwright personnalisée
- Les POM reçoivent le context dans leur constructeur et y enregistrent les entités créées via l'UI
- En `afterEach`, la fixture appelle `cleanup()` qui supprime les entités trackées via Prisma
- Le seed global (données de référence : chantiers, indicateurs, territoires, utilisateurs) reste inchangé

**Implémentation :**

1. **Le registre d'entités** :
```typescript
// tests/e2e-test-context.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type EntityType = "pva" | "commentaire" | "evenement";

interface TrackedEntity {
  type: EntityType;
  filters: Record<string, unknown>;
}

export class E2ETestContext {
  private readonly entities: TrackedEntity[] = [];

  track(type: EntityType, filters: Record<string, unknown>): void {
    this.entities.push({ type, filters });
  }

  async cleanup(): Promise<void> {
    for (const entity of this.entities) {
      switch (entity.type) {
        case "pva":
          await prisma.proposition_valeur_actuelle.deleteMany({
            where: entity.filters,
          });
          break;
        case "evenement":
          await prisma.indicateur_territoire_valeur_evenement.deleteMany({
            where: entity.filters,
          });
          break;
        case "commentaire":
          await prisma.commentaire.deleteMany({
            where: entity.filters,
          });
          break;
      }
    }
    this.entities.length = 0;
  }
}
```

2. **La fixture Playwright** :
```typescript
// tests/fixtures.ts
import { test as base } from "@playwright/test";
import { E2ETestContext } from "./e2e-test-context";

export const test = base.extend<{ e2eContext: E2ETestContext }>({
  e2eContext: async ({}, use) => {
    const context = new E2ETestContext();
    await use(context);
    await context.cleanup();
  },
});
```

3. **Enregistrement dans les POM** :
```typescript
// tests/components/pva-indicateur.component.ts
export class PvaIndicateurComponent {
  constructor(
    private readonly page: Page,
    private readonly indicateurId: string,
    private readonly territoireCode: string,
    private readonly e2eContext: E2ETestContext,
  ) {}

  async clickProposerAutreValeur(): Promise<PvaModalComponent> {
    await this.section
      .getByRole("button", { name: /Proposer une autre valeur/ })
      .click();
    this.e2eContext.track("pva", {
      indic_id: this.indicateurId,
      territoire_code: this.territoireCode,
    });
    this.e2eContext.track("evenement", {
      indic_id: this.indicateurId,
      territoire_code: this.territoireCode,
      type_evenement: { startsWith: "PROPOSITION_VALEUR" },
    });
    return new PvaModalComponent(this.page);
  }
}
```

4. **Utilisation dans les tests** :
```typescript
import { test } from "./fixtures";

test("Coordinateur département propose, Direction accepte", async ({
  page,
  e2eContext,
}) => {
  const pageChantier = new PageChantier(page, e2eContext);
  const indicateur = pageChantier.getIndicateurPva("IND-021", "DEPT-56");

  const modal = await indicateur.clickProposerAutreValeur();
  // La PVA et ses événements sont trackés automatiquement.
  // En cas d'échec du test, cleanup() les supprimera.
});
```

**Conventions :**
- Le tracking se fait au moment de l'action UI, pas après confirmation, pour couvrir les cas où le test échoue entre la création et la confirmation
- Chaque nouveau type d'entité ajoute une entrée dans le `switch` de `cleanup()` et un `EntityType` correspondant
- Les POM sont responsables d'appeler `track()` ; les tests n'ont pas à gérer le cleanup
- Le `E2ETestContext` est propagé via les constructeurs des POM (hérité de `BasePage`)

**Exemple de référence** : `tests/proposition-valeur-avancement.spec.ts`

### API Object Model (tests API)

Pour les tests de l'API Open API, nous utilisons un pattern similaire avec :
- Un **client API** qui encapsule tous les endpoints
- Un **contexte de test** qui génère les tokens JWT directement (sans passer par l'UI)

**Principe de génération des tokens** :
L'API valide la signature JWT ET vérifie l'existence du token en base de données (`token_api_information`). On génère donc :
1. Le JWT directement avec `next-auth/jwt`
2. L'entrée en base avec Prisma (`upsert`)

Cela évite de passer par l'UI tout en respectant la vérification en base.

**Implémentation :**

1. **Client API** :
```typescript
// tests/open-api/api-client/open-api.client.ts
export class OpenApiClient {
  constructor(private readonly apiContext: APIRequestContext) {}

  async healthcheck(): Promise<APIResponse> {
    return this.apiContext.get("/api/open-api/healthcheck");
  }

  async getChantierDonnees(chantierId: string): Promise<APIResponse> {
    return this.apiContext.get(`/api/open-api/chantier/${chantierId}/donnees`);
  }

  async getIndicateurDonnees(chantierId: string, indicateurId: string): Promise<APIResponse> {
    return this.apiContext.get(
      `/api/open-api/chantier/${chantierId}/indicateur/${indicateurId}/donnees`
    );
  }

  async importCommentaires(chantierId: string, commentaires: CommentaireInput[]): Promise<APIResponse> {
    return this.apiContext.post(
      `/api/open-api/chantier/${chantierId}/commentaires`,
      { data: { commentaires } }
    );
  }
}
```

2. **Contexte de test avec génération directe des tokens** :
```typescript
// tests/open-api/api-client/api-test-context.ts
import { encode } from "next-auth/jwt";
import { prisma } from "@/server/db/prisma";

export class ApiTestContext {
  static async create(playwright: Playwright, profile: UserProfile): Promise<ApiTestContext> {
    const config = USER_PROFILES[profile];

    // Génération directe du JWT (même secret que l'API)
    const token = await encode({
      token: { email: config.email },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 365 * 24 * 60 * 60,
    });

    // Insertion en base (requis pour la validation API)
    await prisma.token_api_information.upsert({
      where: { email: config.email },
      update: { date_creation: new Date().toISOString() },
      create: { email: config.email, date_creation: new Date().toISOString() },
    });

    const apiContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });

    return new ApiTestContext(new OpenApiClient(apiContext), config);
  }

  getClient(): OpenApiClient { ... }

  async dispose(): Promise<void> {
    await this.client.dispose();
    // Cleanup de l'entrée en base
    await prisma.token_api_information.deleteMany({ where: { email: this.userEmail } });
  }
}
```

3. **Profils utilisateurs prédéfinis** :
```typescript
const USER_PROFILES: Record<UserProfile, UserConfig> = {
  DITP_ADMIN: {
    email: "ditp.admin@example.com",
  },
  EQUIPE_DIR_PROJET: {
    email: "equipe.dir.projet@example.com",
    chantierId: "CH-129",
    indicateurId: "IND-021",
  },
};
```

**Exemple de test API** :
```typescript
test("Quand on a accès au chantier, doit remonter une réponse 200 OK", async ({
  playwright,
}) => {
  const apiContext = await ApiTestContext.create(playwright, "EQUIPE_DIR_PROJET");
  const client = apiContext.getClient();

  const result = await client.getChantierDonnees(apiContext.chantierId!);

  expect(result.status()).toEqual(200);

  await apiContext.dispose();
});
```

**Exemple de référence** : `tests/open-api/export-donnee-chantier.spec.ts`

## Conséquences

**Avantages :**
- **Maintenance centralisée** : un changement d'UI ou d'API ne nécessite qu'une modification dans la classe concernée
- **Réutilisabilité** : les interactions communes sont factorisées et réutilisables
- **Lisibilité améliorée** : les tests expriment l'intention métier, pas les détails d'implémentation
- **Auto-documentation** : les méthodes des pages/clients documentent les actions possibles
- **Composition flexible** : les composants peuvent être partagés entre pages
- **Chaînage naturel** : les méthodes de navigation retournent le contexte approprié
- **Tests plus faciles à écrire** : pour les humains ET les agents IA (Claude Code, Copilot, etc.)
- **Tests API ultra-rapides** : génération directe des JWT sans passer par l'UI (quelques ms vs ~15s)
- **Isolation fiable** : chaque test part d'un état propre grâce au cleanup automatique via Prisma, sans dépendre d'interactions UI fragiles
- **Retries fonctionnels** : un retry après échec retrouve un état de base propre

**Comparaison avant/après (UI):**
```typescript
// AVANT : sélecteurs répétés, logique mélangée
await page.getByRole("button", { name: "Se connecter" }).click();
await page.getByLabel("Identifiant").fill(username);
await page.getByLabel(/Mot de passe/).fill(password);
await page.getByRole("button").click();
await page.waitForURL("**/accueil/chantier/**");
await expect(page.getByRole("button", { name: "Mon espace" })).toBeVisible();

// APRÈS : intention claire, détails encapsulés
const pageAccueil = await appActions.loginAs();
await pageAccueil.header.expectUserLoggedIn();
```

**Comparaison avant/après (API):**
```typescript
// AVANT : gestion manuelle des tokens via UI, code répétitif
const { apiDirProjetToken, apiDirProjetUsername, apiDirProjetChantierAssocie } =
  await authentificationApiDirProjetFn({ page }); // Login UI + création token UI
apiContext = await playwright.request.newContext({
  baseURL: process.env.BASE_URL,
  extraHTTPHeaders: { Authorization: `Bearer ${apiDirProjetToken}` },
});
result = await apiContext.get(`/api/open-api/chantier/${apiDirProjetChantierAssocie}/donnees`);
await suppressionAuthentificationApiFn({ page, apiUsername: apiDirProjetUsername }); // Cleanup UI

// APRÈS : génération directe du JWT, pas d'UI, pas de cleanup
const apiContext = await ApiTestContext.create(playwright, "EQUIPE_DIR_PROJET");
const result = await apiContext.getClient().getChantierDonnees(apiContext.chantierId!);
await apiContext.dispose();
```

**Inconvénients :**
- **Courbe d'apprentissage** : nécessite de comprendre la structure des pages, composants, clients API et le mécanisme de tracking
- **Effort initial** : création des classes et du context avant d'écrire les premiers tests
- **Indirection** : le code de test est séparé des sélecteurs/endpoints, ce qui peut compliquer le débogage
- **Sur-abstraction potentielle** : risque de créer trop de petites classes pour des cas simples
- **Discipline requise** : les POM doivent systématiquement appeler `track()` pour chaque entité créée, sous peine de laisser des données résiduelles

**Impact sur l'équipe :**
- Les tests E2E deviennent plus accessibles aux nouveaux développeurs
- Les agents IA peuvent générer des tests de meilleure qualité en utilisant les pages/clients existants
- L'effort de maintenance est transféré des tests individuels vers les classes partagées
