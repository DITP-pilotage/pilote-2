# Centre d'aide — consolidation des endpoints de mutation d'un article

**Date :** 2026-07-24
**Contexte :** retours de revue sur la PR #2296. Les commentaires (jordantaillefer) sur
`apps/kpilote-admin/src/api/centreAide.ts` pointent une surface d'API trop granulaire :
un même article expose 7 endpoints de mutation (publier, dépublier, visibilité, déplacer,
déplacer-vers, statut, brouillon), chacun pour un seul axe d'état.

## Objectif

Ramener la surface de mutation d'un article de **7 endpoints à 1 seul `PUT` idempotent**
(+ `DELETE` inchangé), qui reçoit l'état éditable complet de l'article et l'écrase.

## Modèle : les 5 axes d'état d'un article

| Axe | Champs | Endpoint avant |
|---|---|---|
| Contenu brouillon | `titreBrouillon`, `titreAfficheBrouillon`, `contenuBrouillon` | `PUT /{id}` (partiel) |
| Contenu publié | `titre`, `titreAffiche`, `contenu` (+ `contenuTexte` dérivé) | `POST /{id}/publier`, `/depublier` |
| Position | `parentId`, `ordre` | `POST /{id}/deplacer`, `/deplacer-vers` |
| Visibilité | `estMasque` | `POST /{id}/visibilite` |
| Cycle de vie | `statut` (`ACTIF`/`CORBEILLE`) | `PATCH /{id}/statut` |

`type` (GROUPE/PAGE), `id`, `createdAt` sont immuables. `updatedAt`/`updatedBy` sont posés serveur.

## Décision : PUT déclaratif, client propriétaire de l'instantané publié

Le `PUT` reçoit **tout l'état éditable, y compris les champs publiés**. Le serveur ne calcule
que `contenuTexte` (dérivé de `contenu` publié, source unique pour la recherche).

- **Sauvegarder le brouillon** : la webapp renvoie les champs publiés inchangés → la version en
  ligne n'est pas touchée. La séparation brouillon/publié est préservée.
- **Publier** : la webapp recopie son brouillon dans `titre`/`titreAffiche`/`contenu` et met
  `estPublie: true`. L'instantané vit côté client.
- **Dépublier / masquer / corbeille / restaurer** : un `PUT` avec le flag concerné modifié.

Alternative écartée (serveur réconcilie sur transition `estPublie`) : elle re-publie le brouillon
à chaque sauvegarde d'un article déjà en ligne, ce qui casse la séparation brouillon/publié.
Acteur = clé API `ADMIN` (de confiance), donc laisser le client posséder l'instantané est sans risque.

## API cible

### `PUT /centre-aide/articles/{id}` — remplace l'état éditable complet

Body (`modifierArticleBodySchema`, tous les champs requis) :

```
{
  titreBrouillon, titreAfficheBrouillon, contenuBrouillon,   // brouillon
  titre, titreAffiche, contenu,                              // publié
  parentId: string.uuid | null, ordre: int >= 0,            // position
  estMasque: boolean, estPublie: boolean,                    // flags
  statut: 'ACTIF' | 'CORBEILLE'                              // cycle de vie
}
```

Handler (`modifierArticleCentreAide`) :
1. `ensurePrincipal(isApiKeyAdmin)`.
2. Valider `parentId` : doit exister et être un `GROUPE` (racine si `null`) ; interdire le cycle
   (déplacement sous soi-même ou un descendant). Logique reprise de `deplacerArticleVers`.
3. Écrire pour `id` : brouillon, publié, `contenuTexte = htmlToPlainText(contenu)`, `parentId`,
   `estMasque`, `estPublie`, `statut`, `updatedBy`.
4. Réindexer les frères du parent cible pour placer l'article à `ordre` et garder un ordre
   contigu (0..n), comme `deplacerArticleVers`.

Idempotent : un `PUT` avec les valeurs courantes (sauvegarde brouillon sans déplacement) laisse
la position inchangée.

### `DELETE /centre-aide/articles/{id}` — inchangé

Suppression définitive ; exige `statut = CORBEILLE` (sinon 409).

### Inchangés

`GET /centre-aide/public`, `GET /centre-aide/articles`, `GET /centre-aide/articles/{id}`,
`GET /centre-aide/articles/corbeille`, `POST /centre-aide/articles` (création).

## Changements de code

**`packages/kpilote-shared/src/centreAide.ts`**
- Ajouter `modifierArticleBodySchema` + type.
- Ajouter un mapper pur `articleVersModification(article)` : `ArticleCentreAideApiModel` →
  `ModifierArticleBody` (base pour construire un payload complet côté client, on surcharge le
  champ modifié).
- Supprimer : `basculerVisibiliteArticleBodySchema`, `deplacerArticleBodySchema`,
  `deplacerArticleVersBodySchema`, `modifierBrouillonArticleBodySchema`,
  `modifierStatutArticleBodySchema`, `directionDeplacementSchema` (+ types). Garder
  `articleCentreAideStatutSchema` (utilisé par le modèle et le body).

**`apps/kpilote-api/src/centreAide/`**
- Nouveau `commands/modifierArticle.ts`.
- Supprimer `commands/` : `publierArticle`, `depublierArticle`, `basculerVisibiliteArticle`,
  `deplacerArticle`, `deplacerArticleVers`, `modifierStatutArticle`, `modifierBrouillonArticle`.
- `routes.ts` : remplacer les 7 routes de mutation + l'ancien `PUT` partiel par un seul
  `PUT /{id}` (full body). Garder GET/POST création/DELETE.

**`apps/kpilote-admin/src/api/centreAide.ts`**
- Remplacer les 7 fonctions par une seule `modifierArticleCentreAide(id, body: ModifierArticleBody)`
  → `PUT`. Garder `fetch`, `creer`, `fetchCorbeille`, `supprimer`.

**`apps/kpilote-admin/src/routes/_authed/centre-aide/index.tsx`**
- Chaque mutation (corbeille, visibilité, déplacement, enregistrer, publier, restaurer) construit
  un payload complet via `articleVersModification(article)` puis surcharge le(s) champ(s) modifié(s) :
  - corbeille : `{ ...base, statut: 'CORBEILLE' }` ; restaurer : `statut: 'ACTIF'`.
  - visibilité : `{ ...base, estMasque: !article.estMasque }`.
  - déplacement : `{ ...base, parentId, ordre: index }`.
  - enregistrer : `{ ...base, titreBrouillon, titreAfficheBrouillon, contenuBrouillon }`.
  - publier : idem + `titre`/`titreAffiche`/`contenu` recopiés du brouillon + `estPublie: true`.

## Tests

API : ajouter un test sur `modifierArticleCentreAide` couvrant publier (dérivation
`contenuTexte`), déplacement (réindexation + refus parent non-GROUPE + refus cycle), corbeille.
Pas de plan de tests front (préférence projet).

## Hors périmètre

Les autres commentaires Copilot de la PR (iframe vidéo, accessibilité nav, `style` sanitize,
ancêtres masqués, sélection groupe dans le lecteur) — traités séparément.
