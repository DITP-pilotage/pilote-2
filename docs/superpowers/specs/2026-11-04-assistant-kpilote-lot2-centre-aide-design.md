# Assistant kpilote — lot 2 : le centre d'aide

Date : 2026-11-04 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-centre-aide` (empilée sur le lot 1)
Référence : spec PPG `apps/pilote-ppg/docs/superpowers/specs/2026-10-15-albert-centre-aide-design.md` (PIL-1863).

## Intention

Une question sur le fonctionnement de kpilote (« comment est calculé le taux de progression ? »,
« comment importer des valeurs ? ») reçoit une réponse **fondée sur les pages publiées du centre
d'aide**, avec un lien vers ces pages. Si le centre d'aide ne couvre pas la question, l'assistant
le dit, n'affirme rien et oriente vers l'équipe KPILOTE.

## Décisions (validées)

- **Un sous-agent exposé comme outil**, `consult_centre_aide({ question })`, toujours disponible.
  Il ne voit que le centre d'aide ; l'agent principal garde la conversation et peut combiner avec
  les données.
- **Deux appels structurés, sans index** : sélection d'au plus 3 pages sur un sommaire (titre,
  chemin, intertitres), puis réponse à partir de ces pages → `{ found, answer, sourcesIds }`.
  Identifiants inventés filtrés aux deux étapes ; `found` sans source survivante → `found: false`.
- **Pages lues en base à chaque appel**, avec la règle de visibilité de la page publique
  (`listerArticlesCentreAidePublies`) : une mise à jour est prise en compte immédiatement.
- **Pas de `_output_instructions`** (amélioration sur PPG) : la consigne de restitution fidèle vit
  dans la description de l'outil, et le prompt principal gagne une règle « définition, calcul ou
  procédure → centre d'aide, jamais la mémoire ».
- **Les liens ne passent jamais par le LLM** : l'interface rend un encart déterministe depuis
  `sources` (`/centre-aide?article=<id>`), ou l'encart de contact si `found` est faux.

## Contrat

- `ToolKind` gagne `'help'`. `TOOLS.consult_centre_aide = { label: "Centre d'aide", kind: 'help', input: { question: string 1..500 } }`.
- `CentreAideOutput = { found: boolean; answer: string; sources: Array<{ id: string; titre: string; chemin: string[]; url: string }> }`.

## API

- `assistant/tools/centreAide/` : `sommaire.ts` (pages visibles → `{ id, titre, chemin, intertitres }`
  et `{ …, contenu }` en texte, via `textFromHtml`, intertitres extraits des `h1`–`h6`),
  `prompts.ts` (sélection et réponse, repris de PPG et adaptés à kpilote), `consultCentreAide.ts`.
- Sous-appels tracés `consult_centre_aide.selection` et `consult_centre_aide.answer` sur le
  modèle du tour.

## Front

- État « consulte le centre d'aide » quand la dernière part est cet outil en cours.
- Pastille dans « sources consultées » (comportement PPG), et sous la réponse un `CentreAideEncart` :
  liste des pages liées si `found`, sinon contact (lien `mailto` de `ContacterEquipe`).
- « Copier le texte » ajoute les pages citées (titre + URL absolue).

## Tests

Sommaire (visibilité, chemin, intertitres) ; outil (sélection vide → `found: false` sans second
appel, id inventé filtré, `found` sans source → `found: false`, sources avec URL) ; prompt cite
l'outil ; front : état, copie.
