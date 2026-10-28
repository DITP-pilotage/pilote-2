# Encart de synthèse et de comparaison d'Albert

Ticket : PIL-1900. Suite de la refonte du prompt système
([2026-10-27-albert-refonte-system-prompt-design.md](2026-10-27-albert-refonte-system-prompt-design.md)),
étape 4 du journal des mesures.

## Intention

La refonte a sorti le gabarit de synthèse du prompt système : il imposait sa
forme (pas de tableau, `&nbsp;`, sections fixes) à tous les usages. On ne veut
pas pour autant perdre la synthèse structurée que les utilisateurs connaissent.

On la rend à un **sous-agent de rédaction**, appelé par deux outils dédiés,
qui vont **eux-mêmes chercher les données** et rendent leur texte **en
streaming dans un encart** façon document, plus large que la discussion.

Trois gains attendus :

1. **Cloisonnement** : le gabarit ne vit plus que dans le prompt du sous-agent ;
   le prompt principal reste libre pour les autres usages.
2. **Complétude** : les données d'une synthèse ne dépendent plus des appels que
   le modèle principal pense à faire. À l'étape 3, la synthèse du territoire
   courant oubliait des chantiers.
3. **Présentation** : un encart reconnaissable, rempli au fil de la rédaction.

## Objectifs

- Deux outils : `rediger_synthese_territoire` et
  `rediger_comparaison_territoires`.
- Le contenu de l'ancien gabarit (mono-territoire et comparaison), rédigé par
  un sous-agent en markdown, chiffres compris.
- Un encart « note administrative » (variante B des maquettes) qui se remplit
  pendant la rédaction.
- Une mesure N2 + N3 comparée à l'étape 3, comme les étapes précédentes.

## Non-objectifs

- Le rapport exporté (`export_rapport`) et le dashboard (`create_dashboard`) ne
  changent pas.
- « Où en sont l'Occitanie et ses départements ? » reste une réponse dans le
  fil : un appel au taux d'avancement avec `include_sous_territoires`, puis un
  tableau. Seules une « synthèse » ou une « comparaison » explicite d'un
  territoire et de ses sous-territoires ouvrent l'encart.
- La résolution des territoires dans le code (entrée 1 de l'étape 4) : traitée
  après.
- Un rendu du squelette par le code (chiffres posés par le code, prose seule
  par le sous-agent) : écarté pour l'instant, voir « Option écartée ».

## Anti-objectifs

- Des chiffres dans l'encart qui ne sont pas ceux de PILOTE.
- Un encart pour une demande précise : un critère ciblé, un chantier, un
  indicateur.
- Le gabarit qui fuit à nouveau vers le prompt principal.

## Quand l'encart se déclenche

Règle validée : une demande de **synthèse ou de comparaison sur des critères
génériques** appelle ces outils ; une demande précise reste une réponse dans le
fil.

| Demande | Traitement |
|---|---|
| « Fais-moi la synthèse du Nord » | `rediger_synthese_territoire` |
| « Où en est la Gironde ? », « La situation en Bretagne » | `rediger_synthese_territoire` |
| « Compare le Nord et la Gironde », « Bretagne ou Normandie, qui avance le mieux ? » | `rediger_comparaison_territoires` |
| « Fais-moi la synthèse des difficultés de la Bretagne » | `rediger_synthese_territoire` |
| « Fais-moi la synthèse de Bretagne et ses départements », « Compare Bretagne avec ses départements » | `rediger_comparaison_territoires` avec `include_sous_territoires` |
| « Les chantiers en retard du Nord », « Le taux d'avancement de la Gironde » | outils de données, dans le fil |
| « Les difficultés en Hauts-de-France » | outils de données (vues en retard et en difficulté), dans le fil |
| « Compare le CH-062 entre le Nord et la Gironde » | outils de données, dans le fil |
| « Où en sont l'Occitanie et ses départements ? » | taux avec `include_sous_territoires`, dans le fil |
| « Fais-moi un rapport sur la Gironde » | inchangé (`export_rapport`) |

Un territoire désigné par son nom ou son numéro passe d'abord par
`search_territoires`, comme pour tous les outils (règle de l'étape 2).

## Les outils

### Entrées

- `rediger_synthese_territoire` : `territoire_code`, `jalon`.
- `rediger_comparaison_territoires` : `jalon`, et soit `territoire_codes`
  (2 à 5 territoires désignés), soit `territoire_code` avec
  `include_sous_territoires` (le territoire et ses sous-territoires, résolus
  par l'outil avec le `TerritoireResolver` existant, sans limite de nombre).

Le modèle principal renseigne le jalon courant par défaut, comme pour les
outils de données.

### Collecte des données, dans l'outil

L'outil appelle lui-même les queries déjà utilisées par les outils de données,
avec les mêmes règles :

- taux d'avancement du territoire, médiane des territoires de la même maille,
  position par rapport à la médiane, nom du territoire : ce que calcule
  `get_taux_avancement_territoire` ;
- chantiers en retard et chantiers en difficulté : ce que renvoie
  `get_chantiers` avec les vues `en_retard` et `en_difficulte`, y compris le
  filtrage des chantiers accessibles, les libellés (niveau de confiance,
  tendance, maille de pilotage) et la restriction d'accès (`acces_restreint`,
  tendance et commentaires masqués, `est_en_retard` et `est_en_difficulte`
  forcés à faux, comme aujourd'hui).

On réutilise le code de ces outils (`renvoyerChantier`,
`masquerDonneesNonAccessibles`, le calcul du taux et de la médiane), extrait
au besoin en fonctions partagées. Pas de duplication de la logique d'accès.

Cas particuliers à traiter dans les données passées au sous-agent :

- **NAT-FR** : l'analyse « en retard » n'existe pas au niveau national
  (`non_applicable` aujourd'hui). La section des chantiers en retard le dit au
  lieu de lister.
- **Aucun chantier** dans une vue : le périmètre exact a été interrogé, l'encart
  peut écrire « aucun chantier en retard ».
- **Aucun chantier accessible** (`acces_refuse`) : pas de sous-agent ni
  d'encart ; l'outil renvoie l'accès refusé et le modèle principal le dit.

### Le sous-agent

- Même modèle que le sous-agent du dashboard (`DEFAULT_MODEL`).
- **Prompt système** : le gabarit, un par outil (mono-territoire ou
  comparaison).
- **Message** : les données collectées, en JSON.
- **Sortie** : le contenu de l'encart en markdown, chiffres compris.

### Le gabarit, repris de l'ancien prompt avec ces changements

- « Météo » devient « Niveau de confiance », avec le libellé (« Objectifs
  compromis »…). Le sous-agent ne voit jamais de code météo.
- Les bricolages de mise en forme disparaissent (`&nbsp;`, `\` en fin de
  ligne) : l'encart gère l'espacement. Pas de HTML.
- La maille est nommée correctement : « le taux d'avancement du département »,
  pas « de la région » pour un département (défaut mesuré par le critère
  « Maille nommée »).
- Sur un territoire en accès restreint, un commentaire masqué s'écrit
  « Commentaire non accessible (restriction d'accès) », pas « Pas de
  commentaire disponible ».
- Sinon, le contenu est celui de l'ancien gabarit :
  - **synthèse** : titre, taux d'avancement du jalon face à la médiane ;
    chantiers en retard (nombre, puis pour chacun identifiant, nom, écart,
    niveau de confiance, résumé en 1 ou 2 phrases du commentaire de
    synthèse ou « Pas de commentaire disponible »), une phrase de tendance ;
    la même chose pour les chantiers en difficulté ; la mention des sources ;
  - **comparaison** : tableau taux, médiane et position ; analyse des écarts ;
    chantiers en retard communs à plusieurs territoires puis propres à
    chacun ; la même chose pour les chantiers en difficulté ; phrases de
    tendance ; sources.
- Les règles du prompt principal qui comptent ici sont recopiées dans le
  gabarit : français, pas d'opinion ni de recommandation, pas de causalité
  absente des données, ne citer que les données fournies.

### Streaming

- `execute` est un `async function*` (AI SDK 7.0.93 accepte un
  `AsyncIterable` en sortie d'outil). L'outil lance le sous-agent en streaming
  et fait un `yield` du markdown accumulé au fil du texte ; le dernier `yield`
  est le résultat final.
- Le client reçoit les `yield` intermédiaires comme des résultats
  `preliminary` de la part d'outil.
- L'`abortSignal` de l'outil est transmis au sous-agent.
- Il faut une variante de streaming pour le sous-agent dans `Albert.ts`
  (prompt système, message, abort), sans la persistance de conversation de
  `Albert.streamText`.

### Ce que reçoit le modèle principal

- `toModelOutput` lui transmet le markdown final de l'encart : il peut répondre
  aux questions de suivi (« détaille le CH-062 ») sans rappeler d'outil sur le
  même périmètre.
- Il écrit ensuite **une seule phrase** sous l'encart, comme après un
  dashboard.

## Le prompt principal

- **Lexique** (« Comprendre la demande ») : la ligne « « les difficultés » ou
  « la situation » d'un territoire » est remplacée par la règle de
  déclenchement ci-dessus : synthèse ou comparaison générique → encart ;
  demande précise → outils de données.
- **Collecter les données** : la ligne « une synthèse de territoire couvre son
  taux d'avancement, ses chantiers en retard et ses chantiers en difficulté »
  disparaît, l'outil s'en charge.
- **Exemples** : « Compare le Nord et la Gironde » passe à
  `rediger_comparaison_territoires` après une seule recherche ; ajout de « Fais-moi la synthèse
  du Nord » → `search_territoires` (DEPT-59) puis
  `rediger_synthese_territoire`.
- **Rédiger** : « Après un dashboard, un export ou une clarification, écris une
  seule phrase » couvre aussi l'encart.
- Les descriptions des deux outils suivent le modèle de description de la
  refonte (« Utilise-le pour / Ne l'utilise pas pour ») et portent les
  exemples du tableau de déclenchement.

## L'encart

Variante B des maquettes, « note administrative » :

- une feuille blanche, bordure fine, liseré bleu France de 5 px en haut, ombre
  légère, angles droits ;
- un en-tête de document : le type (« Synthèse territoriale » ou
  « Comparaison territoriale ») et le jalon à gauche ; la date de rédaction et
  « À partir des données publiées dans PILOTE » à droite ; un filet dessous ;
- le markdown stylé par l'encart : titre en grand, sections séparées par un
  filet, résumés (citations) sur fond bleuté avec un trait bleu France,
  tableau de la comparaison aux couleurs du DSFR ;
- l'encart **déborde de la colonne de discussion** (768 px) d'environ 64 px de
  chaque côté quand l'écran le permet (le chat vit dans l'overlay, jusqu'à
  1 152 px) ; sur un écran étroit, il reprend la largeur de la colonne. C'est
  nouveau : le dashboard, lui, reste dans la colonne.

Maquette de référence :
`.superpowers/brainstorm/25414-1793122425/content/encart-synthese.html`
(variante B, non versionnée).

### États

- **Dès l'appel de l'outil** : l'en-tête s'affiche avec « Rédaction en
  cours… ».
- **Pendant le stream** : le markdown se remplit au fil des résultats
  intermédiaires.
- **Erreur** : l'encart disparaît, comme le dashboard (`output-error` → rien).
- **Accès refusé** : pas d'encart, la phrase du modèle principal suffit.
- **Rechargement de la conversation** : l'encart se réaffiche depuis le
  résultat final sauvegardé avec le message.
- **« Copier le texte »** copie aussi le contenu de l'encart.

## Mesure (étape 4 du journal)

Même démarche que les étapes précédentes : N2 + N3, trois essais, comparés à
l'étape 3 (`dead2dc`, N2 90,5 %, N3 93,6 %, 36 échecs répétés).

- **N2** : une suite de déclenchement dans `evals/2-tools/2.3-rendu/` : les
  demandes génériques du tableau attendent l'outil ; les demandes précises,
  les sous-territoires, le rapport et le dashboard ne l'attendent pas. Les
  cas existants qui attendaient les outils de données sur une demande
  générique sont mis à jour.
- **N3** : les scénarios de synthèse et de comparaison génériques
  attendent le nouvel outil : `3.1-synthese/syntheseTerritoire`,
  `syntheseDifficultes` (seul scénario en profil coordinateur, il mesure la
  restriction d'accès dans l'encart), `syntheseDepartements`,
  `3.2-comparaison/comparerTerritoires`, `comparerDepartements`. La réponse
  jugée est le contenu de l'encart plus la phrase finale.
- **Preuves du juge** : les données ne passent plus par les outils de données
  du modèle principal. La vérité du juge et les territoires masqués
  (`maskedTerritories`) sont alimentés par les données passées au
  sous-agent ; sinon « Chiffres exacts » compare l'encart à lui-même et
  « Restriction signalée » ressort non applicable.
- **Grilles** (choix de conception) : les grilles N3 existantes restent
  telles quelles, pour comparer à l'étape 3 à grille constante. Les contrôles
  propres à l'encart (écart et niveau de confiance de chaque chantier, maille
  nommée correctement, mention de la restriction d'accès, sections présentes,
  pas de HTML) vont dans un groupe à part, `encart`, rapporté séparément du
  total N3.
- **À surveiller aussi** : la recopie des commentaires et la latence avant le
  premier texte.

**Seuil de bascule** (choix de conception) : un échec répété (au moins 2 essais
sur 3) de « Chiffres exacts » ou du contrôle des écarts sur un scénario
d'encart fait passer à l'option écartée ci-dessous.

## Option écartée, pour plus tard

Le code construit le squelette (titre, taux, médiane, liste des chantiers avec
écart et niveau de confiance) et le sous-agent ne renvoie, en sortie
structurée, que la prose : résumés, phrases de tendance, analyse des écarts.
Les chiffres ne passent jamais par un LLM et l'encart est rendu par des
composants. Écartée pour tester d'abord la version la plus simple ; à
reprendre si la mesure montre des chiffres faux.

## Laissé au builder

- La forme exacte du JSON passé au sous-agent et du résultat de l'outil (il
  faut au minimum le markdown ; l'en-tête a besoin du type, du jalon et de la
  date).
- L'extraction des fonctions partagées avec `get_chantiers` et
  `get_taux_avancement_territoire`.
- Le niveau de raisonnement et la température du sous-agent, à régler sur la
  latence et la mesure.
- La fréquence des `yield` (à chaque morceau de texte ou regroupés).
- Le libellé d'état de l'assistant pendant la rédaction (`deriverEtatAssistant`)
  et un éventuel événement de suivi (`assistantEvents`).
- Le découpage en composants de l'encart et les classes Tailwind.
