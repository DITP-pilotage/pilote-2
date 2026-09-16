# Éditeur du centre d'aide ppg — alignement sur kpilote

Date : 2026-09-16
Ticket : [PIL-1685](https://data-ditp.atlassian.net/browse/PIL-1685)
Application : `apps/pilote-ppg`

## Objectif

Remplacer l'éditeur du centre d'aide de ppg par une édition *live* calquée sur celle
construite pour kpilote : plus de double panneau éditeur/aperçu, une barre flottante sur
la sélection, un menu « / » pour insérer les blocs, et un arbre réordonnable au
glisser-déposer. On en profite pour ouvrir la lecture de vidéo au service
`fichiers.numerique.gouv.fr`, comme c'est déjà le cas pour les images, et pour ajouter un
accès direct à l'article côté visualisation.

## Périmètre

Retenu :

1. Éditeur live (barre flottante, menu « / », suppression du double panneau et de la
   `MenuBar` du centre d'aide).
2. Glisser-déposer dans l'arborescence d'administration.
3. Vidéo hébergée sur `fichiers.numerique.gouv.fr`.
4. Bouton « Accéder à cet article » (PIL-1685 #6).

Hors périmètre : la corbeille / suppression logique (PIL-1685 #2) fera l'objet d'un ticket
séparé. La suppression reste définitive côté ppg.

Tombe mécaniquement dans le périmètre : la largeur d'aperçu (PIL-1685 #1) disparaît avec le
panneau d'aperçu, la mise en titre multi-lignes (PIL-1685 #3) est réglée par la
configuration du `StarterKit`, et l'autoplay (PIL-1685 #5) par le lecteur vidéo commun.

## État des lieux

### Ce que ppg a aujourd'hui

`apps/pilote-ppg/src/client/components/_commons/EditeurRiche/` — un `EditeurRiche`
générique piloté par une `MenuBar` de 560 lignes, partagé entre le centre d'aide, les
nouveautés et l'éditeur simple. La page d'administration
(`PagePanelAdministrateurCentreAide.tsx`) affiche trois colonnes commutables par des
boutons « Masquer / Afficher » : arborescence, éditeur, aperçu.

L'arborescence se réordonne avec quatre actions — `monter`, `descendre`, `sortir`,
`entrer` — implémentées dans `DeplacerArticleCentreAideUseCase`.

### Ce que kpilote a construit

`apps/kpilote-admin/src/components/centre-aide/` — tiptap 3.30.5 avec `BubbleMenu`,
`SlashCommand` bâti sur `@tiptap/suggestion` et alimenté par un registre de blocs unique
(`blocs.tsx`), et un arbre `@dnd-kit` dont la logique de projection est isolée dans
`arbreDnd.ts`.

### Ce qui est déjà commun

Les contrats HTML des blocs sont **identiques** des deux côtés :

| Bloc | Balise | Attributs |
|---|---|---|
| Callout | `div[data-type="callout"]` | `data-color` |
| Accordéon | `div[data-type="accordion-item"]` | `data-title` |
| Icône | `span[data-type="icone"]` | `data-icon-type` |

C'est ce qui rend ce chantier abordable : c'est un portage d'expérience utilisateur et de
logique, pas une migration de format de contenu. Seule la vidéo diverge.

### Ce qui manque à ppg

`@tiptap/suggestion`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. ppg n'a
pas `lucide-react` et n'en aura pas : il dispose de son propre `registreIcones` et de ses
composants `Icones/`.

## Approche retenue

Réécriture ciblée dans ppg, avec les primitives de ppg (`shared/Modale`, `Icone`,
`registreIcones`, jetons Tailwind DSFR).

Deux alternatives ont été écartées :

- **Extraire l'éditeur dans `kpilote-ui`** et le consommer des deux côtés. ppg ne dépend
  volontairement d'aucun paquet `kpilote-*`, et il faudrait abstraire modale, bouton,
  toast, icônes et jetons pour deux systèmes de design distincts.
- **Copier littéralement `kpilote-admin`.** Le code tire `@pilote/kpilote-ui/{Button,
  Modale,Toast}`, `lucide-react` et des classes absentes de ppg (`text-text`,
  `surface-tinted`, `shadow-raised`) : on finirait par tout réécrire, en moins ordonné.

## Conception

### Arborescence des fichiers

Nouveau dossier `apps/pilote-ppg/src/client/components/_commons/CentreAide/editeur/` :

| Fichier | Rôle |
|---|---|
| `EditeurCentreAide.tsx` | tiptap, `BubbleMenu`, branchement du menu « / » |
| `blocs.tsx` | registre unique des blocs insérables, avec sous-menus |
| `extensions/index.ts` | `extensionsCentreAide(actions, placeholder)` |
| `extensions/SlashCommand.tsx` | menu « / » via `@tiptap/suggestion` |
| `arbreDnd.ts` | logique pure de projection du glisser-déposer |
| `ArbreCentreAideDnd.tsx` | arbre d'administration réordonnable |

`LecteurVideo.tsx` est placé un cran au-dessus, dans `_commons/CentreAide/` : il sert le
`NodeView` de l'éditeur autant que le rendu en lecture, il n'appartient donc pas au dossier
`editeur/`.

Réutilisés sans modification : `CalloutExtension`, `AccordionExtension`, `IconeExtension`
de `_commons/EditeurRiche/extensions/`.

Modifiés : `PagePanelAdministrateurCentreAide.tsx`, `useEditionCentreAide.ts`,
`RenduContenuHtml.tsx`, `VideoExtension.tsx`, `ModaleInsertionUrl.tsx`, `SanitizerHTML.ts`,
`DeplacerArticleCentreAideUseCase.ts`, la route tRPC `parametrageCentreAide`, et le
`package.json` de ppg.

Intacts : `MenuBar.tsx` et ses modales, qui servent encore `EditeurNouveauté` et
`EditeurSimple`. On les débranche uniquement du centre d'aide.

### Édition live

La page d'administration perd ses trois boutons de commutation et son panneau d'aperçu.
Elle présente l'arborescence à gauche (280 px), puis l'en-tête d'édition — badges de
statut, champ « Nom (arborescence) », champ « Titre affiché (contenu) », actions — et la
surface d'édition en dessous.

La surface d'édition porte `classesRenduContenuHtml` sur `.ProseMirror` et la même largeur
de colonne que la page de lecture `PageCentreAidePilote`. C'est ce qui rend l'aperçu
inutile : callout, accordéon, icône et vidéo ont tous un `NodeView` React, donc ce qui est
saisi est exactement ce qui sera lu.

`BubbleMenu` sur la sélection : gras, italique, souligné, barré, lien.

Menu « / » : encadré (info, succès, attention, alerte), accordéon, image, vidéo (par URL /
par fichier), lien, icône, titres H1 à H6, liste à puces, liste numérotée, séparateur.

Le `StarterKit` est configuré comme côté kpilote — `heading: { levels: [1..6] }`,
`code: false`, `codeBlock: false` — ce qui garantit que la mise en titre ne s'applique
qu'au bloc sélectionné.

### Vidéo

Le nœud passe de l'`<iframe>` brut au format kpilote :

```html
<div data-type="video" data-src="https://…"></div>
```

`parseHTML` accepte les deux formes, `div[data-type="video"]` et `iframe[src]`. Les
articles existants remontent en nœud vidéo à l'ouverture et sont réécrits au format cible
au prochain enregistrement : aucune migration de données n'est nécessaire.

L'insertion réutilise `ModaleInsertionUrl`, qui implémente déjà le constructeur d'URL pour
les images :

- `DOMAINES_AUTORISES_PAR_TYPE.video` devient
  `["video.finances.gouv.fr", "fichiers.numerique.gouv.fr"]`
- `EXTENSIONS_PAR_TYPE.video` devient `["mp4", "webm"]`, ce qui active le mode
  constructeur : on colle l'URL de partage, l'UUID en est extrait, et l'URL de média
  `https://fichiers.numerique.gouv.fr/media/preview/item/{id}/{nom}.{ext}` est reconstruite.

Le rendu est isolé dans `LecteurVideo.tsx`, consommé à la fois par le `NodeView` de
l'éditeur et par `RenduContenuHtml`. Comportement par défaut : hôte
`fichiers.numerique.gouv.fr` rendu en `<video controls preload="metadata">`, tout autre
hôte en `<iframe>` `aspect-video`. Aucun autoplay dans les deux cas.

> **Décision différée.** On ne sait pas encore si l'URL de média de
> `fichiers.numerique.gouv.fr` sert le binaire ou une page de prévisualisation. Le
> comportement ci-dessus est le pari par défaut ; il est confiné à ce seul fichier, donc
> arbitrable en une modification locale dès qu'une vraie URL de vidéo sera disponible.

`SanitizerHTML` doit accompagner ce format, sans quoi le contenu est purgé au premier
enregistrement :

- `div` accepte `data-src` en plus de `data-type`, `data-title`, `data-color`, `style`
- `fichiers.numerique.gouv.fr` rejoint `allowedIframeHostnames`
- les balises `video` et `source` sont autorisées, avec `src`, `controls`, `preload`,
  `poster`

### Glisser-déposer

`arbreDnd.ts` est porté depuis kpilote sur les types de ppg. La logique reste pure et
testable : aplatissement de l'arbre en liste DFS (en masquant les enfants des groupes
repliés), retrait des descendants pendant le glissement pour déplacer le sous-arbre en
bloc, et projection du point de dépôt en `{ depth, parentId, index }` où le décalage
horizontal détermine la profondeur. Un parent ne peut être qu'un `GROUPE`.

Seul l'arbre d'administration devient réordonnable. Le composant de lecture
`_commons/CentreAide/ArborescenceCentreAide.tsx` reste inchangé.

Côté serveur, `DeplacerArticleCentreAideUseCase.execute` prend désormais
`{ id, parentId, index }` au lieu de `{ id, action }`. Il réindexe les frères de la source
et ceux de la cible dans la transaction existante, et refuse de déplacer un article sous
l'un de ses propres descendants. Les quatre actions `monter` / `descendre` / `sortir` /
`entrer` disparaissent avec leur dernier appelant, soit environ 110 lignes en moins.

L'entrée tRPC devient :

```ts
z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  index: z.number().int().min(0),
})
```

### Accéder à cet article

Un lien vers `/centre-aide-pilote?article=${id}` est ajouté à l'en-tête d'édition, ouvert
dans un nouvel onglet. `useLectureCentreAide` lit déjà ce paramètre de requête via nuqs,
donc rien à ajouter côté lecture.

`PageCentreAidePilote` filtre sur `estPublie && !estMasque`. Le bouton est donc désactivé,
avec une infobulle explicite, quand l'article n'est pas visible côté lecture — plutôt que
d'envoyer l'utilisateur sur une page vide.

## Tests

Tests unitaires sur la logique durable uniquement :

| Cible | Ce qui est vérifié |
|---|---|
| `arbreDnd` | projection profondeur / parent / index, refus d'un parent `PAGE` |
| `DeplacerArticleCentreAideUseCase` | réindexation source et cible, refus du cycle |
| `SanitizerHTML` | une vidéo au format cible survit au nettoyage |
| `miseEnTitre` | la mise en titre ne touche que le paragraphe sélectionné |

Pas de tests de composants ni de tests end-to-end : la validation de l'interface est faite
manuellement.

## Risques

**Le sanitizer.** C'est le point de rupture le plus discret : si `data-src` n'est pas
autorisé sur `div`, la vidéo disparaît silencieusement à l'enregistrement, sans erreur. Le
test dédié sert de garde-fou.

**Le contenu existant.** Les articles actuels contiennent des `<iframe>` et des `<br>` en
nombre. La double tolérance du `parseHTML` couvre le premier cas ; le second continue de
s'afficher via la logique existante de `RenduContenuHtml`.

**Le rendu vidéo `fichiers.numerique.gouv.fr`.** Arbitrage différé, confiné à
`LecteurVideo.tsx`.
