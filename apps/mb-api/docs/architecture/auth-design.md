# Authentification mb-api / mb-webapp

## État

Prototype implémenté (PR #2110). Hot path validé bout en bout sur Keycloak distant `dev-keycloak.osc-secnum-fr1.scalingo.io` (realm `DITP`, client `dev-pilote-mb`). Voir « Hors scope » pour ce qui reste à faire avant merge non-prototype.

## Objectif

Auth token-based, IdP standard, sans cookie côté API pour rester ouverte à des clients tiers (partenaires, mobile à terme). Pas de duplication d'endpoints côté webapp.

## Acteurs

- **mb-webapp** (React + Vite, servie par Hono)
- **BFF** (Hono webapp, expose uniquement `/auth/*`)
- **mb-api** (Hono, valide les tokens)
- **IdP** : Keycloak aujourd'hui, ProConnect en direct à terme (les deux sont OIDC standard)
- **Partenaires** : auth par API Key séparée

## Pattern retenu : BFF "token broker" stateless

La webapp appelle l'API **en direct** avec un access token court (mémoire JS).
Le BFF gère uniquement la danse OIDC et garde le refresh token dans un cookie httpOnly chiffré (stateless, pas de Postgres côté webapp).

## Flow de login

1. Webapp non authentifiée → redirige vers `/auth/login`
2. BFF génère `state` + PKCE `code_verifier`, redirige vers l'IdP
3. User s'authentifie sur l'IdP
4. IdP redirige vers `/auth/callback` avec le `code`
5. BFF échange le `code` contre `{ access_token, refresh_token, id_token }`
6. BFF pose un cookie `mb_session` httpOnly chiffré (AES-GCM via `iron-session`, contient le refresh token), redirige vers `/`
7. Webapp boot → `POST /auth/refresh` → reçoit l'access token en JSON, le garde **en mémoire**
8. Webapp appelle l'API avec `Authorization: Bearer <access_token>`

## Refresh transparent

Wrapper fetch côté webapp (`apps/mb-webapp/src/api/client.ts`, `apps/mb-webapp/src/auth/refresh.ts`) :

- intercepte les `401`
- appelle `POST /auth/refresh` (cookie envoyé automatiquement)
- récupère le nouvel access token, retry la requête originale (un seul retry, **mutex single-flight** via une Promise partagée pour éviter N refresh parallèles)
- si `/auth/refresh` répond `401` → redirect `/auth/login`

À chaque refresh, le BFF récupère un **nouveau** refresh token de l'IdP (rotation activée Keycloak → "Revoke Refresh Token" + "Refresh Token Max Reuse = 0") et réémet le cookie. Détection de replay côté IdP en cas de vol.

## Endpoints BFF

Implémentés dans `apps/mb-webapp/src/server/auth/router.ts`.

| Route                | Rôle                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `GET /auth/login`    | Génère state + PKCE S256, redirige vers IdP                       |
| `GET /auth/callback` | Échange code → tokens, pose le cookie de session                  |
| `POST /auth/refresh` | Refresh transparent, retourne l'access token en JSON, rotate le cookie |
| `POST /auth/logout`  | Révoque côté IdP, expire le cookie, retourne l'URL de logout IdP  |

## Cookie de session

```
Set-Cookie: mb_session=<chiffré>;
  HttpOnly; Secure; SameSite=Lax; Path=/auth;
  Max-Age=<refresh_ttl ou 30j>
```

- `Path=/auth` → invisible partout ailleurs (jamais envoyé à l'API)
- `SameSite=Lax` → nécessaire pour le retour de `/auth/callback`
- Chiffrement : `iron-session` (sealed cookies, `sealData`/`unsealData`)
- Contenu : `{ refreshToken, sub }`
- Cookie temporaire `mb_pkce` pendant la danse OIDC (même flags, expire après le callback)

## Côté API (mb-api)

Middleware `authContext` (`apps/mb-api/src/framework/auth/authContext.ts`) appliqué **globalement** : il parse le header `Authorization` si présent et initialise un `AsyncLocalStorage` avec `user | undefined` pour la requête. Aucune route n'est rejetée par ce middleware — c'est `requireUser()` (`apps/mb-api/src/framework/auth/userContext.ts`), appelé par les handlers qui en ont besoin, qui jette un `UnauthorizedError` mappé en 401 par le `ErrorHandler` global.

- `Authorization: Bearer <jwt>` (case-insensitive, RFC 6750) → validation via JWKS (`createRemoteJWKSet` mémoïsé, `apps/mb-api/src/authentication/jwks.ts`)
- Vérifie `iss`, `aud === OIDC_AUDIENCE` (= `dev-pilote-mb`, qui est ajouté nativement par Keycloak dans `aud`), `azp === OIDC_AUTHORIZED_PARTY` (double check)
- `algorithms: ['RS256']` explicite
- `typ` autorisé : `Bearer` (refuse les `id_token` qui ont `typ: 'ID'`)
- `clockTolerance: 30`
- Stocke `{ userId: payload.sub, source: 'jwt' }` dans l'`AsyncLocalStorage` ; `requireUser()` le lit
- Logs `auth.jwt.invalid` via pino sur erreur de validation (le bearer absent/mal formé reste anonyme, pas de log)
- `X-Api-Key: <key>` : non implémenté pour le prototype (cf. Hors scope)

## Modèle utilisateur

- **Prototype** : `sub` IdP utilisé tel quel comme identifiant utilisateur, **pas de row Prisma** côté mb-api.
- **Cible** : à la 1ère connexion, le BFF crée une row `User { id, externalId: sub, email, … }` côté API (just-in-time provisioning, à confirmer vs admin pré-création).
- L'API utilisera toujours l'ID app, jamais le `sub` IdP → permet le switch Keycloak → ProConnect direct sans casser les références (le même user peut avoir deux `externalId` différents).

## Permissions

Cible : in-app (table `Permission`/`Role` côté API), pas dans le JWT. Lookup à chaque requête + cache mémoire court (~30s). Découple l'app de l'IdP. **Non implémenté pour le prototype.**

## API Keys partenaires

Cible :
- Table `ApiKey { hash, ownerId, scopes, createdAt, revokedAt }`
- Header `X-Api-Key`, distinct du flow OIDC
- Pas de refresh, pas d'expiration auto (révocation manuelle)

**Non implémenté pour le prototype.**

## Sécurité

- **Headers HTTP** : `hono/secure-headers` côté BFF mb-webapp — CSP stricte (`default-src 'self'`, `frame-ancestors 'none'`, `connect-src 'self' <api>`), HSTS preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **CSRF** : `SameSite=Lax` + POST sur `/auth/refresh` & `/auth/logout` + check `Origin === PUBLIC_BASE_URL` (helper `assertSameOrigin`). Pas de token CSRF nécessaire (origine unique).
- **CORS API** : whitelist de l'origine webapp (`CORS_ORIGINS=https://mb-webapp.localhost`), `credentials: false` (l'API est purement Bearer, aucun cookie attendu) ; les partenaires ne sont pas concernés (server-to-server).
- **Token leak prevention** : le client `ky` (`apps/mb-webapp/src/api/client.ts`) n'attache `Authorization` que si l'origine cible match `env.apiUrl`.
- **Nonce OIDC** : généré au login, stocké chiffré dans le cookie `mb_pkce`, validé via `expectedNonce` au callback.
- **Rate limit** : `hono-rate-limiter` sur `/auth/login` (10/min/IP), `/auth/refresh` (60/min/IP), `/auth/logout` (30/min/IP). Store in-memory pour le proto — passer Redis pour multi-instance.
- **Audit trail** : pino côté API et BFF, events `auth.*` (start/success/failed). Tokens et cookies redacted dans les logs.
- **Clock skew** : marge ~30s sur la validation `exp`.
- **Rotation refresh** : activée côté Keycloak (Realm settings → Tokens → Revoke Refresh Token + Max Reuse=0).
- **Kill-switch global** : rotation de la clé de chiffrement du cookie (`SESSION_SECRET`) → invalide toutes les sessions.

### Configuration Keycloak requise

- **Revoke Refresh Token + Max Reuse = 0** : Realm Settings → Tokens.

> **Note `aud`** : on s'appuie aujourd'hui sur le `aud` natif Keycloak (`dev-pilote-mb`, le client_id), sans audience mapper dédié. Trade-off : on accepte tout access token émis pour ce client, sans distinction de resource server. Tant que mb-api est le seul resource server consommé par ce client, c'est OK. Le jour où un second backend partage le même client, il faudra ajouter un Audience mapper avec une valeur custom (ex. `mb-api`) et basculer `OIDC_AUDIENCE` dessus. Le double check `azp === OIDC_AUTHORIZED_PARTY` reste actif comme couche complémentaire.

## Libs utilisées

- **BFF** : `openid-client` v6 (panva) + `iron-session` v8 + `hono` v4 + `@hono/vite-dev-server`
- **API** : `jose` (validation JWT)
- **Webapp** : pas de lib OIDC côté client (le BFF fait tout), wrapper `ky` maison

## Notes d'implémentation (gotchas rencontrés)

Choses à connaître si tu touches au code :

1. **Vite écrase les headers CORS de Hono.** Il faut `server.cors: false` dans le `vite.config.ts` de mb-api (et préventivement de mb-webapp). Sans ça, `Access-Control-Allow-Credentials` disparaît silencieusement de la réponse → préflight rejeté côté browser. Cf. https://hono.dev/docs/middleware/builtin/cors#using-with-vite
2. **`refresh_expires_in: 0` sur Keycloak.** Avec `offline_access`, Keycloak renvoie `0` (= « pas d'expiration »). Si on s'en sert tel quel comme `Max-Age` de cookie, le browser le supprime immédiatement. Helper `sessionTtlSeconds()` qui fallback sur 30 jours quand `<= 0`.
3. **`context.req.url` côté BFF en dev.** Avec portless+Vite, l'URL interne est `http://127.0.0.1:<port>/...`, pas l'URL publique. Pour l'échange `code → token`, le `redirect_uri` est reconstruit à partir de `serverEnv.OIDC_REDIRECT_URI` + le `search` de la requête, sinon Keycloak rejette en `unauthorized_client` (Keycloak utilise ce code pour les mismatches `redirect_uri` à l'échange code, pas seulement pour les vrais credentials invalides).
4. **`@hono/vite-dev-server` pour faire tourner la BFF en dev.** Sans ça, `npm run dev` ne lance que Vite (SPA seul), pas la BFF Hono. La BFF expose juste `/auth/*` et `/healthz`, Vite gère le SPA en fall-through. Single-port, single-origin en dev.

## Limites assumées

- Pas de révocation locale fine (stateless) → on s'appuie sur la rotation refresh + révocation IdP
- Pas de liste des sessions actives (stateless)
- Multi-device gratuit (un cookie par device, pas de coordination)

## Hors scope du prototype (à venir)

- Table `User` Prisma + JIT provisioning vs admin pré-création — **point ouvert**
- API Keys partenaires (`X-Api-Key`)
- Permissions / roles in-app
- Détection replay des refresh tokens côté app, kill-switch global, monitoring rotation
- ProConnect direct (purement de la conf `openid-client` le moment venu, pas de changement d'archi)
- Keycloak local en docker-compose (on dépend du Keycloak distant pour l'instant) — **point ouvert**
- Politique multi-device explicite à acter ou pas — **point ouvert**

## Points ouverts à durcir

- **`id_token_hint` sur logout** : `buildEndSessionUrl` ne passe pas `id_token_hint` ; à ajouter pour éviter le prompt de confirmation Keycloak (nécessite de stocker l'id_token dans la session).
- **Race refresh entre onglets** : le mutex `inFlight` est par-onglet. Deux onglets ouverts → 2 refresh simultanés → la rotation Keycloak invalide la session. Solutions à explorer : `BroadcastChannel` côté webapp, ou lock côté BFF.
