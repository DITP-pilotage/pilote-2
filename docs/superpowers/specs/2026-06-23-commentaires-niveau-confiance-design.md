# Commentaires & Niveau de confiance — Conception (mb-api)

> Périmètre : tickets **PIL-1581 → PIL-1593** (commentaires + niveau de confiance sur indicateurs et paniers).
> Cible : `apps/mb-api` (Hono + Prisma + Zod, CQRS léger). Aucun de ces concepts n'existe aujourd'hui dans mb-api.

## 1. Contexte & motivation

Sur le legacy `pilote-ppg`, chaque nature de commentaire avait sa propre table (`commentaire` typé par maille, `synthese_des_resultats` avec une colonne `meteo`), ce qui rendait l'affectation de l'indice de confiance et l'ajout de nouveaux types douloureux et rigides.

On repart d'une conception **générique** : un **socle `Commentaire`** unique (contenu, statut, auteur, dates) sur lequel viennent se greffer des **satellites** qui portent le rattachement à un sujet et la catégorie. Le niveau de confiance devient un satellite parmi d'autres — fin de la rigidité « une table par nature ».

## 2. Décisions structurantes

1. **Socle + satellites.** Un seul `Commentaire` porte les champs communs. Chaque sujet commentable a sa propre table satellite (FK → `Commentaire`, FK → sujet) **avec son propre enum `type`** (anti-fourre-tout : pas de table générique mélangeant catégorie + type).
2. **3 secteurs dans ce lot** : `IndicateurIndividuCommentaire`, `PanierIndividuCommentaire`, `PanierCommentaire` (global, sans individu). Indicateur et panier-par-individu portent une dimension `individuId` ; le panier global non.
3. **Le niveau de confiance n'est pas une table dédiée à part.** Un `NiveauConfiance` est accroché à **un commentaire** en **1:n** : un commentaire de type `CONFIANCE` porte un ou plusieurs indices ordonnés par date (historique d'indices, et autres usages à venir). L'indice « courant » d'un commentaire = le dernier (`createdAt` max) ; l'indice de confiance « courant » d'un scope = l'indice courant du dernier commentaire `CONFIANCE` **publié** du scope.
4. **Statut BROUILLON / PUBLIE** sur le socle, piloté par le `PUT`. Max **1 brouillon par (scope, auteur)**.
5. **`individuId` dans le path** (et non le body) : routes imbriquées `…/individus/{individuId}/commentaires`. Cohérent avec mb-api où `individus` est déjà une sous-ressource d'un sujet (`/indicateurs/{id}/individus`, `/referentiels/{id}/individus`). Profondeur 3 niveaux assumée (≤3, conforme aux guidelines REST type Zalando/Microsoft).
6. **Espace d'`id` unifié sur le socle** : `PUT /commentaires/{id}` et `DELETE /commentaires/{id}` opèrent sur le socle, quel que soit le satellite (un resolver retrouve le sujet pour le contrôle de permission).
7. **Contenu** = richtext (HTML) + un champ **`contenuTexte`** dérivé (plain text) pour le futur LLM et la recherche. `contenu` peut être la **chaîne vide `""`** (jamais `null`) à la création.

## 3. Modèle de données

### Socle

```
Commentaire
  id            uuid (PK, app-generated)
  contenu       text          -- richtext/HTML, "" autorisé
  contenuTexte  text          -- plain text dérivé (LLM/recherche)
  statut        CommentaireStatut  -- BROUILLON | PUBLIE
  createdBy     uuid (FK → Principal)
  updatedBy     uuid (FK → Principal)
  createdAt     timestamptz
  updatedAt     timestamptz
```

### Satellites (FK → Commentaire en PK, cascade ; FK → sujet)

```
IndicateurIndividuCommentaire
  commentaireId  uuid (PK, FK → Commentaire, onDelete Cascade)
  indicateurId   uuid (FK → Indicateur, onDelete Cascade)
  individuId     uuid (FK → Individu,    onDelete Restrict)
  type           IndicateurIndividuCommentaireType
  @@index([indicateurId, individuId])

PanierIndividuCommentaire
  commentaireId  uuid (PK, FK → Commentaire, onDelete Cascade)
  panierId       uuid (FK → Panier,   onDelete Cascade)
  individuId     uuid (FK → Individu, onDelete Restrict)
  type           PanierIndividuCommentaireType
  @@index([panierId, individuId])

PanierCommentaire                       -- global, pas d'individu
  commentaireId  uuid (PK, FK → Commentaire, onDelete Cascade)
  panierId       uuid (FK → Panier, onDelete Cascade)
  type           PanierCommentaireType
  @@index([panierId])
```

### Niveau de confiance (satellite 1:n sur le commentaire)

```
NiveauConfiance
  id             uuid (PK, app-generated)
  commentaireId  uuid (FK → Commentaire, onDelete Cascade)   -- non unique : 1:n
  indice         IndiceConfiance
  createdAt      timestamptz
  updatedAt      timestamptz
  @@index([commentaireId])
```

Plusieurs `NiveauConfiance` peuvent pointer le même commentaire (historique d'indices, ordonnés par `createdAt`). Le scope (sujet + éventuel individu) est **hérité** du satellite du commentaire — il n'est pas redupliqué.

### Enums

```
CommentaireStatut = BROUILLON | PUBLIE

IndiceConfiance =
  OBJECTIF_COMPROMIS | APPUIS_NECESSAIRE | OBJECTIF_ATTEIGNABLE | OBJECTIF_SECURISE

IndicateurIndividuCommentaireType = DEFAUT | CONFIANCE
PanierIndividuCommentaireType     = DEFAUT | CONFIANCE
PanierCommentaireType             = DEFAUT | CONFIANCE | OBJECTIF
```

> **`type` = catégorie du commentaire.** `DEFAUT` = commentaire libre ; `CONFIANCE` = commentaire porteur d'indices de confiance (`NiveauConfiance`) ; `OBJECTIF` (panier) = commentaire d'objectif. Chaque secteur a son propre enum.

## 4. Règles métier

- **Commentaire libre** = type `DEFAUT` (sans `NiveauConfiance`). **Commentaire de confiance** = type `CONFIANCE` (porte un ou plusieurs `NiveauConfiance`). Les deux sections de l'onglet (PIL-1581/1588) se déduisent du `type`.
- **Courant** d'un scope = indice courant (dernier `NiveauConfiance` par `createdAt`) du dernier commentaire `CONFIANCE` **PUBLIE** du scope (pour le picto d'onglet). **Historique des indices** = les indices des commentaires `CONFIANCE`, antichronologique.
- **Édition d'un niveau de confiance** : seul le **dernier publié** du scope est éditable, **par son auteur** (PIL-1583/1590). Modifie indice + contenu.
- **Édition commentaire libre** : **tout** commentaire publié reste éditable **par son auteur** (PIL-1586/1593).
- **Max 1 brouillon par (scope, auteur)** (PIL-1585/1592). Appliqué **en logique applicative dans la transaction** de création (le contrôle porte sur des colonnes réparties socle + satellite, non exprimable en index unique partiel mono-table). À documenter comme invariant testé.
- **Contenu vide** autorisé à la création ; un check « contenu non vide à la publication » est une **règle à confirmer avec le PO** (non bloquante).
- **Permissions** : lecture = `READ` sur le sujet ; écriture (création/édition) = `WRITE` sur le sujet (mapping du « droit de saisie de commentaire » des tickets, à raffiner si un droit dédié émerge). Édition réservée à l'auteur (`createdBy === principal courant`).

## 5. API

Pluriel partout, `individuId` dans le path. `{sujet}` = `indicateurs` | `paniers`.

### Mutations transverses (socle, secteur « socle »)

| Méthode | Route | Body | Notes |
|---|---|---|---|
| `PUT` | `/commentaires/{commentaireId}` | `{ contenu?, statut? }` | Met à jour le socle. Auteur only. Resolver sujet → permission `WRITE`. |
| `DELETE` | `/commentaires/{commentaireId}` | — | Auteur only. |

### Par secteur (mêmes formes, scope différent)

**Commentaires libres**

| Méthode | Route |
|---|---|
| `POST` | `/{sujet}/{id}[/individus/{individuId}]/commentaires` — body `{ type, contenu }` |
| `GET` | `/{sujet}/{id}[/individus/{individuId}]/commentaires?type=…` — exclut les commentaires de confiance (type `CONFIANCE`), antichrono, paginé |

**Niveau de confiance**

| Méthode | Route |
|---|---|
| `POST` | `/{sujet}/{id}[/individus/{individuId}]/niveau-confiance` — body `{ indice, contenu? }` → crée `Commentaire` + `NiveauConfiance` |
| `PUT` | `/{sujet}/{id}[/individus/{individuId}]/niveau-confiance/{commentaireId}` — body `{ indice?, contenu?, statut? }` (dernière publiée + auteur) |
| `GET` | `/{sujet}/{id}[/individus/{individuId}]/niveau-confiance` — courante |
| `GET` | `/{sujet}/{id}[/individus/{individuId}]/niveau-confiance/historique` — antichrono |

Concrètement, les 3 secteurs déclinent :
- **IndicateurIndividu** : `/indicateurs/{id}/individus/{individuId}/…`
- **PanierIndividu** : `/paniers/{id}/individus/{individuId}/…`
- **Panier (global)** : `/paniers/{id}/…`

## 6. Découpage pour parallélisation (3 secteurs + socle)

Objectif : 3 développeurs (3 Claudes) avancent **en parallèle** sur les 3 secteurs, après une **fondation** mergée d'abord. Layout pensé pour des fichiers **disjoints** (zéro conflit de merge).

```
apps/mb-api/src/commentaire/
  socle/                         ← FONDATION (PR n°1, ce lot)
    routes.ts                    PUT/DELETE /commentaires/{id}
    commands/updateCommentaire.ts, deleteCommentaire.ts
    resolveCommentaireSujet.ts   commentaire → sujet + contrôle permission
    utils.ts                     toCommentaireApiModel
  indicateurIndividu/            ← SECTEUR 1
    routes.ts | commands/ | queries/
  panierIndividu/                ← SECTEUR 2
    routes.ts | commands/ | queries/
  panier/                        ← SECTEUR 3
    routes.ts | commands/ | queries/

packages/mb-shared/src/
  commentaire.ts                 ← FONDATION : socle (commentaireApiModel, statut, indiceConfiance, niveauConfiance)
  commentaireIndicateurIndividu.ts  ← SECTEUR 1
  commentairePanierIndividu.ts      ← SECTEUR 2
  commentairePanier.ts              ← SECTEUR 3
```

**Fondation (PR n°1 — ce qu'on ouvre maintenant)** :
- Schéma Prisma : socle `Commentaire`, les **3 satellites**, `NiveauConfiance`, tous les enums (+ back-relations sur `Principal` et sur les sujets).
- Migration correspondante (enums `type` réels : `DEFAUT` / `CONFIANCE` / `OBJECTIF`).
- Schémas Zod socle dans `mb-shared/src/commentaire.ts`.
- Mutation transverse socle (`PUT`/`DELETE /commentaires/{id}`) + `resolveCommentaireSujet`.
- Pré-câblage du montage des 4 routers dans `app.ts` (les routers secteurs sont des modules vides à remplir → `app.ts` n'est plus touché par les secteurs).

**Secteurs (en // après merge de la fondation)** — chaque secteur, sur ses fichiers propres :
1. `POST` + `GET` commentaires libres.
2. `POST`/`PUT`/`GET courant`/`GET historique` niveau de confiance.
3. Schémas Zod du secteur + commands/queries + permissions (réutilise `with{Indicateur,Panier}WritePermission`).

Points de contact partagés réduits au strict minimum : `app.ts` (pré-câblé en fondation), `schema.prisma` (entièrement en fondation). Les `routes.ts` existants des domaines `indicateur`/`panier` **ne sont pas** modifiés (les commentaires vivent dans le domaine `commentaire/`).

## 7. Hors périmètre (volontairement non modélisé)

Mentions, pièces jointes, notifications, réponses/threads imbriqués, agrégation automatique du niveau de confiance (le niveau de confiance panier est une saisie manuelle, **sans** agrégation des niveaux de confiance des indicateurs). Pagination « Voir plus » = offset/limit applicatif, pas de structure dédiée.

## 8. Questions ouvertes (PO)

1. Check « contenu non vide à la publication » : oui/non ?
2. Un « droit de saisie de commentaire » dédié, ou mapping sur la permission `WRITE` du sujet ?
