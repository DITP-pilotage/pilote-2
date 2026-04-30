# Authentification mb-api / mb-webapp — cible

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
6. BFF pose un cookie `mb_session` httpOnly chiffré (AES-GCM, contient le refresh token), redirige vers `/`
7. Webapp boot → `POST /auth/refresh` → reçoit l'access token en JSON, le garde **en mémoire**
8. Webapp appelle l'API avec `Authorization: Bearer <access_token>`

## Refresh transparent

Wrapper fetch côté webapp :

- intercepte les `401`
- appelle `POST /auth/refresh` (cookie envoyé automatiquement)
- récupère le nouvel access token, retry la requête originale (un seul retry, mutex pour éviter N refresh parallèles)
- si `/auth/refresh` répond `401` → redirect `/auth/login`

À chaque refresh, le BFF récupère un **nouveau** refresh token de l'IdP (rotation activée Keycloak → "Revoke Refresh Token") et réémet le cookie. Détection de replay côté IdP en cas de vol.

## Endpoints BFF

| Route                | Rôle                                                              |
| -------------------- | ----------------------------------------------------------------- |
| `GET /auth/login`    | Génère state + PKCE, redirige vers IdP                            |
| `GET /auth/callback` | Échange code → tokens, pose le cookie de session                  |
| `POST /auth/refresh` | Refresh transparent, retourne l'access token en JSON, rotate le cookie |
| `POST /auth/logout`  | Révoque côté IdP, expire le cookie, retourne l'URL de logout IdP  |
| `GET /auth/me`       | (optionnel) profil utilisateur                                    |

## Cookie de session

```
Set-Cookie: mb_session=<chiffré>;
  HttpOnly; Secure; SameSite=Lax; Path=/auth;
  Max-Age=<refresh_ttl>
```

- `Path=/auth` → invisible partout ailleurs (jamais envoyé à l'API)
- `SameSite=Lax` → nécessaire pour le retour de `/auth/callback`
- Chiffrement : `iron-session` (sealed cookies)
- Contenu : `{ refresh_token, sub }`

## Côté API (mb-api)

Middleware unique qui détecte la source :

- `Authorization: Bearer <jwt>` → validation via JWKS de l'IdP (`jose`, cache des clés)
- `X-Api-Key: <key>` → lookup table `ApiKey` (hash argon2/bcrypt)
- Pose `c.set('user', { id, source: 'jwt' | 'api_key' })`

## Modèle utilisateur

- À la 1ère connexion, le BFF crée une row `User { id, externalId: sub, email, … }` côté API (just-in-time provisioning, à confirmer vs admin pré-création).
- L'API utilise toujours l'ID app, jamais le `sub` IdP → permet le switch Keycloak → ProConnect direct sans casser les références (le même user peut avoir deux `externalId` différents).

## Permissions

In-app (table `Permission`/`Role` côté API), pas dans le JWT. Lookup à chaque requête + cache mémoire court (~30s). Découple l'app de l'IdP.

## API Keys partenaires

- Table `ApiKey { hash, ownerId, scopes, createdAt, revokedAt }`
- Header `X-Api-Key`, distinct du flow OIDC
- Pas de refresh, pas d'expiration auto (révocation manuelle)

## Sécurité

- **CSRF** : `SameSite=Lax` + POST sur `/auth/refresh` & `/auth/logout` + check `Origin`/`Referer`. Pas de token CSRF nécessaire (origine unique).
- **CORS API** : whitelist de l'origine webapp ; les partenaires ne sont pas concernés (server-to-server).
- **Clock skew** : marge ~30s sur la validation `exp`.
- **Rotation refresh** : activée côté Keycloak.
- **Kill-switch global** : rotation de la clé de chiffrement du cookie → invalide toutes les sessions.

## Libs cibles

- BFF : `openid-client` (panva) + `iron-session` + `hono`
- API : `jose` pour la validation JWT
- Webapp : pas de lib OIDC (le BFF fait tout), juste un wrapper fetch maison

## Limites assumées

- Pas de révocation locale fine (stateless) → on s'appuie sur la rotation refresh + révocation IdP
- Pas de liste des sessions actives (stateless)
- Multi-device gratuit (un cookie par device, pas de coordination)

## Points ouverts

1. Provisioning JIT vs pré-création admin
2. Politique multi-device explicite à acter ou pas
3. Configuration ProConnect direct (le jour venu) : surtout du config `openid-client`, pas de changement d'archi
