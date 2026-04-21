# ProConnect Auth Provider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter ProConnect comme provider d'authentification alternatif à Keycloak dans NextAuth, avec deux boutons de connexion côte à côte sur la page de login.

**Architecture:** Ajout d'un provider OIDC custom dans la config NextAuth existante. Les env vars sont déjà en place. Le callback JWT/session existant fonctionne tel quel — on ajoute juste le skip du refresh token et une branche logout pour ProConnect.

**Tech Stack:** NextAuth v5, Next.js 14, convict, React

---

### Task 1: Ajouter la configuration ProConnect dans convict

**Files:**
- Modify: `src/config.ts:3-526` (ajout bloc proConnect)

- [ ] **Step 1: Ajouter le bloc proConnect dans convict**

Dans `src/config.ts`, après le bloc `keycloak` (ligne 90), ajouter :

```typescript
  proConnect: {
    doc: "(optionnel) Pour se connecter via ProConnect (AgentConnect). Incompatible avec DEV_PASSWORD",
    clientId: {
      format: String,
      default: "",
      env: "PROCONNECT_CLIENT_ID",
    },
    clientSecret: {
      format: String,
      default: "",
      env: "PROCONNECT_CLIENT_SECRET",
    },
    issuer: {
      format: String,
      default: "",
      env: "PROCONNECT_ISSUER",
    },
  },
```

- [ ] **Step 2: Ajouter les URLs dérivées après config.set keycloak**

Après les `config.set` pour keycloak (ligne 531-539), ajouter :

```typescript
if (config.get("proConnect.issuer")) {
  config.set(
    "proConnect.logoutUrl",
    config.get("proConnect.issuer") + "/session/end",
  );
}
```

Et ajouter le champ `logoutUrl` dans le bloc proConnect :

```typescript
    logoutUrl: {
      format: String,
      default: "",
    },
```

- [ ] **Step 3: Vérifier que l'app démarre**

Run: `pnpm dev`
Expected: L'app démarre sans erreur de validation convict.

- [ ] **Step 4: Commit**

```bash
git add src/config.ts
git commit -m "feat(auth): ajouter la configuration ProConnect dans convict"
```

---

### Task 2: Ajouter le provider ProConnect dans NextAuth

**Files:**
- Modify: `src/server/infrastructure/api/auth/[...nextauth].tsx`

- [ ] **Step 1: Ajouter l'import et la définition du provider ProConnect**

Après la définition de `keycloak` (ligne 17), ajouter :

```typescript
const proConnectEnabled = !!configuration().proConnect.clientId;

const proConnectProvider = proConnectEnabled
  ? ({
      id: "proconnect",
      name: "ProConnect",
      type: "oauth",
      wellKnown: `${configuration().proConnect.issuer}/.well-known/openid-configuration`,
      clientId: configuration().proConnect.clientId,
      clientSecret: configuration().proConnect.clientSecret,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      profile(profile: { sub: string; email: string; given_name: string; usual_name: string }) {
        return {
          id: profile.sub,
          email: profile.email,
          name: `${profile.given_name} ${profile.usual_name}`,
        };
      },
    } satisfies import("next-auth/providers").OAuthConfig<Record<string, unknown>>)
  : null;
```

- [ ] **Step 2: Modifier le tableau de providers**

Remplacer la ligne `providers` (ligne 283) :

```typescript
// Avant
providers: !!configuration().devPassword ? [credentialsProvider] : [keycloak],

// Après
providers: !!configuration().devPassword
  ? [credentialsProvider]
  : [keycloak, proConnectProvider].filter(Boolean),
```

- [ ] **Step 3: Adapter `_hasExpired` pour ProConnect**

Modifier la fonction `_hasExpired` (ligne 271-277) pour skip le refresh token ProConnect :

```typescript
function _hasExpired(token: PiloteJWTPayload): Boolean {
  if (token.provider == "credentials" || token.provider == "proconnect") {
    return false;
  }
  const now = Date.now();
  return now >= token.accessTokenExpires;
}
```

- [ ] **Step 4: Adapter `doFinalSignoutHandshake` pour ProConnect**

Après le bloc `if (provider == keycloak.id)` (ligne 47-95), ajouter un `else if` pour ProConnect :

```typescript
  } else if (provider == "proconnect") {
    try {
      const params = new URLSearchParams({ id_token_hint: idToken as string });

      logger.debug(
        {
          categorie: "auth",
          source: "nextauth.doFinalSignoutHandshake",
          logoutUrl: configuration().proConnect.logoutUrl,
        },
        "ProConnect Logout URL",
      );

      const response = await axios.post(
        configuration().proConnect.logoutUrl,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          validateStatus: () => true,
        },
      );

      _assertResponseOk(response, "Failed to logout from ProConnect");

      logger.info(
        { categorie: "auth", source: "nextauth.doFinalSignoutHandshake" },
        "Completed ProConnect post-logout handshake",
      );
    } catch (error: unknown) {
      logger.error(
        {
          categorie: "auth",
          source: "nextauth.doFinalSignoutHandshake",
          errorMessage: (error as Error).message,
        },
        "Unable to perform ProConnect post-logout handshake",
      );
    }
  }
```

- [ ] **Step 5: Vérifier que l'app démarre**

Run: `pnpm dev`
Expected: L'app démarre sans erreur. Le provider ProConnect est enregistré.

- [ ] **Step 6: Commit**

```bash
git add src/server/infrastructure/api/auth/\[...nextauth\].tsx
git commit -m "feat(auth): ajouter le provider ProConnect dans NextAuth"
```

---

### Task 3: Ajouter le bouton ProConnect sur la page de login

**Files:**
- Modify: `src/client/components/PageLanding/PageLanding.tsx:40-46`

- [ ] **Step 1: Ajouter le bouton ProConnect à côté du bouton existant**

Remplacer le bouton existant (lignes 40-46) par deux boutons côte à côte :

```tsx
                <div className="flex gap-4">
                  <button
                    className="fr-btn fr-mr-2w rounded"
                    onClick={() => signIn("keycloak")}
                    type="button"
                  >
                    Se connecter
                  </button>
                  <button
                    className="fr-btn fr-btn--secondary rounded"
                    onClick={() => signIn("proconnect")}
                    type="button"
                  >
                    Se connecter avec ProConnect
                  </button>
                </div>
```

- [ ] **Step 2: Vérifier visuellement**

Run: `pnpm dev`
Ouvrir `http://localhost:3000` dans le navigateur.
Expected: Deux boutons côte à côte — "Se connecter" (primaire) et "Se connecter avec ProConnect" (secondaire).

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageLanding/PageLanding.tsx
git commit -m "feat(auth): ajouter le bouton ProConnect sur la page de login"
```

---

### Task 4: Test end-to-end du flow ProConnect

- [ ] **Step 1: Tester le flow complet**

1. Ouvrir `http://localhost:3000`
2. Cliquer sur "Se connecter avec ProConnect"
3. Vérifier la redirection vers ProConnect (sandbox)
4. S'authentifier avec un compte de test
5. Vérifier le retour sur l'app avec la session active
6. Vérifier que la déconnexion fonctionne

- [ ] **Step 2: Vérifier que le flow Keycloak existant n'est pas cassé**

1. Cliquer sur "Se connecter" (Keycloak)
2. Vérifier que le flow Keycloak fonctionne toujours normalement

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: Pas d'erreur de lint.

- [ ] **Step 4: Commit final si ajustements**

```bash
git add -A
git commit -m "fix(auth): ajustements post-test ProConnect"
```
