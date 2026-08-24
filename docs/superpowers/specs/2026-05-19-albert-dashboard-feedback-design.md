# Spec — Dashboard feedback Albert dans le panel admin

- **Ticket** : [PIL-1518](https://data-ditp.atlassian.net/browse/PIL-1518)
- **Parent** : PIL-1517 — LLM - Panel admin
- **Date** : 2026-05-19
- **App** : `apps/pilote-ppg`

## Contexte

Le panel administrateur expose déjà un onglet **Albert** qui contient l'interface de chat (`AlbertChat`). Les conversations sont persistées (`chat_conversation`) et chaque tour LLM est consigné dans `llm_calls` avec une évaluation (`POSITIVE` / `NEGATIVE`) et un éventuel commentaire libre.

Aujourd'hui, l'équipe DITP n'a aucun moyen d'explorer ces retours pour améliorer le LLM. On veut une vue dashboard listant toutes les conversations, avec les feedbacks associés, accessible aux administrateurs.

## Objectif

Permettre aux administrateurs DITP de consulter la liste complète des conversations Albert, de filtrer sur la présence de feedback (👍 / 👎 / commentaire), et d'ouvrir une vue détaillée pour lire la conversation et ses feedbacks.

## Hors scope

- Export CSV / Excel de la liste
- Annotation ou correction des feedbacks par l'admin
- Suppression de conversations depuis le dashboard
- Statistiques agrégées (taux de 👍, etc.) — réservées à une future story
- Feature flag : la fonctionnalité est livrée directement, restreinte par profil

## Données

### Tables existantes utilisées

- `chat_conversation` : `id`, `utilisateur_id`, `titre`, `messages` (JSON), `contexte`, `created_at`, `updated_at`
- `llm_calls` : `id`, `chat_id` (= `chat_conversation.id`, non-FK explicite), `utilisateur_id`, `transcript`, `evaluation` (`POSITIVE` / `NEGATIVE` / `null`), `commentaire`, `created_at`
- `utilisateur` : `id`, `nom`, `prenom`, `email`, `profilCode`
- `profil` : `code`, `nom`

### Pas de modification de schéma

Aucune migration n'est nécessaire. Les agrégats booléens (a 👍 / a 👎 / a commentaire) sont calculés à la lecture via `EXISTS` côté SQL.

### Matching `llm_calls` ↔ messages assistant

Les `llm_calls` n'ont pas de référence directe à un message du transcript. On suppose un ordre chronologique strict : les `llm_calls` triés par `created_at asc` correspondent aux messages assistant du transcript dans le même ordre.

- 1er `llm_call` → 1er message assistant de la conversation
- 2e `llm_call` → 2e message assistant
- etc.

Si la conversation a plus de messages assistant que de `llm_calls` (édit historique, etc.), les messages excédentaires sont affichés sans badge d'évaluation. C'est cohérent avec `EvaluerChatUseCase` qui n'évalue que le dernier `llm_call` du `chat_id`.

## UX

### Navigation

La page `/panel-administrateur/albert` accueille deux sous-onglets via le composant existant `NavigationTertiaire` :

- **Discussion** (défaut) → composant `AlbertChat` actuel, inchangé
- **Dashboard** → nouveau composant `AlbertDashboard`

L'onglet actif est piloté par le query param `?onglet=discussion|dashboard`. Default = `discussion`. Permet partage de lien, navigation back, et tests e2e.

### Vue Dashboard — liste

**Barre filtres** (placée au-dessus du tableau) :

- Champ recherche texte : matche sur `chat_conversation.titre` ET premiers caractères du 1er message user (extrait stocké côté serveur lors du `groupBy`, voir Architecture)
- 3 toggles booléens, additifs en AND : `Avec 👍` · `Avec 👎` · `Avec commentaire`
- Sélecteur multi profils (alimenté par `referentielProfils` existant)
- Bouton "Réinitialiser"

**Tableau** :

Colonnes (gauche → droite) :

| Colonne | Contenu | Tri |
|---|---|---|
| Conversation | `titre` (ou `Sans titre`) en ligne principale + extrait 80 caractères du 1er message user en sous-ligne grise | non |
| Utilisateur | `Prénom Nom` + email petit en sous-ligne grise | non |
| Profil | Badge avec `profil.nom` | non |
| Créé le | Date courte (jj/mm/aaaa) | asc/desc |
| MAJ | Date courte | asc/desc — **default desc** |
| 👍 | Icône cochée / tiret | non |
| 👎 | Icône cochée / tiret | non |
| 💬 | Icône cochée / tiret | non |

- Toute la ligne est cliquable et ouvre la modale détail (curseur pointer, hover gris léger)
- Pagination serveur : 25 conversations / page, contrôles précédent / suivant, indicateur "X – Y sur N"
- État vide : illustration neutre + message "Aucune conversation pour ces filtres"

### Vue Dashboard — modale détail

Modale large (~720px), header sticky + transcript scrollable.

**Header** :

- Titre de la conversation (ou `Sans titre`)
- Sous-titre : `Prénom Nom · email · badge profil`
- Ligne meta : `Créé le {date} · Mis à jour le {date} · {n} tour(s) · {n} 👍 · {n} 👎`
- Bouton fermer

**Transcript** :

- Liste verticale des messages user / assistant
- Markdown rendering via réutilisation de `AssistantMessageText`
- Pour chaque tour assistant ayant un `llm_call` associé :
  - Badge `evaluation` (👍 ou 👎 colorisé) en haut à droite du message
  - Si `commentaire` non vide : bloc citation sous le message, avec libellé "Commentaire de l'utilisateur"
- Si un message assistant n'a pas de `llm_call` correspondant : pas de badge.
- Pas de virtualisation : les conversations sont courtes par nature.

## Architecture

### Module serveur

Tout le code serveur vit dans `src/server/albert/`.

#### Domain

Nouveaux types :

```ts
type ConversationAdminResume = {
  id: string
  titre: string
  extraitPremierMessageUser: string
  utilisateur: { id: string, prenom: string, nom: string, email: string, profilNom: string }
  createdAt: Date
  updatedAt: Date
  aPouce: boolean       // au moins un llm_call.evaluation = POSITIVE
  aPouceBas: boolean    // au moins un llm_call.evaluation = NEGATIVE
  aCommentaire: boolean // au moins un llm_call.commentaire IS NOT NULL
}

type ConversationAdminDetail = {
  // identique à ConversationAdminResume +
  messages: PiloteUIMessage[]
  contexte: Record<string, unknown> | null
  llmCalls: Array<{
    id: string
    evaluation: 'POSITIVE' | 'NEGATIVE' | null
    commentaire: string | null
    createdAt: Date
  }>  // ordre createdAt asc
}
```

#### Repository

Nouveau `AdminAlbertRepository` (interface domaine) + `PrismaAdminAlbertRepository` (implémentation).

Méthodes :

- `listerConversations({ recherche, avecPouce, avecPouceBas, avecCommentaire, profilCodes, tri, page, taillePage })` → `{ total, items: ConversationAdminResume[] }`
  - Implémentation : Prisma raw SQL (requête PostgreSQL avec `EXISTS` pour les 3 booléens, JOIN sur `utilisateur` et `profil`, extraction du premier message user via SQL `messages->0`). Justification : agrégats par `chat_id` plus simples à exprimer en SQL qu'en plusieurs requêtes Prisma.
- `recupererConversation({ id })` → `ConversationAdminDetail | null` : deux requêtes (`chat_conversation` + utilisateur, puis `llm_calls` triés par `created_at asc`).

Le repo est ajouté au module Awilix (`src/server/albert/module.ts`).

#### Use cases

- `ListerConversationsAdminUseCase` : passe les filtres au repo, retourne le résultat tel quel.
- `RecupererConversationAdminUseCase` : passe l'id, retourne le détail ou lève `NotFoundError`.

Les use cases ne portent pas la logique de permission : c'est l'API qui garde.

### API tRPC

Nouveau router `albertAdmin` dans `src/server/infrastructure/api/trpc/routes/`, monté dans le router racine.

Procédures :

- `listerConversations` (query) : input zod (recherche, filtres, tri, page, taillePage), output `{ total, items }`
- `recupererConversation` (query) : input `{ id: uuid }`, output `ConversationAdminDetail | null`

Chaque procédure vérifie en première ligne `ctx.session.profil === ProfilEnum.DITP_ADMIN`, sinon `UnauthorizedError("Accès réservé aux administrateurs")` — pattern identique à `applicationLog.ts`.

### Frontend

Arborescence :

```
src/client/components/PagePanelAdministrateur/Albert/
  AlbertChat.tsx              (existant)
  AlbertDashboard.tsx         (NEW)
  AlbertDashboardTable.tsx    (NEW — tableau + lignes)
  AlbertDashboardFilters.tsx  (NEW — barre filtres)
  ConversationDetailModale.tsx (NEW)
  ConversationTranscript.tsx  (NEW — réutilise AssistantMessageText)
```

Page `pages/panel-administrateur/albert.tsx` :

- `getServerSideProps` : vérifie session **ET** `profil === DITP_ADMIN`, redirect home sinon
- Lit `?onglet=` et le passe en prop au composant racine `AlbertPanel`
- `AlbertPanel` : composant qui rend `NavigationTertiaire` + bascule `AlbertChat` / `AlbertDashboard`

État côté client :

- Filtres + pagination : `useState` local dans `AlbertDashboard` (pas de zustand : scope unique panel)
- Données : appels tRPC (déjà câblés dans le projet)
- Ouverture modale : `useState` (`conversationOuverte: { id } | null`)

## Sécurité

- **Backend** : chaque procédure tRPC `albertAdmin.*` vérifie le profil. Code 401 si pas DITP_ADMIN.
- **Frontend** :
  - `getServerSideProps` de `/panel-administrateur/albert` redirige les non-admins vers `/`
  - L'item "Albert" du menu latéral du panel admin doit être masqué aux non-admins. Vérifier si déjà fait ; sinon, intégré au plan d'implémentation.

## Tests

Côté backend : tests unitaires des use cases (Jest + Prisma test container ou mocks repo), tests d'intégration `PrismaAdminAlbertRepository` avec fixtures couvrant : conversation sans llm_call, avec 👍 seul, avec 👎 seul, avec commentaire seul, avec mix, plusieurs profils, recherche texte case-insensitive.

Côté API tRPC : test de garde profil (refuse non-admin, accepte admin).

Pas de tests front (préférence projet).

## Edge cases

- Conversation sans aucun `llm_call` : tous booléens à `false`, modale s'ouvre quand même et montre le transcript sans badges
- `llm_call` orphelin (conversation supprimée) : non listé (la liste vient de `chat_conversation`)
- Plus de messages assistant que de `llm_calls` : messages sans badge, pas d'erreur
- Recherche texte avec chaîne vide : pas de filtre appliqué
- Aucun résultat : tableau remplacé par état vide
- `titre` vide : affiche `Sans titre`
- Premier message user absent (cas théorique : conversation vide) : extrait vide

## Déploiement & livraison

- Pas de migration
- Pas de feature flag
- Pas de variable d'environnement
- Mise en prod immédiate, sécurisée par le check profil DITP_ADMIN
