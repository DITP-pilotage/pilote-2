# Commentaires sur indicateur individu (webapp) — Design

Date : 2026-06-24
App cible : `apps/mb-webapp` (Pilote MB, SPA TanStack Router + React Query + ky)
API consommée : `apps/mb-api` (déjà mergée, PIL-1581 → PIL-1593)

## 1. Objectif

Ajouter un onglet **« Commentaires »** dans la navigation tertiaire de la page d'un
indicateur, pour un individu donné (l'« individu » est une maille géographique :
France, région, département…). L'onglet permet de :

- lister l'historique des commentaires avec mise en avant du dernier en date ;
- créer un commentaire (qui démarre en **Brouillon**) ;
- éditer un commentaire (texte riche) ;
- publier un brouillon ;
- pour le type « Confiance », saisir une **météo** (indice de confiance), via un
  appel séparé et facultatif.

Pas de suppression dans l'UI pour ce jet (l'endpoint DELETE existe mais n'est pas exposé).

## 2. Design UI validé

Maquette de référence (compagnon visuel, dernière version) :
`.superpowers/brainstorm/45111-1782313525/content/option-a-v7.html`

Disposition retenue (**Option A**) : un `SegmentedControl` en tête d'onglet bascule
entre deux familles de commentaires, chacune rendue de façon **empilée** dans l'ordre
**Brouillon → État en cours → Historique**.

Les deux familles correspondent aux deux `type` de commentaire du sujet
`indicateurIndividu` :

| Libellé UI                         | `type` API  | Météo |
| ---------------------------------- | ----------- | ----- |
| Météo & synthèse des résultats     | `CONFIANCE` | oui   |
| Autres commentaires                | `DEFAUT`    | non   |

### 2.1 Carte « Brouillon » (en mode édition)

- Liseré gauche franc (ambre/warning), coins droits très légèrement arrondis (~3px).
- Pastille de statut **Brouillon**.
- Type CONFIANCE uniquement : sélecteur **Météo** = 4 pilules sur une ligne
  (Orage / Couvert / Nuage / Soleil), sélection mise en avant (`primary-tinted`).
  La météo n'est modifiable **qu'en édition**.
- **Éditeur de texte riche** (tiptap) : gras, italique, souligné, barré, liste à
  puces, liste numérotée, lien, annuler/rétablir. Pas d'image ni de composant avancé.
- Footer : « Modifié le JJ/MM à HHhMM par <auteur> » + actions **Enregistrer**
  (secondaire) et **Publier** (primaire).

### 2.2 Carte « État en cours » (publié, lecture)

- Liseré gauche franc (bleu primary).
- Pastille **Publié**.
- Type CONFIANCE : météo affichée en **tag résultat** (icône + libellé, `primary-tinted`).
- Contenu riche rendu en lecture, tronqué avec **« Voir plus / Voir moins »**
  (les textes peuvent faire plusieurs centaines de lignes).
- Footer : « Modifié le … par <auteur> ».
- Menu **⋮** (kebab) avec l'action **Éditer** (prévu pour accueillir d'autres
  actions plus tard).

### 2.3 Historique

- Liste antichronologique des commentaires plus anciens (hors brouillon et hors
  dernier publié déjà mis en avant).
- Chaque entrée : date, météo (si CONFIANCE et disponible), auteur, contenu riche
  tronqué avec **« Voir plus / Voir moins »**.

### 2.4 Règles d'affichage

- **Statuts** : on n'affiche **que « Modifié le »** (l'API n'expose pas de
  `published_at`).
- **Bouton « Ajouter un commentaire »** : visible en bas quand il n'y a pas de
  brouillon en cours pour la famille affichée. Masqué quand un brouillon existe
  (un seul brouillon par sujet/auteur/type côté API). Cliquer crée un brouillon
  vide en mode édition.
- **Sans données** : `EmptyState` (« Aucun commentaire pour le moment. »).
- Le contenu de l'onglet dépend de l'individu sélectionné (search param `individu`
  déjà présent sur la page). Pas d'individu : `EmptyState` invitant à en choisir un.

### 2.5 Mapping météo ↔ indice de confiance

Présentation front uniquement (l'API manipule des indices) :

| Indice API             | Météo    | Icône Lucide      |
| ---------------------- | -------- | ----------------- |
| `OBJECTIF_COMPROMIS`   | Orage    | `CloudLightning`  |
| `APPUIS_NECESSAIRE`    | Couvert  | `Cloud`           |
| `OBJECTIF_ATTEIGNABLE` | Nuage    | `CloudSun`        |
| `OBJECTIF_SECURISE`    | Soleil   | `Sun`             |

## 3. Réutilisation des composants existants

Maximiser l'usage de `apps/mb-webapp/src/components/ui/` et limiter le CSS custom
aux seules classes utilitaires Tailwind (jamais de couleurs flat, on passe par les
tokens du thème).

- `Page`, `Tabs/TabsList/TabsTrigger/TabsContent`, `SegmentedControl`, `Button`,
  `Card`, `Section`, `Heading`/`Text`, `EmptyState`, `FormField`, `Pagination`.
- Icônes : `lucide-react` (déjà utilisé partout).
- `clsxm` pour la composition de classes.

### 3.1 Nouveaux composants partagés

- **`components/ui/DropdownMenu.tsx`** : wrapper fin autour de `radix-ui`
  `DropdownMenu` (même style que `Select.tsx`), pour le menu ⋮. Aucun équivalent
  n'existe aujourd'hui.
- **`components/ui/Toast.tsx`** (+ helper `useToast` / provider) : wrapper autour
  de `radix-ui` `Toast`. Aucun système de notification n'existe aujourd'hui dans
  mb-webapp. Sert aux notifs de succès (ajout, publication, enregistrement) et aux
  erreurs (dont le 403 du gating, cf. §7).
- **Tokens de statut** dans `index.css` (`@theme`), valeurs DSFR, pour éviter les
  couleurs flat :
  - `--color-success: #18753c;` `--color-success-tinted: #e3fbe9;` (Publié)
  - `--color-warning: #b34000;` `--color-warning-tinted: #fff4e6;` (Brouillon)
  Les pastilles utilisent alors `bg-*-tinted text-*`. La météo et le tag résultat
  réutilisent les tokens existants `primary` / `primary-tinted`.

## 4. Éditeur de texte riche (tiptap)

mb-webapp n'a **aucune dépendance tiptap** aujourd'hui. À ajouter (mêmes versions
que `apps/pilote-ppg`, source d'inspiration : `3.x`) :

```
@tiptap/core @tiptap/react @tiptap/pm @tiptap/starter-kit
@tiptap/extension-link @tiptap/extension-underline @tiptap/extension-placeholder
```

Composants (inspirés de `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/`,
sans images/icônes/callouts) :

- `components/editeur-riche/EditeurRiche.tsx` : `useEditor` + `StarterKit` configuré
  minimal (heading/code/codeBlock/blockquote/horizontalRule désactivés) + `Link` +
  `Underline` + `Placeholder`. Props : `contenu: string` (HTML), `onChange(html)`,
  `estEnLectureSeule?`, `placeholder?`. Sortie/stockage : **HTML** (`editor.getHTML()`).
- `components/editeur-riche/MenuBar.tsx` : barre d'outils minimale (gras, italique,
  souligné, barré, liste à puces, liste numérotée, lien, annuler/rétablir), icônes
  Lucide, boutons stylés via tokens (`primary-tinted` actif).
- `components/editeur-riche/RenduContenuHtml.tsx` : rendu lecture seule du HTML pour
  les cartes publiées et l'historique (rendu DOM simple, pas de composants spéciaux).

## 5. Couche données

mb-webapp est **lecture seule** aujourd'hui (queries + loaders, aucune `useMutation`,
pas de dossier `mutations/`). Ce chantier introduit le **premier pattern d'écriture**.

### 5.1 Fonctions API (`ky`)

`src/api/commentaires.ts` :

- `fetchCommentaires(indicateurId, individuId, query)` → `GET indicateurs/{id}/individus/{individuId}/commentaires?type&cursor&pageSize` → `commentaireListApiModelSchema.parse`
- `createCommentaire(indicateurId, individuId, body)` → `POST …/commentaires`, `{ json: body }` (`CreerCommentaireBody<'DEFAUT'|'CONFIANCE'>`) → `commentaireApiModelSchema.parse`
- `updateCommentaire(commentaireId, body)` → `PUT commentaires/{commentaireId}`, `{ json: body }` (`ModifierCommentaireBody`) → `commentaireApiModelSchema.parse`

`src/api/niveauConfiance.ts` :

- `fetchNiveauConfianceCourant(indicateurId, individuId)` → `GET …/niveau-confiance` → `NiveauConfianceApiModel` ; **renvoie `null` sur 404** (l'API fait `findFirstOrThrow` quand aucun publié).
- `fetchHistoriqueNiveauConfiance(indicateurId, individuId, query)` → `GET …/niveau-confiance/historique` → `niveauConfianceListApiModelSchema.parse`
- `createNiveauConfiance(body)` → `POST niveau-confiance`, `{ json: { commentaireId, indice } }` → `NiveauConfianceApiModel`
- `updateNiveauConfiance(niveauConfianceId, body)` → `PUT niveau-confiance/{id}`, `{ json: { indice } }` → `NiveauConfianceApiModel`

Tous les schémas/types viennent de `@pilote/mb-shared/commentaire` et
`@pilote/mb-shared/niveauConfiance` (déjà exportés en sous-chemins).

### 5.2 Queries (`queryOptions`, `DEFAULT_STALE_TIME`)

`src/queries/commentaires.ts`, `src/queries/niveauConfiance.ts`. Clés :

- `['indicateur', indicateurId, 'individu', individuId, 'commentaires', type]`
- `['indicateur', indicateurId, 'individu', individuId, 'niveau-confiance', 'historique']`

Pour ce jet, on récupère **toutes les pages** via `fetchAllPaginatedItems`
(pattern existant), les volumes attendus étant modestes. La pagination « charger
plus » est une amélioration ultérieure si nécessaire.

### 5.3 Mutations (`src/mutations/`, nouveau)

`useMutation` + `queryClient.invalidateQueries` sur les clés ci-dessus :

- `useCreerCommentaire` (POST) → invalide la liste du type concerné.
- `useModifierCommentaire` (PUT contenu et/ou statut) → couvre **Enregistrer**
  (`{ contenu }`) et **Publier** (`{ statut: 'PUBLIE' }`, en persistant le contenu
  courant). Invalide la liste + l'historique niveau (un publié change le courant).
- `useCreerNiveauConfiance` / `useModifierNiveauConfiance` → invalident l'historique
  niveau. Appels **séparés** de ceux du commentaire (conforme à l'API : la météo
  n'est pas requise pour valider le commentaire).

### 5.4 Changement backend (mb-api) requis

Les deux routes de lecture des niveaux filtrent en dur `commentaire.statut = 'PUBLIE'`,
donc la météo d'un **brouillon** n'est récupérable par aucun GET. Décision : **retirer
ce filtre `PUBLIE`** sur `listerHistoriqueNiveauConfiance`
(`apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.ts`) pour
que l'historique renvoie les niveaux de **tous** les commentaires du périmètre
(brouillons inclus). `getNiveauConfianceCourant` n'est pas utilisé par cette UI et
reste inchangé. (Pas d'autre consommateur de ces routes à ce stade.)

### 5.5 Assemblage des données « Météo & synthèse » (CONFIANCE)

Le listing des commentaires ne porte **pas** la météo (entité séparée). Le rendu
des cartes CONFIANCE combine donc deux sources :

1. `fetchCommentaires(type='CONFIANCE')` : liste maîtresse des cartes (brouillons +
   publiés, antichronologique).
2. `fetchHistoriqueNiveauConfiance` : après le changement §5.4, construit une
   `Map<commentaireId, IndiceConfiance>` couvrant **tous** les commentaires (brouillon
   inclus). Une seule source de météo, plus de cas « non récupérable ».

Dérivations :

- **État en cours** = commentaire **publié** le plus récent de la liste (+ sa météo
  via la Map).
- **Brouillon** = commentaire `BROUILLON` de la liste (le cas échéant), affiché en
  édition (+ sa météo via la Map).
- **Historique** = le reste de la liste.

La famille « Autres commentaires » (DEFAUT) suit la même structure, **sans** la
Map météo ni le sélecteur.

## 6. Intégration dans la page

`src/routes/_authenticated/indicateurs/$id.tsx` : ajouter un 3ᵉ onglet à la `Tabs`
existante.

```tsx
<TabsTrigger value="commentaires">Commentaires</TabsTrigger>
…
<TabsContent value="commentaires">
  <IndicateurCommentairesTab indicateurId={id} individuId={individuId} />
</TabsContent>
```

Arborescence des composants de feature
(`src/components/indicateurs/commentaires/`) :

- `IndicateurCommentairesTab.tsx` : `SegmentedControl` CONFIANCE / DEFAUT + état
  local du type sélectionné, délègue à `CommentairesParType`.
- `CommentairesParType.tsx` : orchestre Brouillon / État en cours / Historique +
  bouton « Ajouter ». Reçoit un flag `avecMeteo`.
- `CarteCommentaire.tsx` : carte lecture (pastille statut, tag météo, Voir plus,
  menu ⋮ → Éditer).
- `EditeurCommentaire.tsx` : carte édition (sélecteur météo si CONFIANCE +
  `EditeurRiche` + Enregistrer/Publier).
- `SelecteurMeteo.tsx` : les 4 pilules météo.
- `meteo.ts` : mapping indice ↔ météo (libellé + icône), fonctions utilitaires.

## 7. Points à valider / limites connues

1. **Météo d'un brouillon** : résolu par le changement backend §5.4 (retrait du
   filtre `PUBLIE` sur l'historique des niveaux).
2. **Gating par auteur (décision : MVP « sale » + TODO)**. L'API n'autorise
   l'édition/publication qu'à l'auteur (403 sinon), mais le front n'a pas de clé
   fiable pour savoir si l'utilisateur courant est l'auteur (`/me` =
   `{ userId, prenom, nom }`, auteur = `{ id principal, email }`), et le listing
   renvoie les commentaires/brouillons de tous les auteurs. Pour ce jet : on
   **affiche les actions** (Éditer / Publier / Enregistrer) et on traite le **403 par
   un toast d'erreur**. **TODO obligatoire** (commentaire de code, près des actions) :
   _trouver un moyen de conditionner l'affichage des actions aux autorisations réelles
   (ex. booléen `peutModifier` exposé par l'API)._
3. **Enregistrer** explicite (+ Publier) sur le brouillon en édition. **Validé.**
4. **Pagination** : on charge tout l'historique pour ce jet (pas de « charger plus »).
   **Validé.**

## 8. Hors-scope

- Suppression de commentaire (UI).
- Blocage de la publication sans météo (« on verra plus tard »).
- Commentaires sur panier (individu et global), bien que l'API les couvre.
- Tests front automatisés (non pratiqués sur ce projet).

## 9. Vérification

Pas de tests automatisés front. Vérification manuelle dans l'app
(création → brouillon → édition riche → météo → publication → historique → Voir plus),
`pnpm lint` avant commit.
