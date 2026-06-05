# Module de feedback utilisateur Albert (LLM) — Design

Date : 2026-06-05
Ticket : PIL-1549
Statut : Validé

## Contexte

Le module de feedback de l'assistant Albert recueille aujourd'hui une évaluation
binaire sur la dernière réponse :

- bouton « Oui » → enregistre immédiatement `POSITIVE`, sans information complémentaire ;
- bouton « Non » → ouvre une modale avec un unique textarea **obligatoire**
  (« Qu'est-ce qui n'allait pas ? »), puis enregistre `NEGATIVE` + `commentaire`.

Ces retours sont stockés sur la dernière ligne `llm_calls` du chat et exploités dans
le panel admin (liste + détail de conversation).

L'objectif est d'enrichir ces retours pour mieux qualifier les problèmes rencontrés
et recueillir aussi du feedback positif qualitatif.

## Objectifs

1. **Feedback positif** : nouvelle modale `FeedbackPositiveModale` avec un commentaire
   optionnel (« Qu'avez-vous particulièrement apprécié ? »).
2. **Feedback négatif** : refonte de `FeedbackNegatifModale` avec des catégories de
   problème multi-sélectionnables + un commentaire optionnel.
3. **Vue admin** : afficher les nouvelles données (catégories, commentaire positif)
   et permettre de filtrer la liste par catégorie de problème.

## 1. Modèle de données (`llm_calls`)

- Nouvel enum Prisma `llm_call_categorie_probleme` :
  `PROBLEME_TECHNIQUE`, `INCOMPREHENSION`, `SUGGESTION`, `AUTRE`.
- Nouvelle colonne `categories_probleme llm_call_categorie_probleme[]` sur `llm_calls`
  (array, défaut `[]`).
- `commentaire String?` (existant) : réutilisé pour le commentaire **positif comme
  négatif**.
- `evaluation` : inchangé (`POSITIVE` / `NEGATIVE`).
- Migration SQL Prisma associée (création de l'enum + ajout de la colonne).

## 2. Backend

### Mutation tRPC `albert.evaluer`

On conserve la `discriminatedUnion("evaluation")` existante, en la faisant évoluer :

- branche `POSITIVE` :
  - `chatId: z.string().min(1)`
  - `commentaire: z.string().optional()`
- branche `NEGATIVE` :
  - `chatId: z.string().min(1)`
  - `categories: z.array(z.nativeEnum(llm_call_categorie_probleme)).min(1)`
  - `commentaire: z.string().optional()`
  - `.refine` : si `categories` contient `AUTRE`, alors `commentaire` doit être non vide.

Alternative écartée : scinder en deux mutations `evaluerPositif` / `evaluerNegatif`
(plus verbeux, casse l'API existante sans gain).

### `EvaluerChatUseCase`

- Nouveau paramètre `categories?: llm_call_categorie_probleme[]` écrit dans
  `categories_probleme`.
- `commentaire` toujours géré (positif et négatif).
- Logique inchangée : update de la dernière ligne `llm_calls` du chat (par
  `created_at desc`).

### Flux d'enregistrement

- **Positif** : un **seul** appel `evaluer({ POSITIVE, commentaire? })` au clic sur
  « Envoyer » de la modale. Annuler / fermer la modale → rien n'est enregistré.
  (Compromis accepté : un clic « Oui » suivi d'une annulation n'enregistre aucun
  feedback ; ajustable ultérieurement si besoin.)
- **Négatif** : un seul appel `evaluer({ NEGATIVE, categories, commentaire? })` au clic
  sur « Envoyer ».

## 3. Frontend utilisateur (`src/client/components/_commons/ChatUI/`)

### `FeedbackBar.tsx`

- Bouton « Oui » → ouvre `FeedbackPositiveModale` (aucun envoi à l'ouverture).
- Bouton « Non » → ouvre `FeedbackNegatifModale`.
- État `evaluationSoumise` → affiche « Merci pour votre retour ! » après envoi
  (inchangé).

### `FeedbackPositiveModale.tsx` (nouveau)

- Titre « Merci pour votre retour ! ».
- Sous-titre « Dites-nous ce qui vous a plu (optionnel) ».
- Textarea optionnel « Qu'avez-vous particulièrement apprécié ? (optionnel) »,
  placeholder « Partagez ce qui vous a aidé… ».
- Boutons Annuler / Envoyer → `evaluer({ POSITIVE, commentaire? })` puis ferme et
  remonte `onSuccess`.

### `FeedbackNegatifModale.tsx` (refonte)

- Titre « Aidez-nous à nous améliorer ».
- Sous-titre « Dites-nous ce qui n'a pas fonctionné ».
- Section « Quel(s) type(s) de problème avez-vous rencontré ? (vous pouvez en
  sélectionner plusieurs) » : grille de 4 cartes multi-sélectionnables :
  - Problème technique — « Erreur ou bug »
  - Incompréhension — « Réponse pas claire »
  - Suggestion — « Idée d'amélioration »
  - Autre — « Autre problème »
- Textarea optionnel « Décrivez le problème (optionnel) », placeholder « Décrivez ce
  qui n'a pas fonctionné… ».
- Bouton « Envoyer » désactivé tant que :
  - aucune catégorie n'est sélectionnée, **ou**
  - « Autre » est sélectionnée sans commentaire non vide.
- Envoi `evaluer({ NEGATIVE, categories, commentaire? })`.

### `FeedbackCategorieCard.tsx` (nouveau, extrait)

Petite carte réutilisable (icône + titre + sous-titre + état sélectionné/non) pour
garder `FeedbackNegatifModale` lisible. Icônes : réutilisation des composants d'icônes
DSFR existants du projet (bug, question, ampoule, chat — à confirmer parmi les
`Icones/` disponibles).

## 4. Vue admin (`src/client/components/PagePanelAdministrateur/Albert/`)

### Backend

- `RecupererConversationAdminQuery` : ajouter `categories_probleme` au `SELECT` et au
  type `llmCalls[]` retourné.
- `ListerConversationsAdminQuery` : nouveau paramètre
  `categories?: llm_call_categorie_probleme[]`. En SQL, une conversation matche si au
  moins une de ses lignes `llm_calls` contient une des catégories demandées (opérateur
  d'overlap `&&` sur l'array).
- Route tRPC `listerToutes` : ajout de
  `categories: z.array(z.nativeEnum(llm_call_categorie_probleme)).optional()`.

### Frontend

- `ConversationTranscript` : sous le commentaire, afficher les catégories de problème
  sous forme de badges (libellés FR) quand présentes.
- `AlbertDashboardFilters` : nouveau filtre multi-select « Catégories » (même UI
  `<details>` que les profils), branché sur `FiltresDashboard.categories`.
- `ConversationDetailModale` : pas de changement structurel (le transcript gère
  l'affichage).

## Hors périmètre

- Pas de statistiques agrégées par catégorie (uniquement affichage + filtres).
- Pas de modification du flux de génération des réponses Albert.
