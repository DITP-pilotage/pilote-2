# Responsables d'indicateur — design

**Date :** 2026-07-07
**Branche :** `mb-responsables-indicateur`
**Statut :** validé, prêt pour plan d'implémentation

## Contexte

Les paniers portent aujourd'hui une notion de **responsables** : une liste
d'utilisateurs désignés, purement informative (gouvernance / contact), sans
aucun rôle dans le contrôle d'accès. Elle est exposée en lecture seule via une
route dédiée `GET /paniers/{id}/responsables` et affichée dans l'onglet
« Gouvernance » de la page panier. L'assignation se fait uniquement via le seed
et les fixtures (pas d'écriture par API/UI).

On veut la **même notion sur les indicateurs**. En analysant le besoin, on a
décidé de ne pas recopier la route séparée : pour l'indicateur les responsables
seront affichés dans l'onglet **Métadonnées**, qui consomme déjà l'objet
`indicateur` renvoyé par le GET détail. Une route séparée imposerait un
aller-retour réseau et une pile query/fetch superflus. On **embarque** donc les
responsables dans le GET détail, et on **uniformise le panier** de la même
manière (suppression de sa route séparée).

Ce design couvre donc deux choses :
1. l'ajout des responsables aux indicateurs (modèle + lecture + UI) ;
2. le refactoring du panier pour embarquer ses responsables dans le GET détail
   et supprimer la route dédiée.

Périmètre : **lecture seule**, comme l'existant panier. Aucune route/UI
d'écriture (assignation via seed/fixtures). Les **contacts utiles** du panier
restent hors scope (route séparée conservée).

## Principes de conception

- **Embarquer plutôt qu'exposer une route par sous-ressource** quand la donnée
  est petite, bornée et consommée par un onglet qui charge déjà l'entité. Le
  GET détail panier embarque déjà `indicateurIds` selon ce principe ; les
  responsables suivent le même pattern.
- **Factoriser le doublon exact** entre panier et indicateur (schéma partagé,
  composant de liste), le doublon des champs étant strict.
- **Les responsables n'accordent aucune permission.** Le contrôle d'accès reste
  `visibilite` + `*Permission` (READ/WRITE) ; pour l'indicateur la lecture est
  aussi propagée via un panier qui le contient (`withIndicateurReadPermission`).

## Modèle de données (mb-api / Prisma)

Nouvelle table miroir de `PanierResponsable` :

```prisma
model IndicateurResponsable {
  indicateurId  String   @map("indicateur_id") @db.Uuid
  utilisateurId String   @map("utilisateur_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId], references: [id], onDelete: Cascade)
  utilisateur Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)

  @@id([indicateurId, utilisateurId])
  @@index([indicateurId, createdAt])
  @@map("indicateur_responsable")
}
```

Relations ajoutées :
- `Indicateur.responsables IndicateurResponsable[]`
- `Utilisateur.responsabilitesIndicateur IndicateurResponsable[]`
  (l'existante `responsabilites` reste dédiée aux paniers)

Migration `add_indicateur_responsable`. Seed : bloc miroir de celui de PAN-005
(désigner des responsables sur un indicateur existant).

## mb-shared

- **Nouveau** `packages/mb-shared/src/responsable.ts` :

  ```ts
  export const responsableApiModelSchema = z.object({
    email:    z.string().email(),
    nom:      z.string(),
    prenom:   z.string(),
    service:  z.string(),
    fonction: z.string(),
  })
  export type ResponsableApiModel = z.infer<typeof responsableApiModelSchema>
  ```

- `panier.ts` : ajouter `responsables: z.array(responsableApiModelSchema)` à
  `panierApiModelSchema` (triés `createdAt ASC`).
- `indicateur.ts` : ajouter le même champ à `indicateurApiModelSchema`.
- **Supprimer** `panierResponsable.ts` ; migrer les imports restants vers
  `responsable.ts` / les modèles d'entité.

## mb-api

- `getPanierByPublicId` : ajouter à l'`include`
  `responsables: { orderBy: { createdAt: 'asc' }, include: { utilisateur: true } }` ;
  `toPanierApiModel` projette les cinq champs du responsable.
- `getIndicateurByPublicId` : idem (même include, `toIndicateurApiModel`
  projette les responsables).
- **Supprimer** :
  - la route `GET /paniers/{id}/responsables` (`src/panier/routes.ts`),
  - la query `getPanierResponsables.ts` et son test.
- Les cas de test utiles de `getPanierResponsables.test.ts` (liste vide, champs
  complets, tri `createdAt ASC`, accès PRIVE via permission READ, erreur sans
  permission) migrent dans les tests de `getPanierByPublicId`.
- Côté indicateur, ajouter les cas équivalents aux tests de
  `getIndicateurByPublicId`, **dont l'accès via un panier** qui contient
  l'indicateur (spécificité `withIndicateurReadPermission`).

## mb-webapp

- **Supprimer** `fetchPanierResponsables`, `panierResponsablesQueryOptions` et
  son prefetch dans la route panier `$id.tsx`.
- `PanierGouvernanceTab` : reçoit `responsables` en prop (depuis l'objet
  `panier` déjà chargé par `panierQueryOptions`) au lieu de son propre
  `useSuspenseQuery` ; conserve `panierId` pour `PanierContactsUtiles`.
- Indicateur : les responsables arrivent dans l'objet `indicateur` ; affichés
  dans l'onglet **Métadonnées** (route indicateur `$id.tsx`), sous
  `<IndicateurMetadonnees>`. `IndicateurMetadonnees` reste présentationnel pur —
  la liste des responsables est rendue par un composant dédié dans le
  `TabsContent value="metadonnees"`.
- **Composant partagé** `components/ui/ResponsablesList.tsx` : avatar initiales,
  nom complet (fallback email), `fonction · service`, lien `mailto:`,
  `EmptyState` si vide. Extrait du markup actuel de `PanierGouvernanceTab` et
  réutilisé par le panier et l'indicateur.

## Hors scope

- **Écriture** des responsables (assignation/retrait par API ou UI) : reste
  seed/fixtures uniquement, comme aujourd'hui pour le panier.
- **Contacts utiles** du panier : route séparée `/paniers/{id}/contacts-utiles`
  conservée telle quelle (donnée potentiellement volumineuse, groupée par
  organisme).

## Trade-off assumé

Le join `responsables` s'exécute à chaque lecture de détail panier/indicateur,
même si l'onglet correspondant n'est pas ouvert. Coût négligeable (poignée de
lignes jointes), cohérent avec `indicateurIds` déjà embarqué dans le détail
panier. Si un besoin de rechargement/édition indépendant des responsables
apparaît, une route dédiée pourra être réintroduite à ce moment-là.
