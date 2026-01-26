# 5. Tests E2E avec le pattern Page Object Model

Date : 2026-01-26

## Statut

Accepté

## Contexte

Les tests E2E initiaux de la codebase manipulaient directement les sélecteurs Playwright dans chaque fichier de test. Cette approche entraînait plusieurs problèmes :

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

## Décision

Nous utilisons le pattern **Page Object Model (POM)** pour structurer nos tests E2E Playwright, ainsi qu'un **API Object Model** pour les tests d'API.

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
  constructor(protected readonly page: Page) {}
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

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.exportModal = new ExportCsvModal(page);
  }

  async selectChantier(nom: string, id: string): Promise<PageChantier> {
    await this.page.getByRole("table")
      .getByRole("cell", { name: nom }).click();
    await this.page.waitForURL(`**/chantier/CH-${id}/NAT-FR**`);
    return new PageChantier(this.page);
  }
}
```

5. **Actions transversales** :
```typescript
// tests/actions/app.actions.ts
export class AppActions {
  constructor(private readonly page: Page) {}

  async loginAs(username?: string, password?: string): Promise<PageAccueil> {
    const pageAccueilNonConnecte = new PageAccueilNonConnecte(this.page);
    await pageAccueilNonConnecte.goto();
    await pageAccueilNonConnecte.header.clickLogin();

    const pageLogin = new PageLogin(this.page);
    await pageLogin.fillCredentials(username, password);
    await pageLogin.submit();

    return new PageAccueil(this.page);
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
test("doit pouvoir consulter les données des chantiers", async ({ page }) => {
  const appActions = new AppActions(page);
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
- **Courbe d'apprentissage** : nécessite de comprendre la structure des pages, composants et clients API
- **Effort initial** : création des classes avant d'écrire les premiers tests
- **Indirection** : le code de test est séparé des sélecteurs/endpoints, ce qui peut compliquer le débogage
- **Sur-abstraction potentielle** : risque de créer trop de petites classes pour des cas simples

**Impact sur l'équipe :**
- Les tests E2E deviennent plus accessibles aux nouveaux développeurs
- Les agents IA peuvent générer des tests de meilleure qualité en utilisant les pages/clients existants
- L'effort de maintenance est transféré des tests individuels vers les classes partagées
