# Centre d'aide kpilote — éditeur « en place » + rendu partagé

Date : 2026-07-23
Branche : `feat/centre-aide-editeur-kpilote`
Statut : design validé, en attente de relecture avant plan d'implémentation

## Contexte et objectif

kpilote n'a aujourd'hui aucun centre d'aide. L'ancien éditeur de `apps/pilote-ppg`
(System B : 3 colonnes arborescence / éditeur / aperçu, HTML en base, nœuds custom
Callout/Accordéon/Icône/Vidéo, rendu via un DOMParser séparé) servait de référence, mais le
client reprochait aux 3 tuiles de **ne pas rendre exactement comme l'affichage live**.

On refait ce centre d'aide pour kpilote « en mieux » :

- **Édition « en place »** (façon Notion / react.dev) : la surface d'édition **est** le rendu final.
  Plus d'aperçu séparé qui peut diverger.
- **Composants de rendu partagés** entre l'éditeur (NodeView tiptap) et le lecteur (rendu HTML→React).
  Un seul composant DSFR par bloc → zéro divergence possible, et **ajouter un nouveau bloc = un seul endroit**.
- **Persistance HTML + texte brut** : on stocke le HTML riche *et* un `contenuTexte` dérivé, comme pour
  les commentaires, pour préparer la recherche cmdk.

Décisions produit validées :

- Périmètre : **sous-système complet**, mais l'UI de la page lecteur reste **minimale** ce cycle-ci
  (voir « Lecteur »). L'accès se fait via un **lien dans le footer webapp**, à côté d'Accessibilité /
  Mentions légales. Layout lecteur soigné, arbo de lecture et recherche cmdk = cycles ultérieurs.
- Structure : **arborescence GROUPE/PAGE + état brouillon/publié** (miroir ppg).
- Images : **par URL uniquement** (coller un lien vers un fichier déjà hébergé), comme ppg. L'extension
  image est conçue pour brancher un upload plus tard.
- Blocs custom : **Callout, Accordéon, Image, Icône, Vidéo**.
- Style : langage **DSFR** via les tokens de `packages/kpilote-ui/theme.css` (`--color-primary #000091`,
  Marianne, etc.) et composants **radix + maquillage DSFR** comme le reste de kpilote-ui — jamais de
  classes `fr-*` brutes.

## Vue d'ensemble de l'architecture

Trois apps + un socle de rendu partagé, deux flux qui convergent vers kpilote-api / Postgres.

**① Écriture (rôle ADMIN) — `apps/kpilote-admin`.**
Éditeur « en place » sous `_authed/centre-aide/`. Écrit via le BFF Hono (`/api/centre-aide`), qui
injecte le `Authorization: Bearer <clé ADMIN>` de la session. Le contenu est **par environnement**
(chaque base a son centre d'aide), cohérent avec indicateurs/référentiels.

**② Lecture (session OIDC utilisateur) — `apps/kpilote-webapp`.**
Appelle un endpoint public de kpilote-api qui ne renvoie que le **publié & non masqué**. Entrée = lien
footer. UI minimale ce cycle-ci.

**③ Socle de rendu partagé — `packages/kpilote-ui`.**
Composants de rendu (Callout, Accordéon, Icône, Vidéo, Image) + renderer HTML→React sanitizé. Les
**mêmes** composants servent de NodeView tiptap (éditeur) et de rendu (lecteur).

```
kpilote-admin (éditeur tiptap) ──/api/centre-aide (Bearer ADMIN)──▶ BFF Hono ──▶ kpilote-api
                                                                                   (module centreAide,
                                                                                    ensurePrincipal isApiKeyAdmin)
                                                                                        │ Prisma
                                                                                        ▼
kpilote-webapp (lecteur + footer) ──GET /centre-aide/public (OIDC)──▶ kpilote-api ──▶ Postgres
                                                                                   (article_centre_aide)

packages/kpilote-ui : Callout · Accordion · Icone · Video · Image  +  HTML→React (data-type)
        ▲ NodeView tiptap (admin)              ▲ rendu (webapp)
```

## Modèle de données (kpilote-api, Prisma)

Nouveau modèle `article_centre_aide`, miroir de ppg.

| Champ | Type | Rôle |
|---|---|---|
| `id` | uuid | PK |
| `type` | enum `ArticleCentreAideType { GROUPE, PAGE }` | nature du nœud |
| `parentId` | uuid? (self-relation) | arborescence |
| `ordre` | int | tri entre frères |
| `estPublie` | bool | a une version publiée visible |
| `estMasque` | bool | masqué du lecteur même si publié |
| `titre` | string | titre publié (clé d'arbo) |
| `titreAffiche` | string | titre publié affiché |
| `contenu` | string (HTML) | corps publié |
| `contenuTexte` | string | texte brut dérivé du `contenu` publié (recherche) |
| `titreBrouillon` | string | titre brouillon |
| `titreAfficheBrouillon` | string | titre affiché brouillon |
| `contenuBrouillon` | string (HTML) | corps brouillon |
| `createdBy` / `updatedBy` | uuid (principal) | audit |
| `createdAt` / `updatedAt` | datetime | audit |

Notes :

- Migration Prisma + `prisma generate` ; enum ajouté au schéma. Suivre le workflow kpilote-api
  (generate `--sql` après `migrate dev` si besoin, `updated_at` géré, etc.).
- `contenuTexte` est **dérivé côté API** à chaque écriture du `contenu` publié (à la publication).
  Version **durcie** de `htmlToPlainText` (voir plus bas) : elle n'est calculée que pour le contenu
  publié, puisque la recherche ne porte que sur le publié.
- Pas de champ `contenuTexteBrouillon` (inutile : on ne cherche pas dans les brouillons).
- On ne réplique pas le mécanisme d'assets ppg (URL externe uniquement, pas de table d'assets).

### Dérivation du texte brut

Helper `htmlToPlainText` dédié au centre d'aide (le helper commentaire est trop minimal pour nos blocs).
Exigences :

- Insère des séparateurs d'espace/de ligne aux frontières de blocs (`</p>`, `</li>`, `</h2>`, callout,
  accordéon…) pour ne pas coller les mots.
- Ignore le « chrome » des nœuds custom (attributs `data-*`, icônes) et ne garde que le texte lisible,
  y compris le **titre d'un accordéon** et le texte d'un callout.
- Décode les entités courantes, normalise les espaces.
- Testé unitairement (`utils.test.ts`) sur des cas callout/accordéon/listes/titres.

## Socle de rendu partagé (`packages/kpilote-ui`)

Principe directeur : **une définition par bloc**, déclinée automatiquement. On sépare le **rendu**
(partagé, sans dépendance ProseMirror/tiptap) de l'**édition** (kpilote-admin, avec tiptap), pour ne
jamais tirer ProseMirror dans la webapp.

### Partie rendu — dans `packages/kpilote-ui` (aucune dép tiptap)

Pour chaque bloc :

- Un **composant React** visuel, construit en **radix + maquillage DSFR** en suivant les conventions des
  composants existants de kpilote-ui (CVA, `clsxm`, tokens `theme.css`). Si un équivalent existe déjà
  (ex. un `Accordion` radix), on le réutilise/l'étend plutôt que d'en recréer un.
- Un **contrat HTML** : balise + attributs `data-type="<bloc>"` et `data-*` (ex. `data-color` pour le
  callout, `data-title` pour l'accordéon, `data-icon-type` pour l'icône, `src` pour image/vidéo). C'est
  le format sérialisé stocké en base.
- Une entrée dans un **manifeste de blocs** partagé (`type`, balise, attributs, composant) — la source de
  vérité commune consommée par le renderer lecteur ET la fabrique d'extensions éditeur.

Le **renderer lecteur** (`RenduContenuCentreAide`) : parse le HTML stocké (`DOMParser`), sanitize
(DOMPurify), et mappe chaque `data-type` vers le composant du manifeste (approche ppg, mais alimentée par
le manifeste partagé plutôt qu'un mapping dupliqué). Exporte aussi les classes de rendu de base
(typographie DSFR) pour styler le corps de texte, réutilisées par le canevas d'édition.

### Partie édition — dans `apps/kpilote-admin` (avec tiptap)

- Une **fabrique** transforme une entrée du manifeste en **Node tiptap** : `parseHTML`/`renderHTML` alignés
  sur le contrat HTML, `addNodeView(ReactNodeViewRenderer(<même composant de rendu>))`, et la/les commande(s)
  d'insertion.
- Une **entrée de menu `/`** par bloc (libellé, icône lucide, commande d'insertion) déclarée à côté.

**Ajouter un nouveau bloc** = créer le composant dans kpilote-ui + l'ajouter au manifeste (contrat HTML +
entrée menu). L'insertion éditeur, la sérialisation, la NodeView, le rendu lecteur et le menu `/` en
découlent, sans autre modification.

### Blocs livrés ce cycle

| Bloc | `data-type` | Attributs | Notes |
|---|---|---|---|
| Callout | `callout` | `data-color` (info/succès/avertissement/alerte) | encadré DSFR |
| Accordéon | `accordion-item` | `data-title` | titre éditable + contenu repliable |
| Image | `image` | `src`, `alt` | insertion par **URL** (modale), `allowBase64: false` |
| Icône | `icone` | `data-icon-type` | atome inline, registre d'icônes |
| Vidéo | `video` | `src` | atome bloc, embed `iframe` |

## Éditeur (kpilote-admin)

- **Dépendances** à ajouter : `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`,
  `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`,
  `@tiptap/extension-underline` (mêmes versions v3 que kpilote-webapp).
- **Route** : `src/routes/_authed/centre-aide/` (index = éditeur + arbo), suivant la forme des routes
  `indicateurs/`. Ajouter une `BarCard` sur `_authed/fonctionnalites.tsx` (icône lucide type `LifeBuoy`).
- **Layout « en place »** :
  - Gauche : **arborescence** (créer GROUPE/PAGE, déplacer monter/descendre/entrer/sortir, supprimer,
    badges brouillon/publié/masqué). Réutilise l'utilitaire d'arbre (construire l'arbre depuis la liste plate).
  - Centre : **canevas d'édition** stylé avec les classes de rendu partagées → c'est l'aperçu.
  - Haut : barre d'actions (badge d'état, *Enregistrer le brouillon*, *Publier*, *Dépublier*, *Masquer*,
    option *voir le rendu publié*).
- **A1 — bulle flottante** (`BubbleMenu`) à la sélection : gras, italique, souligné, barré, lien (modale
  d'insertion d'URL), H2/H3, listes.
- **A2 — menu `/`** (suggestion tiptap) + poignée `+` sur ligne vide : insère les blocs du manifeste
  (callout, accordéon, image, icône, vidéo) + titre / liste / séparateur.
- **StarterKit** configuré comme les autres éditeurs kpilote (heading limité à H2/H3, code/codeBlock/
  blockquote/hr selon besoin), + Link (`openOnClick: false`), Underline, Image, Placeholder.
- **Données** : couche `src/api/centreAide.ts` (ky `bffClient`) + `src/queries/centreAide.ts` (query
  options react-query), route loader + `useSuspenseQuery`, mutations `useMutation` + invalidation, toasts.
  Schémas partagés depuis `@pilote/kpilote-shared/centreAide`.

## Endpoints kpilote-api (module `src/centreAide/`)

Structure calquée sur `apiKey`/`indicateur` : `routes.ts` (`createOpenApiHono` + `createRoute`,
`middleware: [requireAuthentication]`, tags `['CentreAide','Admin']`, réponses incluant `403: erreur403`),
`commands/`, `queries/`, `utils.ts` (mapper Prisma→API + `htmlToPlainText`). Accès Prisma via `db()`,
écritures dans `withTransaction`, retours `neverthrow ResultAsync`.

**Admin** — chaque handler commence par `ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé
API de rôle ADMIN')` :

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/centre-aide/articles` | arbo complète (brouillons inclus) |
| GET | `/centre-aide/articles/:id` | détail |
| POST | `/centre-aide/articles` | créer un GROUPE ou une PAGE |
| PUT | `/centre-aide/articles/:id` | enregistrer le brouillon (titre + contenu) |
| POST | `/centre-aide/articles/:id/publier` | publier (copie brouillon→publié, dérive `contenuTexte`) |
| POST | `/centre-aide/articles/:id/depublier` | dépublier |
| POST | `/centre-aide/articles/:id/visibilite` | basculer `estMasque` |
| POST | `/centre-aide/articles/:id/deplacer` | monter/descendre/entrer/sortir |
| DELETE | `/centre-aide/articles/:id` | supprimer (avec ses descendants) |

**Public** — `requireAuthentication` (utilisateur OIDC, pas de clé admin) :

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/centre-aide/public` | arbo publiée & non masquée, champs publiés uniquement |

Câblage : `import { centreAideRoutes } from '@/centreAide/routes'` + `app.route('/', centreAideRoutes)`
dans `src/app.ts`, entrée tsconfig `@/centreAide/*` (et `vite.config.ts` pour vitest).

### Schémas partagés

`packages/kpilote-shared/src/centreAide.ts` : schémas zod + types (article API model, body create,
body upsert brouillon, payload public). Ajouter l'export `"./centreAide"` dans le `package.json` du paquet.

### BFF admin

Étendre l'allowlist `SAFE_PATH` du proxy (`apps/kpilote-admin/src/server/api/router.ts`) pour autoriser le
segment `centre-aide`. Sans ça, tous les appels renvoient 403. La frontière de sécurité de l'allowlist doit
rester stricte (mêmes garde-fous anti-traversal que l'existant).

## Lecteur (kpilote-webapp)

Périmètre minimal ce cycle-ci :

- **Lien footer** à côté d'Accessibilité / Mentions légales (footer récent, cf. commit « pages légales &
  footer »), pointant vers une route centre d'aide.
- **Page basique** qui appelle `GET /centre-aide/public` et **rend le contenu publié** via
  `RenduContenuCentreAide` (composants partagés + sanitize). Pas d'arbo de lecture soignée ni de recherche
  — reportés. Si aucun contenu publié : état vide neutre.
- Vérifier à l'implémentation que kpilote-webapp (Next) peut consommer `packages/kpilote-ui` (a priori oui,
  déjà sur Tailwind). Sinon, ajuster le packaging du socle partagé.

## Sécurité

- Écriture réservée aux clés **ADMIN** (`ensurePrincipal(isApiKeyAdmin)`) ; lecture publique restreinte au
  publié & non masqué et aux champs publiés (jamais les brouillons).
- **Sanitize au rendu** (DOMPurify) côté lecteur, même si le contenu est rédigé par un admin de confiance.
- Allowlist BFF admin à étendre prudemment.

## Hors périmètre (cycles ultérieurs)

- UI lecteur soignée (arborescence de navigation, sommaire, layout façon react.dev).
- Recherche cmdk sur `contenuTexte` (endpoint de recherche + intégration command palette webapp).
- Upload d'images (l'extension image est prête à le brancher).
- Migration du contenu ppg existant.
- Index full-text (tsvector/GIN) sur `contenuTexte`.

## Découpage d'implémentation suggéré

1. **Socle de rendu partagé** (`packages/kpilote-ui`) : composants blocs DSFR + manifeste + renderer +
   `htmlToPlainText` + tests.
2. **kpilote-api** : schéma Prisma + migration, schémas partagés, module `centreAide` (routes/commands/
   queries/utils), câblage app + tsconfig, tests.
3. **kpilote-admin** : deps tiptap, extensions via la fabrique, éditeur « en place » (bulle + menu /),
   arbo, couche data/queries, route + carte hub, extension allowlist BFF.
4. **kpilote-webapp** : lien footer + page lecteur basique consommant le socle partagé.
