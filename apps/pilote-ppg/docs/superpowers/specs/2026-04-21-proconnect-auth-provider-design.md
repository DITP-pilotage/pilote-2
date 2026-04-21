# Intégration ProConnect comme provider d'authentification

Date : 2026-04-21

## Contexte

L'application Pilote utilise actuellement Keycloak comme unique provider d'authentification via NextAuth. On souhaite ajouter ProConnect (OIDC de l'État pour les agents publics) comme provider alternatif, permettant aux utilisateurs de choisir leur mode de connexion.

Ce document décrit un POC : les deux providers coexistent, l'utilisateur choisit sur la page de login.

## Approche retenue

Ajout d'un provider OIDC custom directement dans NextAuth (approche A), sans passer par Keycloak comme broker. Les deux providers sont indépendants et coexistent.

## Design

### 1. Configuration (`src/config.ts`)

Ajout d'un bloc `proConnect` dans convict :

```typescript
proConnect: {
  clientId: { format: String, default: "", env: "PROCONNECT_CLIENT_ID" },
  clientSecret: { format: String, default: "", env: "PROCONNECT_CLIENT_SECRET" },
  issuer: { format: String, default: "", env: "PROCONNECT_ISSUER" },
},
```

Le provider ProConnect n'est instancié que si `PROCONNECT_CLIENT_ID` est non-vide (même pattern que `DEV_PASSWORD` pour le credentials provider).

Variables d'environnement :

| Variable | Exemple |
|----------|---------|
| `PROCONNECT_CLIENT_ID` | fourni par ProConnect |
| `PROCONNECT_CLIENT_SECRET` | fourni par ProConnect |
| `PROCONNECT_ISSUER` | `https://app.agentconnect.gouv.fr/api/v2` (prod) ou URL sandbox |

Les URLs token/auth/logout/userinfo sont dérivées automatiquement via le well-known endpoint OIDC (`${issuer}/.well-known/openid-configuration`).

### 2. Provider NextAuth (`src/server/infrastructure/api/auth/[...nextauth].tsx`)

Provider OIDC custom :

```typescript
const proConnectProvider = {
  id: "proconnect",
  name: "ProConnect",
  type: "oauth",
  wellKnown: `${configuration().proConnect.issuer}/.well-known/openid-configuration`,
  clientId: configuration().proConnect.clientId,
  clientSecret: configuration().proConnect.clientSecret,
  authorization: { params: { scope: "openid email profile" } },
  idToken: true,
  profile(profile) {
    return {
      id: profile.sub,
      email: profile.email,
      name: `${profile.given_name} ${profile.usual_name}`,
    };
  },
};
```

Le tableau de providers devient dynamique :

```typescript
providers: [
  keycloak,
  proConnectEnabled ? proConnectProvider : null,
  devPasswordEnabled ? credentialsProvider : null,
].filter(Boolean)
```

### 3. Callback JWT

Pas de changement structurel. Le code existant stocke déjà `account.provider` dans le token. Pour ProConnect, les mêmes champs sont stockés : `accessToken`, `refreshToken`, `idToken`, `provider: "proconnect"`.

### 4. Refresh token

Pour le POC, ProConnect est traité comme le credentials provider : `_hasExpired` retourne `false` pour `provider === "proconnect"`. On s'appuie sur la durée de session NextAuth (`NEXTAUTH_SESSION_MAX_AGE_IN_SECONDS`). Le refresh token ProConnect pourra être implémenté plus tard si nécessaire.

### 5. Session callback

Aucun changement. Le lookup par email dans la table `utilisateur` fonctionne quel que soit le provider source.

### 6. Logout (`doFinalSignoutHandshake`)

Ajout d'une branche pour ProConnect. Si `provider === "proconnect"`, appel de l'endpoint de logout ProConnect avec `id_token_hint`, même pattern que Keycloak. L'URL de logout est récupérée depuis la configuration ou construite à partir de l'issuer.

### 7. UI — Page de login (`PageLanding.tsx`)

Deux boutons côte à côte sur la page de login :

- "Se connecter" → `signIn("keycloak")` (existant)
- "Se connecter avec ProConnect" → `signIn("proconnect")` (nouveau)

Chaque bouton ne s'affiche que si le provider correspondant est configuré. Pour le POC, le bouton ProConnect est un simple bouton texte (le logo officiel sera ajouté ultérieurement).

Le `BoutonSeConnecter.tsx` (header) reste inchangé pour le POC.

### 8. Pré-requis

L'utilisateur ProConnect doit exister dans la table `utilisateur` avec le même email que celui retourné par ProConnect. Pas de création automatique de compte (auto-provisioning) dans ce POC.

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/config.ts` | Ajout bloc `proConnect` |
| `src/server/infrastructure/api/auth/[...nextauth].tsx` | Ajout provider, adaptation `_hasExpired`, adaptation `doFinalSignoutHandshake` |
| `src/client/components/PageLanding/PageLanding.tsx` | Ajout bouton ProConnect |
| `.env` | Ajout `PROCONNECT_CLIENT_ID`, `PROCONNECT_CLIENT_SECRET`, `PROCONNECT_ISSUER` |

## Hors scope

- Auto-provisioning des utilisateurs ProConnect
- Refresh token ProConnect
- Logo officiel ProConnect sur le bouton
- Gestion utilisateurs dans l'admin (création sans Keycloak)
- Migration complète de Keycloak vers ProConnect
