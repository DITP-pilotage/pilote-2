# Assistant kpilote — composition visuelle

Date : 2026-08-31
Épic : PIL-1684 · Sous-projet 4, indépendant des sous-projets 2 et 3
Statut : proposition, à valider avant plan d'implémentation
Prérequis : sous-projet 1 livré (`docs/superpowers/specs/2026-08-28-assistant-kpilote-design.md`)

## 1. Contexte

Répondre en prose ne suffit pas. Quand un utilisateur demande où en est un indicateur sur son
territoire, une jauge, une courbe et une carte disent en un coup d'œil ce qu'un paragraphe dit mal.
PILOTE PPG a construit cette capacité — un sous-agent compose un tableau de bord à partir d'un
catalogue fermé de widgets, et des composants React vont chercher leurs propres chiffres.

Une première lecture avait conclu que kpilote n'avait pas les moyens de reproduire cela. **C'était
faux, et il faut le corriger explicitement** : la confusion venait du modèle Prisma `Widget`, qui
décrit une configuration de cartographie et non un catalogue de vignettes. Une collision de nom,
pas une absence de capacité.

L'inventaire réel est très favorable :

- `packages/kpilote-ui` est un design system complet — `StatCard`, `StatGrid`, `Card`, `CardGrid`,
  `ProgressBar`, `DataTable`, `Table`, `EmptyState`, `Section`, `Typography`.
- `apps/kpilote-webapp/src/components/widgets/WidgetRenderer.tsx` **est déjà un registre**
  `Record<type, composant>`. Il est keyé sur `string`, donc sans exhaustivité vérifiée à la
  compilation : c'est le seul point à améliorer.
- Les composants candidats **ne reçoivent que des références et chargent leurs propres données** :
  `IndicateurValeursTable({ indicateurId, individuId })`,
  `CollectionTauxProgression({ collectionId, individu })`,
  `CarteFranceWidget({ indicateurId, referentielId })`. C'est mot pour mot l'« Option 2 » vers
  laquelle le PRD de ppg a convergé après prototype — nous l'appliquons déjà.
- Plusieurs livrent leur squelette de chargement (`IndicateurAvancementSkeleton`,
  `CollectionAvancementSkeleton`), donc Suspense est prêt.

Ce qui manque n'est pas la capacité, c'est **le catalogue déclaré** : la liste fermée de ce que
l'assistant a le droit d'assembler, et le contrat qui la partage entre le serveur et le front.

## 2. Périmètre

### Dans le périmètre

- Le catalogue de vignettes, dans `kpilote-shared`, comme union discriminée zod.
- Le registre de composants côté front, avec exhaustivité vérifiée à la compilation.
- Le tool `compose_vue` et son sous-agent en sortie structurée.
- La validation des identifiants produits contre le contexte fourni.
- Le rendu : grille plate, Suspense et frontière d'erreur par vignette.

### Hors périmètre

- L'édition conversationnelle d'une vue existante (« enlève la carte ») — une recomposition
  complète suffit en v1, c'est ce que fait ppg.
- L'export de la vue en image ou en PDF.
- La persistance d'une vue en dehors de la conversation.
- Les vignettes portant sur les commentaires, les objectifs ou les responsables.

## 3. Décisions structurantes

| # | Décision | Motif |
|---|---|---|
| V1 | Une vignette ne porte **que des références**, jamais une valeur | Reprise de D4. Le « 67 % » n'existe nulle part dans la sortie du modèle : la factualité devient impossible à violer, et la vue se rafraîchit d'elle-même. Déjà le fonctionnement de `CarteFranceWidget`. |
| V2 | Catalogue **nominal**, une vignette par intention | Reprise de D3. ppg §1.1 : un `kpi_card` paramétré par `metric ∈ {…}` faisait confondre les métriques au modèle. Un enum ne peut porter qu'un périmètre, jamais la nature de ce qui est affiché. |
| V3 | Le catalogue vit dans **`kpilote-shared`** | Il est simultanément le schéma d'entrée du tool côté serveur et la table d'aiguillage côté front. Deux copies divergeraient, comme les listes d'outils chez ppg. |
| V4 | Le registre front est un `Record<TypeVignette, …>` | Ajouter une vignette au catalogue fait échouer la compilation du front tant que son composant n'existe pas. Le `WidgetRenderer` actuel est keyé sur `string` et n'offre pas cette garantie. |
| V5 | **Grille plate** à six colonnes, pas de containers imbriqués | Le document d'itération de ppg laisse la question ouverte : « si l'équipe préfère basculer sur une seule grille plate, la bascule reste simple ». On part simple. `CardGrid` de kpilote-ui ne convient pas : elle fixe trois colonnes sans contrôle de portée, donc la grille de l'assistant lui est propre — six colonnes, `tiers` = 2, `moitie` = 3, `pleine` = 6. |
| V6 | Le savoir de composition vit dans la **`description` du tool** | Reprise de D2, et c'est leur meilleure décision rétrospective (commit `6138cbd69`) : catalogue, règles et exemples au même endroit, hors du prompt envoyé à chaque tour. |
| V7 | Des **exemples few-shot** dans cette description dès la v1 | ppg les a ajoutés après coup (commit `7954bf043`) parce que le modèle produisait des vues mal structurées. C'est le prix de la fiabilité tant que le modèle n'est pas meilleur ; autant le payer d'emblée. |
| V8 | Tout identifiant produit est **validé contre le contexte** | Reprise de D5 et du `validateDashboardIdentifiers` de ppg. Une vignette qui référencerait un indicateur hors droits doit être rejetée avant le rendu, pas laissée au filtre de la query. |

## 4. Le catalogue

### 4.1 Forme

`packages/kpilote-shared/src/assistant/vignettes.ts`, union discriminée sur `type`.

```ts
const largeurSchema = z
  .enum(['tiers', 'moitie', 'pleine'])
  .describe("Largeur occupée dans la grille. Un enum de périmètre, pas de nature.")

export const vignetteSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('vignette_avancement_indicateur'),
    indicateurId: indicateurPublicIdSchema,
    individuId: individuPublicIdSchema,
    largeur: largeurSchema.default('tiers'),
  }),
  // … les autres cas
])

export const vueSchema = z.object({
  titre: z.string().min(1),
  vignettes: z.array(vignetteSchema).min(1).max(12),
})
```

`largeur` est un enum toléré : il décrit un périmètre d'affichage, pas la nature de ce qui est
affiché. C'est la frontière que pose V2.

### 4.2 Les huit vignettes de la v1

Chacune correspond à un composant existant. La colonne « références » est exactement ce que le
modèle produit.

| Vignette | Composant | Références |
|---|---|---|
| `vignette_avancement_indicateur` | `IndicateurAvancement` | `indicateurId`, `individuId` |
| `vignette_courbe_indicateur` | `IndicateurValeursChart` | `indicateurId`, `individuId` |
| `vignette_tableau_valeurs_indicateur` | `IndicateurValeursTable` | `indicateurId`, `individuId` |
| `vignette_carte_indicateur` | `WidgetRenderer` | `indicateurId`, `referentielId` |
| `vignette_avancement_collection` | `CollectionAvancement` | `collectionId`, `individuId` |
| `vignette_taux_collection` | `CollectionTauxProgression` | `collectionId`, `individuId` |
| `vignette_titre_section` | `Heading` de `Typography` | `texte` |
| `vignette_paragraphe` | `Text` de `Typography` | `texte` |

`vignette_paragraphe` est la seule où le modèle écrit du contenu. Sa description interdit
explicitement d'y placer une valeur chiffrée : les chiffres appartiennent aux autres vignettes,
qui les lisent à la source.

**Une seule vignette carte**, et non une par maille. Le `referentielId` détermine déjà la maille,
et le référentiel porte sa configuration de cartographie (`WidgetApiModel`, champ `type`, ex.
`carte-france-departements`). L'adaptateur charge le référentiel, lit son widget et délègue à
`WidgetRenderer` — la machinerie existante est réutilisée telle quelle.

### 4.3 Ce que le couple (entité, individu) confirme

Presque toutes les données d'indicateur de kpilote sont indexées par individu :
`indicateurValeursQueryOptions(indicateurId, individuId)`,
`indicateurTauxProgressionQueryOptions(indicateurId, individuId)`,
`collectionTauxProgressionQueryOptions({ collectionId, individu })`.

Une vignette a donc presque toujours besoin de deux références : l'entité et le territoire. C'est
exactement le `focus` + `cadrage` du contrat de surface du sous-projet 1. La forme du contexte,
écrite d'avance là-bas, trouve ici son premier consommateur réel.

**Le territoire vient de la surface, jamais d'une inférence sur la conversation.** Si le contexte
en fournit un, on l'utilise ; sinon on demande. Aucune heuristique du type « la conversation n'a
mentionné qu'un seul territoire, prenons celui-là » : ce serait exactement le genre de devinette
que le contrat de surface existe pour supprimer.

Conséquence de séquencement, à assumer : depuis la palette, un `Tab` sur un indicateur donne
l'indicateur mais pas le territoire, donc la composition demandera presque toujours une précision.
Elle prend sa pleine valeur depuis une page, où l'entité consultée et l'individu sélectionné
partent ensemble — c'est-à-dire **après le sous-projet 2**. Ce sous-projet reste implémentable
avant, mais son intérêt réel en dépend.

## 5. Le registre front

`apps/kpilote-webapp/src/assistant/vignettes/registre.tsx`

```ts
type RenduVignette<T extends TypeVignette> = (
  props: Extract<Vignette, { type: T }>,
) => React.ReactNode

const REGISTRE: { [T in TypeVignette]: RenduVignette<T> } = { … }
```

Le mapped type sur l'union impose une entrée par vignette : ajouter un cas au catalogue partagé
casse la compilation du front tant que son composant n'existe pas. C'est ce que le `Record<string, …>`
de `WidgetRenderer` ne fait pas aujourd'hui.

**Deux formes d'adaptateur.** La plupart des composants se branchent directement, puisqu'ils ne
prennent que des références. Ceux qui exigent une prop dérivée — `IndicateurAvancement` et
`IndicateurValeursChart` attendent `unite`, qui appartient à l'indicateur — sont enveloppés dans
un adaptateur qui charge `indicateurQueryOptions(indicateurId)` et la fournit. Une dizaine de
lignes chacun.

`WidgetRenderer` n'est pas remplacé : il reste le point d'entrée des cartes et l'adaptateur
`vignette_carte_indicateur` l'appelle.

## 6. Le tool et le sous-agent

`compose_vue` est un outil métier de plus, du même moule que `search_indicateurs` : il délègue à
un sous-agent en sortie structurée via `Output.object`, puis valide.

**Entrée du tool** — ce que l'agent principal fournit :

```ts
z.object({
  demande: z.string().describe("Ce que l'utilisateur veut voir."),
  indicateurs: z.array(indicateurPublicIdSchema).max(8).default([]),
  collections: z.array(collectionPublicIdSchema).max(8).default([]),
  individus: z.array(individuPublicIdSchema).min(1).max(4),
  referentiels: z.array(referentielPublicIdSchema).default([]),
})
```

**Sortie du sous-agent** : `vueSchema`. Le sous-agent n'a aucun outil et ne charge rien — il
choisit des vignettes et les dispose. C'est exactement le rôle qu'a fini par prendre le sous-agent
de ppg après leur itération 2 : « le tool est une fonction de validation qui renvoie son argument ».

**Validation avant retour** — la généralisation de leur `validateDashboardIdentifiers` :

1. Tout `indicateurId`, `collectionId`, `individuId`, `referentielId` d'une vignette doit figurer
   dans le contexte fourni en entrée. Sinon on rejette avec un message qui nomme l'identifiant
   fautif, ce qui permet au modèle de corriger.
2. Aucune valeur chiffrée dans un `texte` de `vignette_paragraphe` — on rejette si le texte
   contient un nombre suivi d'un `%` ou d'une unité, avec la raison.
3. Au plus 12 vignettes, borne du `vueSchema`.

## 7. Le rendu

`AssistantMessage` dispatche sur `part.type === 'tool-compose_vue'`. La part est typée puisque
`KpiloteUITools` porte la sortie du tool — c'est précisément ce que le typage posé au sous-projet 1
rend possible, et sans quoi rien de ceci ne serait rendable.

La vue est rendue dans une grille à six colonnes propre à l'assistant, chaque vignette dans son
`Suspense` et sa frontière d'erreur. Une vignette en échec affiche un encart d'erreur ; les autres continuent de s'afficher.
ppg a implémenté cette frontière en composant de classe custom plutôt que d'ajouter une
dépendance pour vingt-cinq lignes — on fait pareil.

Les squelettes de chargement existants (`IndicateurAvancementSkeleton`,
`CollectionAvancementSkeleton`) servent de `fallback`. Là où il n'y en a pas, un squelette
générique dimensionné par la largeur de la vignette.

## 8. Ce qui rend le sous-agent fiable

C'est le vrai coût du sous-projet, et il est assumé : tant que le modèle n'est pas plus fiable,
cette fiabilité s'achète par la structure du prompt.

**Le catalogue complet dans la description du tool**, sous forme de tableau markdown avec la
largeur par défaut de chaque vignette et ses références obligatoires. Pas dans le prompt système :
il partirait à chaque tour pour un savoir qui ne sert qu'ici.

**Trois exemples de vue complets, en JSON compact**, dans cette même description. ppg a mesuré leur
effet : sans eux, le modèle oubliait des vignettes ou les répartissait mal. Les trois cas à couvrir :

1. Un point sur un indicateur pour un territoire — titre, avancement, courbe, tableau.
2. Une comparaison d'un indicateur sur plusieurs territoires — titre, une jauge par territoire sur
   une rangée, puis la carte.
3. Un point sur une collection — titre, taux de la collection, puis une rangée d'avancements par
   indicateur.

Une note de garde-fou rappelle que les identifiants des exemples sont illustratifs et doivent être
remplacés par ceux du contexte.

**Les règles de mise en page vivent dans le code, pas dans le prompt.** ppg le recommande
explicitement : « si une règle doit être vraie à 100 %, elle ne doit pas dépendre seulement du
prompt ». Une vignette seule sur sa rangée est élargie à la compensation par la grille, pas par une
consigne au modèle.

## 9. Tests et évaluation

**Unitaires** — validation des identifiants contre le contexte, y compris le cas d'un identifiant
bien formé mais absent ; détection d'une valeur chiffrée dans un paragraphe ; exhaustivité du
registre (un test de type qui échoue si une vignette n'a pas de composant).

**Intégration** — le tool avec un modèle bouchonné rendant une vue valide, une vue avec un
identifiant hors contexte, et une vue dépassant la borne de vignettes.

**Pas d'évals.** Le harnais a été retiré du projet — voir §12 de la spec du moteur. Sur la
composition, un jeu de cas serait d'autant plus discutable qu'il figerait une mise en page :
« la vue doit contenir telle vignette » n'est pas une propriété qu'on veut verrouiller.

Ce qu'on surveille à la place, c'est l'événement `assistant.composeVue.rejet` : il dit à quelle
fréquence le sous-agent produit une vue invalide et pourquoi. Un taux qui monte après une
retouche du catalogue ou des exemples est le vrai signal — sur du trafic réel, sans avoir figé
de composition.

La règle qui compte, elle, est verrouillée par le code et non par un test de comportement :
`inputComposeVueSchema` exige au moins un individu, donc l'outil ne peut pas composer sans
territoire.

## 10. Points à trancher au démarrage

- **Nom de l'outil** : `compose_vue` proposé. `compose_dashboard` serait plus proche de ppg mais
  mélange les langues ; la convention kpilote est verbe anglais et entité française.
- **Modèle du sous-agent** : le même que le principal par défaut. La composition structurée est
  peut-être le cas où un modèle plus léger suffit — à essayer en dev, en surveillant le taux de
  rejet.
- **Modèle bouchonné des tests d'intégration** : `MockLanguageModelV3` doit rendre une sortie
  structurée conforme à `vueSchema`. Vérifier au démarrage que le mock du SDK supporte
  `Output.object` ; sinon tester la validation séparément de l'appel.
