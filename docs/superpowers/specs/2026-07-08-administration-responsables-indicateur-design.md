# Administration des responsables d'indicateur

Date : 2026-07-08

## Contexte

Les responsables d'indicateur existent déjà en base (`indicateur_responsable`,
clé composée `(indicateurId, utilisateurId)`, `createdAt`) et sont **lus** en
embarqué dans `GET /indicateurs` et `GET /indicateurs/:id`. Il n'existe aucun
endpoint d'écriture : impossible aujourd'hui d'ajouter ou retirer un responsable.

Objectif : permettre à un administrateur, depuis `kpilote-admin`, de gérer la
liste des responsables d'un indicateur (ajout / retrait), en réutilisant
l'écran d'édition d'indicateur existant.

## Décisions de cadrage

- **Assignation** : uniquement parmi les `Utilisateur` déjà en base. Pas de
  création à la volée (l'utilisateur se crée via l'écran utilisateurs existant).
- **Forme API** : on ajoute un champ `responsables` au **body du
  `PUT /indicateurs/:id` existant** (pas d'endpoint dédié). Une seule mutation,
  écriture **atomique** dans la transaction de l'upsert.
- **Sémantique du champ** : **optionnel, replace-all quand présent** (absent =
  « ne pas toucher », comme les champs de métadonnées). Choix additif et
  non-cassant pour les appelants existants du PUT qui n'envoient pas ce champ.
- **Identifiant** : les responsables sont désignés par **id utilisateur (UUID)**,
  clé primaire stable (l'email est mutable côté linking OIDC).
- **Read model** : on enrichit `responsableApiModel` avec l'`id` utilisateur pour
  permettre le pré-remplissage et le dirty check côté admin.
- **UX admin** : section « Responsables » intégrée au formulaire d'indicateur
  existant, visible en création **et** édition. Sauvegarde via le bouton
  Enregistrer existant, sans mutation supplémentaire (le champ part dans le body
  de l'upsert).
- **Picker (v0)** : `FieldSelect` natif peuplé avec **tous** les utilisateurs
  (toutes les pages agrégées). Un combobox cherchable remplacera ce v0 plus tard.

## Architecture

### A. API — `kpilote-api`

#### A1. Modèle de lecture partagé (`packages/kpilote-shared/src/responsable.ts`)

Ajouter `id` à `responsableApiModelSchema` :

```ts
export const responsableApiModelSchema = z.object({
  id: z.string().uuid().describe("Identifiant (UUID) de l'utilisateur responsable."),
  email: z.string().email(),
  nom: z.string(),
  prenom: z.string(),
  service: z.string(),
  fonction: z.string(),
})
```

Peupler `id` depuis `utilisateur.id` dans la sérialisation :
- `apps/kpilote-api/src/indicateur/utils.ts`
- `apps/kpilote-api/src/panier/utils.ts`

Changement **additif rétrocompatible** : s'applique aux réponses indicateur et
panier.

#### A2. Champ `responsables` dans le body d'upsert (`packages/kpilote-shared/src/indicateur.ts`)

Ajouter au `upsertIndicateurBodySchema` :

```ts
responsables: z
  .array(z.string().uuid())
  .optional()
  .describe(
    "UUIDs des utilisateurs responsables (replace-all). Champ optionnel : absent = inchangé.",
  ),
```

#### A3. Command `upsertIndicateur` (`apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts`)

Étendre la command existante pour gérer les responsables dans la **même
transaction** que le reste de l'upsert (chemins création **et** mise à jour).

- Autorisation inchangée : `ensurePrincipal(isApiKeyAdmin || isOidcUser)` +
  `assertWritePermission` (déjà en place pour l'update).
- Ne traiter les responsables que si `body.responsables !== undefined`
  (sémantique « absent = ne pas toucher »).
- Dédupliquer les `utilisateurIds`.
- Valider l'existence des utilisateurs
  (`db().utilisateur.findMany({ where: { id: { in } } })`) ; si des ids manquent →
  `ValidationError('Utilisateurs inconnus', { unknownUtilisateurIds })`.
- **Diff replace-all préservant l'ordre `createdAt`**, en miroir de
  `remplacerConfigurationsReferentiels` :
  - supprimer les liaisons dont l'`utilisateurId` n'est plus dans la cible ;
  - `upsert` les cibles (`update: {}` → conserve le `createdAt` des liaisons
    déjà présentes ; `create` pour les nouvelles).

Découper en helpers dédiés (`resoudreResponsables`,
`remplacerResponsables`) alignés sur le style des helpers référentiels du fichier.

#### A4. Route `PUT /indicateurs/{id}`

Aucune nouvelle route. Le handler existant renvoie déjà l'`IndicateurApiModel`
complet via `getIndicateurByPublicId`, qui embarque les responsables (désormais
avec `id`). Rien à changer dans `routes.ts` hormis, si nécessaire, la description
OpenAPI de la route pour mentionner le champ `responsables`.

#### A5. Tests (`kpilote-api`)

- `upsertIndicateur.test.ts` :
  - assigne des responsables à la création ;
  - remplace la liste en update (ajout + retrait) ;
  - `responsables` absent → liste inchangée ;
  - `responsables: []` → vide la liste ;
  - déduplique les ids en doublon ;
  - id utilisateur inconnu → `ValidationError` avec `unknownUtilisateurIds` ;
  - **préserve l'ordre `createdAt`** des responsables conservés après un replace.
- Mise à jour des tests de lecture (`getIndicateurByPublicId.test.ts`,
  `getPanierByPublicId.test.ts`) : asserter la présence de `id` dans les
  responsables.
- Fixtures `fixtures.indicateurResponsable` déjà disponibles.

### B. Admin — `kpilote-admin`

#### B1. Chargement de tous les utilisateurs (`apps/kpilote-admin/src/api/utilisateurs.ts`)

Helper `fetchAllUtilisateurs()` qui boucle sur les curseurs de `GET /utilisateurs`
et agrège toutes les pages. Exposé via un `queryOptions` (`['utilisateurs', 'all']`)
pour alimenter le select. Solution v0 assumée (volume modéré) ; remplacée par la
recherche serveur quand le combobox arrivera.

#### B2. Schéma de formulaire (`indicateurFormSchema.ts`)

- Ajouter `responsables: { id: string; nom: string; prenom: string; email: string }[]`
  (id pour la soumission, reste pour l'affichage).
- `buildInitialValues` : mapper `indicateur.responsables` (désormais avec `id`).
- `toUpsertBody` : ajouter `responsables: values.responsables.map(r => r.id)` au
  body envoyé au PUT.

#### B3. Section « Responsables » (`IndicateurForm.tsx`)

Visible en création et édition. Composée de :
- un `FieldSelect` listant les utilisateurs non encore sélectionnés
  (option choisie → ajoutée à la liste, retirée des choix restants, select reset) ;
- la liste des responsables sélectionnés sous forme de lignes/chips avec bouton
  retirer.

Petit composant local, sur primitives existantes (`FieldSelect`, `Button`,
`Table`/chips). Pas de nouvelle abstraction framework.

#### B4. Soumission (`routes/_authed/indicateurs/$id.tsx` et `nouveau.tsx`)

**Aucun changement de flux** : le champ `responsables` part dans le body de
`upsertIndicateur` existant. Une seule mutation, écriture atomique côté serveur,
invalidation `['indicateur', id]` + `['indicateurs']` déjà en place.

## Non-objectifs

- Pas de gestion des responsables de **panier** en écriture (hors périmètre ;
  seul le read model panier est enrichi de l'`id` par cohérence).
- Pas de création d'utilisateur à la volée depuis l'écran indicateur.
- Pas de combobox cherchable (v0 = `FieldSelect` + chargement complet).
- Pas de « type » de responsable (le modèle reste homogène).

## Fichiers impactés

**API**
- `packages/kpilote-shared/src/responsable.ts` (ajout `id`)
- `packages/kpilote-shared/src/indicateur.ts` (champ `responsables` dans le body)
- `apps/kpilote-api/src/indicateur/utils.ts` (sérialisation `id`)
- `apps/kpilote-api/src/panier/utils.ts` (sérialisation `id`)
- `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts` (gestion responsables)
- `apps/kpilote-api/src/indicateur/routes.ts` (description OpenAPI éventuelle)
- tests associés

**Admin**
- `apps/kpilote-admin/src/api/utilisateurs.ts` (fetch all)
- `apps/kpilote-admin/src/queries/utilisateurs.ts` (query options all)
- `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts`
- `apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx`
