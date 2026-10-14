# Socle de suivi des événements Matomo (pilote-ppg) — design

Ticket : [PIL-1880](https://data-ditp.atlassian.net/browse/PIL-1880). Consommateurs : PIL-1876, PIL-1877, PIL-1878, PIL-1879 (assistant IA). Suite : PIL-1889 (remplacer `matomo.js` par ce socle pour les pages vues).

## Objectif

Donner à pilote-ppg un émetteur d'événements produit vers Matomo, avec un contrat typé unique que les quatre US de l'assistant IA utiliseront. Ce ticket livre le socle seul : aucun événement n'est branché dans l'UI.

## Décisions

- **Émetteur autonome** vers l'API HTTP de Matomo (`matomo.php`), sur le modèle de `packages/kpilote-shared/src/analytics`, et non via `window._paq`. À terme (PIL-1889), il remplace `matomo.js`.
- **Code porté dans ppg**, pas importé de kpilote (ppg n'utilise aucun package `kpilote-*`). Une mutualisation éventuelle fera l'objet d'un refacto ultérieur.
- **Correspondance dimension → ID Matomo par variable d'env**, avec repli dans `e_n` pour toute dimension sans ID : le socle reste fonctionnel quelle que soit la configuration Matomo de l'environnement.

## Dimensions Matomo (site 103, créées)

Le paramètre de l'API de tracking est `dimension<idcustomdimension>`. Les identifiants ne figurent pas dans le dépôt : ils sont lus depuis `NEXT_PUBLIC_MATOMO_DIMENSIONS` (JSON `{"<dimension>":<idcustomdimension>}`), renseignée dans l'env de chaque environnement à partir de l'admin Matomo.

| Dimension | Portée | Valeurs |
|---|---|---|
| `profil_pilote` | Visite | Code exact du profil (`ProfilCode`), dont `DITP_ADMIN` |
| `conversation_id` | Action | Identifiant `chat_conversation.id` |
| `llm_call_id` | Action | Identifiant `llm_calls.id` |
| `proposition_id` | Action | Identifiant stable de proposition (créé par PIL-1877), jamais le texte |
| `proposition_mode` | Action | `envoi_direct`, `preremplissage` |
| `type_question` | Action | `premiere_libre`, `premiere_proposition`, `suivante` |
| `nombre_choix` | Action | Entier |
| `position_choix` | Action | Entier |

## Architecture

```
apps/pilote-ppg/src/client/analytics/
  schema.ts         catégories, actions, noms, dimensions (as const + types)
  buildRequest.ts   événement → query string matomo.php
  browser.ts        createBrowserAnalytics : émetteur actif ou muet
  analytics.ts      instance unique, config lue depuis NEXT_PUBLIC_*
  useAnalytics.ts   hook React : injecte profil_pilote depuis la session
```

### `schema.ts` — le contrat

- `ANALYTICS_CATEGORIES = ['assistant_ia']`.
- `ANALYTICS_ACTIONS` : `view`, `open`, `minimize`, `resume`, `close`, `select`, `submit`, `start`, `stop`, `retry`, `success`, `error`.
- `ANALYTICS_EVENT_NAMES` : noms cités par le ticket (`question.send`, `response.choices`, `response.choice`). Les US ajoutent les leurs ici.
- `AnalyticsDimensions` : objet aux clés fermées sur les 8 dimensions, toutes optionnelles. `proposition_mode` et `type_question` sont des unions littérales ; `nombre_choix` et `position_choix` des `number` ; les identifiants des `string`.
- `AnalyticsEvent = { category; action; name; dimensions?: AnalyticsDimensions }`.

Il n'existe aucun champ libre (pas de `context: Record<string, …>` comme dans kpilote) : seul ce que déclare le schéma peut être transmis. C'est la garantie structurelle qu'aucun texte de question, réponse, dictée, commentaire, choix ou URL suivie ne part.

### `buildRequest.ts`

`buildEventRequest(event, config, page)` produit les paramètres :

| Paramètre | Source |
|---|---|
| `idsite`, `rec=1`, `apiv=1` | config |
| `e_c`, `e_a`, `e_n` | catégorie, action, nom |
| `dimension<ID>` | dimensions dont l'ID est connu |
| suffixe `?cle=valeur&…` de `e_n` | dimensions sans ID, triées par clé |
| `url` | origine + chemin courant, **sans query string ni fragment** |
| `_id` | identifiant visiteur `matomo.js` s'il est fourni |
| `rand` | anti-cache |

Les dimensions `undefined` sont ignorées.

### `browser.ts`

`createBrowserAnalytics({ config, enabled, doNotTrack, send?, getVisitorId? })` renvoie `{ status, trackEvent }`.

- Émetteur muet (`trackEvent` sans effet) si la config est absente, si le suivi est désactivé ou si Do Not Track est actif. `status` indique la raison.
- Envoi par `navigator.sendBeacon`, repli `fetch` `keepalive` `no-cors` dont l'échec est ignoré. Le tout dans un `try/catch` : `trackEvent` ne lève jamais et ne renvoie rien d'attendable. Une erreur d'émission ne bloque donc aucune action utilisateur.
- Pont de transition vers PIL-1889 : `getVisitorId` lit `window.Matomo.getAsyncTracker().getVisitorId()` quand `matomo.js` est chargé, pour que les événements tombent dans la même visite que les pages vues. Toute erreur ou absence donne `undefined` (pas de `_id`).
- `globalDimensions` (dans la config) fusionnés sous les dimensions de l'événement.

### `analytics.ts`

- Activation : `NEXT_PUBLIC_RECORD_ANALYTICS === "true"`, plus `NEXT_PUBLIC_MATOMO_URL` et `NEXT_PUBLIC_MATOMO_SITE_ID` : même garde que les pages vues aujourd'hui dans `_app.tsx`.
- `NEXT_PUBLIC_MATOMO_DIMENSIONS` parsé en `Record<dimension, number>` : JSON invalide, clé inconnue ou ID non entier positif → entrée ignorée (au pire `{}`, donc repli `e_n`).
- Do Not Track respecté (`navigator.doNotTrack`), comme l'annonce la page données personnelles.
- Une ligne `console.info('[analytics] actif|inactif — raison')` au premier usage côté navigateur, pour distinguer « rien n'est parti » de « rien ne devait partir ».
- Côté serveur (SSR), l'instance est muette.

### `useAnalytics.ts`

`useAnalytics()` renvoie `trackEvent(event)`, qui ajoute `profil_pilote: session.profil` (via `useSession`) aux dimensions. Les US n'ont rien à fournir pour le profil.

### Configuration

- `config.ts` (section `analytics`) et `.env.example` : ajout de `NEXT_PUBLIC_MATOMO_DIMENSIONS`.
- CSP (`src/proxy.ts`) : `connect-src https://stats.beta.gouv.fr/` déjà présent, rien à changer.
- `_app.tsx` et le suivi des pages vues (`@socialgouv/matomo-next`) : inchangés.

## Hors périmètre

- Branchement des événements dans l'UI (PIL-1876 à PIL-1879).
- Exposition de `llm_call_id` côté client (US concernées).
- Migration des pages vues et retrait de `matomo.js` (PIL-1889).
- Mutualisation avec le socle kpilote.

## Tests

Tests unitaires vitest, projet `client`, fichiers `*.unit.test.ts` :

- `buildRequest` : dimension avec ID → `dimension<ID>` ; sans ID → suffixe trié de `e_n` ; `undefined` ignorée ; `url` réduite au chemin ; `_id` présent seulement si fourni.
- `browser` : muet si non configuré, désactivé ou DNT (`send` jamais appelé) ; un `send` qui lève ne remonte pas ; un `getVisitorId` qui lève donne une requête sans `_id` ; `globalDimensions` fusionnés et surchargés par l'événement.
- Parsing de `NEXT_PUBLIC_MATOMO_DIMENSIONS` : JSON invalide, clé inconnue, ID non entier → ignorés.

Pas d'E2E : aucun parcours utilisateur ne change. La vérification dans Matomo (événement visible avec catégorie, action, nom et dimensions) se fait en recette, une fois une US branchée ou par un appel manuel en console.
