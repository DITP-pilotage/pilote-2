# CRUD des collections dans le panel admin

## Contexte

La table `collection` et ses jonctions (`collection_indicateur`, `collection_responsable`,
`collection_permission`, `collection_contact_utile`) sont lues par la webapp — liste des
collections, fiche détaillée, taux de progression agrégé — mais aucun endpoint ne permet de
les écrire. `GET /collections` et `GET /collections/{id}` sont les seules routes existantes.
Les collections présentes en base viennent des migrations `panier → collection` du 22
juillet 2026.

L'objectif est d'ouvrir cette écriture : un écran d'administration listant les collections,
permettant d'en créer, d'en modifier, d'en supprimer, et surtout d'accéder à une fiche
unitaire où l'on affecte les indicateurs et les utilisateurs, sur le modèle des onglets de
`/utilisateurs/$id`.

## Décisions structurantes

### Identifiant public généré par l'API

Le format `COL-NNN` est conservé, mais l'identifiant n'est plus saisi par l'administrateur.
Deux chemins d'écriture cohabitent, sans recouvrement :

- `POST /collections` — body **sans** identifiant, l'API génère `COL-NNN`. C'est le chemin
  de l'IHM.
- `PUT /collections/{id}` — upsert replace-all, calqué sur `PUT /indicateurs/{id}`. C'est le
  chemin « j'impose l'identifiant » : appel API direct, future synchronisation des
  collections depuis ppg. L'écran d'édition l'utilise également, la collection existant
  déjà.

C'est un alignement anticipé sur [PIL-1688](https://data-ditp.atlassian.net/browse/PIL-1688)
(« Mise en place des foreign_ids »), qui prévoit un identifiant slugifié depuis le titre,
« proposé à la création par API » — couvert par le `PUT` — mais « généré automatiquement via
l'IHM » — couvert par le `POST`. Passer au slug dès maintenant supposerait de changer
`collectionPublicIdSchema` (`/^COL-\d+$/`), donc de migrer les identifiants existants et
d'impacter la webapp, les widgets et la synchronisation ppg : c'est le périmètre du ticket
lui-même. Faire générer l'identifiant par l'API coûte une commande et supprime déjà le champ
de l'IHM ; quand PIL-1688 passera, seule la stratégie de génération changera, ni la forme des
routes ni l'écran.

La seule divergence restante avec l'indicateur est donc l'existence du `POST` : le
formulaire de création d'indicateur impose encore un champ `IND-NNN` saisi à la main.

### Pondération éditable

`collection_indicateur.ponderation` (`DECIMAL(20,2) DEFAULT 1`) est déjà lue par le calcul :
`resolveCollectionTauxProgression.ts` en fait une moyenne pondérée. Mais **aucun code de
production ne l'écrit** — seul `src/test/fixtures.ts` le fait. Toutes les lignes valent donc
1, et la moyenne pondérée se comporte comme une moyenne simple.

Ce design ouvre le bout manquant, l'écriture. Aucun code de calcul n'est touché : une
pondération modifiée est immédiatement prise en compte par
`GET /collections/{id}/taux-progression`.

La pondération n'est **pas** montrée à l'utilisateur final : c'est un réglage
d'administration. La webapp n'est donc pas modifiée sur ce point.

### Contrat `CollectionApiModel` : `indicateurIds` devient `indicateurs`

Pour que l'écran d'administration affiche la pondération courante, il faut la remonter en
lecture. Le champ `indicateurIds: string[]` est remplacé par
`indicateurs: [{ id, ponderation }]` plutôt que doublé d'un second champ : deux champs
décrivant la même relation dans un contrat public seraient une dette immédiate.

Consommateurs à adapter, tous dans `kpilote-webapp` :

- `components/collections/CollectionCard.tsx:23` — un `.length`
- `routes/_authenticated/collections/$id.tsx:53,95,103` — chargement et tri des indicateurs

Aucun changement visuel. Les occurrences de `indicateurIds` dans `pilote-ppg` sont un
homonyme sans rapport avec les collections kpilote.

### Hors périmètre

- **Contacts utiles.** `CollectionApiModel.contactsUtiles` reste exposé en lecture et
  inchangé. Les administrer supposerait un CRUD `Organisme` + `ContactUtile` complet, qui
  n'existe nulle part aujourd'hui.
- **Réordonnancement des indicateurs.** L'ordre reste celui de l'insertion
  (`createdAt ASC` de la jonction), comme aujourd'hui.
- **Tests front.** Conformément à l'usage du projet, les écrans admin ne sont pas couverts
  par des tests automatisés.

## Contrat API (`kpilote-api`)

Toutes les routes d'écriture sont réservées aux clés API de rôle `ADMIN`, via
`ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)` dans la commande — même garde que les
relations. Les utilisateurs OIDC authentifiés sont refusés : le panel admin s'authentifie
avec une clé API.

### `POST /collections`

Body, sans identifiant :

```json
{ "nom": "Santé de proximité", "description": null, "visibilite": "PUBLIC" }
```

La commande calcule le prochain identifiant : maximum des `publicId` correspondant à
`^COL-\d+$`, converti en entier, incrémenté. Le calcul et l'insertion se font dans la même
transaction ; une violation de contrainte d'unicité déclenche un unique nouvel essai, ce qui
couvre deux créations concurrentes sans verrou de table.

Réponse `201` avec le `CollectionApiModel` créé (`indicateurs` et `responsables` vides).

### `PUT /collections/{id}`

Upsert replace-all sur les champs scalaires, même sémantique que `PUT /indicateurs/{id}` :
crée la collection si `id` est libre, remplace `nom`, `description` et `visibilite` sinon.

Le body porte les trois champs, toujours envoyés — ce que montre le formulaire est ce qui
est persisté, sans ambiguïté entre « champ absent » et « champ effacé ». Les affectations
(indicateurs, responsables, permissions) ne sont **pas** touchées : elles ont leurs propres
routes, et les inclure ici rendrait l'écran d'édition capable d'écraser un ajout concurrent.

Réponse `200` avec le modèle à jour.

### `DELETE /collections/{id}`

Suppression définitive. Les jonctions (`collection_indicateur`, `collection_responsable`,
`collection_permission`, `collection_contact_utile`, `collection_commentaire`) partent en
cascade — `onDelete: Cascade` est déjà déclaré sur chacune. Les indicateurs eux-mêmes ne
sont pas touchés.

Idempotent : `204` même si la collection n'existait pas, comme `DELETE /relations/{id}`.

### `POST /collections/{id}/indicateurs`

Body : `{ "indicateurId": "IND-012", "ponderation": 2 }`. `ponderation` est optionnelle et
vaut `1` par défaut.

- `409` si l'indicateur est déjà lié à la collection — l'IHM exclut déjà les indicateurs
  liés du sélecteur, un doublon signale donc un état périmé côté client, pas une intention.
- `400` (`VALIDATION_ERROR`) si l'indicateur est inconnu.

Réponse `200` avec le `CollectionApiModel` à jour, de sorte que l'écran se resynchronise
sans second appel — même convention que `POST /permissions/collection`.

### `PATCH /collections/{id}/indicateurs/{indicateurId}`

Body : `{ "ponderation": 3 }`. Nombre positif ou nul, deux décimales (borne du
`DECIMAL(20,2)`). Réponse `200` avec le `CollectionApiModel` à jour, `404` si le lien
n'existe pas.

Une pondération à `0` est acceptée : `resolveCollectionTauxProgression.ts:34` la traite déjà
comme « exclue de la moyenne ».

### `DELETE /collections/{id}/indicateurs/{indicateurId}`

Idempotent, `204`.

### `POST /collections/{id}/responsables`

Body : `{ "utilisateurId": "<uuid>" }`. `400` si l'utilisateur est inconnu, `409` s'il est
déjà responsable. Réponse `200` avec le `CollectionApiModel` à jour.

### `DELETE /collections/{id}/responsables/{utilisateurId}`

Idempotent, `204`.

### `GET /collections/{id}/permissions`

Lecture inverse de `GET /permissions?principalId=…`, qui ne sait répondre qu'à « à quoi ce
principal a-t-il accès ». L'onglet Utilisateurs a besoin de « qui a accès à cette
collection ».

```json
{
  "items": [
    {
      "principalId": "…uuid…",
      "type": "UTILISATEUR",
      "libelle": "prenom.nom@exemple.gouv.fr",
      "actions": ["READ", "WRITE"]
    },
    { "principalId": "…uuid…", "type": "API_KEY", "libelle": "sync-ppg", "actions": ["READ"] }
  ]
}
```

Tri par `type` puis `libelle`. `actions` est trié `READ` avant `WRITE`, comme
`principalPermissionsApiModel`.

L'octroi et le retrait réutilisent `POST /permissions/collection` et
`DELETE /permissions/collection`, qui existent déjà : aucune route d'écriture n'est ajoutée
pour les permissions.

### Tests

Un fichier par commande et par requête, plus `collection/routes.test.ts`, sur le modèle de
la PR relations. Cas à couvrir explicitement :

- refus d'écriture pour un principal non-`ADMIN` (clé non admin et utilisateur OIDC)
- génération de l'identifiant : première collection, suite non contiguë de `publicId`
- `PUT` : création sur identifiant libre, remplacement sur identifiant existant, et
  préservation des indicateurs et responsables déjà affectés
- suppression en cascade : les lignes de jonction disparaissent, les indicateurs restent
- `409` sur indicateur déjà lié et sur responsable déjà affecté
- pondération : une valeur autre que 1 modifie bien le résultat de
  `getCollectionTauxProgression`, une pondération à 0 exclut l'indicateur de la moyenne
- `GET /collections/{id}/permissions` : tri, mixité utilisateur / clé API, collection sans
  aucune permission

## Panel admin (`kpilote-admin`)

### Accès aux données

- `api/collections.ts` étendu : `fetchCollectionById`, `createCollection`,
  `updateCollection`, `deleteCollection`, `addIndicateur`, `updateIndicateurPonderation`,
  `removeIndicateur`, `addResponsable`, `removeResponsable`, `fetchCollectionPermissions`.
- `queries/collections.ts` : `collectionsInfiniteQueryOptions`, `collectionQueryOptions`,
  `collectionPermissionsQueryOptions`.

Le proxy BFF (`server/api/router.ts`) autorise déjà `collections` et tous ses sous-segments
via `SAFE_PATH` : aucune modification.

### `/collections` — liste

Calque de `/indicateurs` : champ de recherche, pagination « Charger plus »
(`useInfiniteQuery`), lignes cliquables vers la fiche, bouton « Créer une collection ».

Colonnes : ID (mono, primaire), Nom, Visibilité (badge, mêmes couleurs que les indicateurs),
nombre d'indicateurs, nombre de responsables.

### `/collections/nouveau` — création

Formulaire à trois champs — nom, description, visibilité. **Aucun champ identifiant.** À la
soumission, `POST /collections` puis redirection vers la fiche de la collection créée, où se
font les affectations.

### `/collections/$id` — fiche

Trois onglets (`Tabs` de `@pilote/kpilote-ui`, même agencement que `/utilisateurs/$id`) :

**Détails.** Formulaire nom / description / visibilité avec bouton Enregistrer, et bouton
Supprimer déclenchant une confirmation explicite (la suppression est définitive et emporte
les permissions).

**Indicateurs.** `IndicateurPicker` (composant existant, `components/permissions/`) pour
ajouter, en excluant les indicateurs déjà liés. Liste des indicateurs avec, par ligne : nom,
identifiant public, champ de pondération éditable, corbeille. La pondération est validée à
la sortie du champ ou à la touche Entrée, et déclenche un `PATCH` — pas de bouton
Enregistrer global.

**Utilisateurs.** Deux sections dans le même onglet.

- *Responsables* — `UtilisateurPicker` (existant) pour ajouter, liste avec nom, prénom,
  email et corbeille. Aucune incidence sur les droits d'accès ; l'intitulé de la section le
  précise.
- *Accès* — calque de `PrincipalPermissions` vu depuis la ressource. `UtilisateurPicker`
  pour ajouter un utilisateur en `READ`, bascule Écriture par ligne, corbeille. Les clés API
  disposant d'une permission sont listées avec leur nom et retirables, mais ne peuvent pas
  être ajoutées depuis cet écran : elles se gèrent depuis `/api-keys`.

### Comportement d'écriture

Toutes les affectations sont **unitaires et immédiates** : un appel par action, la réponse
alimente le cache React Query, un toast confirme. Pas de bouton Enregistrer, donc pas
d'écrasement entre deux administrateurs éditant la même collection. Seul l'onglet Détails,
qui édite des champs scalaires, garde une soumission classique.

Le verrou de production (`useProdEditUnlock`) s'applique aux onglets Indicateurs et
Utilisateurs, comme sur l'écran Permissions : en environnement `prod`, l'édition est
verrouillée jusqu'à déverrouillage explicite.

### Point d'entrée

Une carte « Gérer les collections » dans `/fonctionnalites`, entre les indicateurs et les
référentiels — description : « Créer ou modifier une collection, ses indicateurs et ses
utilisateurs. »
