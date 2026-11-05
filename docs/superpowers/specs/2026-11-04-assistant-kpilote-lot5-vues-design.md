# Assistant kpilote — lot 5 : vues, pastille, historique et confort du chat

Date : 2026-11-04 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-vues` (empilée sur le lot 4)
Référence PPG : PR #2521 (PIL-1940 / PIL-1905, branche `claude/ppg-ia-assistant-opening-47aeb9`) — `affichageAssistant`,
`MenuVue`, `AlbertPanneauLateral`, `AlbertFenetre`, `AlbertOverlay`, `AlbertPastille`, `MenuHistorique`,
`minimizedConversationStorage`, `preferencesAssistantStorage`, `useResizable`, `useTailleEcran`, `ChatEmptyState`,
`ChatExperimentationBanner` ; en dev : `useSpeechRecognition`, « Suivre la réponse » de `ChatUI`.

## Intention

L'assistant devient un compagnon de travail : on le garde ouvert à côté de la page, on le masque et on le reprend,
on retrouve ses conversations. Le fil gagne le confort de PPG : écran d'accueil avec propositions, bandeau
d'expérimentation, dictée vocale, « Suivre la réponse ».

## Décisions (comportements PPG copiés, adaptés à kpilote)

- **Entrée** : la palette ⌘K reste la porte d'entrée (décision du lot 1). La **pastille** ne fait qu'ouvrir ou
  reprendre ; elle ne prend pas ⌘K.
- **Trois vues** : plein écran (modale), panneau latéral, fenêtre flottante. Proposées selon la largeur (étroite
  < 992 px : plein écran ; moyenne : fenêtre, plein écran ; large ≥ 1440 px : les trois), repli de proche en proche
  sans oublier la vue choisie. `MenuVue` dans l'en-tête ; la vue, la largeur du panneau (400–720, défaut 520, 900 px
  laissés à la page) et la taille de la fenêtre (360–720 × ≥ 400) sont mémorisées en `localStorage`.
- **Panneau latéral dans le flux de la page** (la page rétrécit, le panneau reste ouvert en navigation) ; poignée
  redimensionnable à la souris et au clavier (pas de 20 px). **Fenêtre flottante** non modale, redimensionnable.
  **Plein écran** : piège de focus et blocage du défilement ; Échap **masque** l'assistant (pas de fermeture).
- **Masquer / reprendre** : plus de bouton « Fermer ». Masqué, l'assistant laisse la **pastille** (toujours visible
  hors assistant ouvert, pour qui y a accès) : « Demander à l'assistant », « L'assistant rédige… » pendant une réponse,
  « Reprendre » + titre sinon. La conversation masquée survit au rechargement de l'onglet (`sessionStorage`).
  Un lien interne cliqué depuis le plein écran passe en fenêtre (ou masque) avant de naviguer.
- **Historique** : le titre de la conversation dans l'en-tête ouvre la liste (50 plus récentes, recherche sans
  accents, groupées Aujourd'hui / Cette semaine / Ce mois-ci / mois), reprise d'une conversation, suppression avec
  confirmation. « Nouvelle conversation » dans l'en-tête. Pas de purge automatique (décision du lot 1).
- **API** : `GET /assistant/conversations` (résumés : id, titre, dates), `GET /assistant/conversations/{id}` (messages),
  `DELETE /assistant/conversations/{id}` — toujours limitées au principal appelant (404 sinon).
- **Écran vide** : « Bonjour, je suis l'assistant kpilote » + ce qu'il sait faire + **propositions selon la page**
  (page d'un indicateur, d'une collection, autre), envoyées au clic ou pré-remplies.
- **Bandeau d'expérimentation** repliable (version compacte en panneau et fenêtre) : texte PPG (« Ce chatbot est une expérimentation. Vos interactions sont analysées pour évaluer sa qualité et sont pseudonymisées. »), **sans liens** tant que kpilote n'a pas sa charte (choix du user).
- **Dictée vocale** (`SpeechRecognition`, fr-FR, bouton masqué si non supporté, coupée à l'envoi) et **« Suivre la
  réponse »** (bouton quand on a remonté de plus de 50 px pendant une réponse).
- **Hors lot** : tracking des vues et exports (lot 7), accès par profils (lot 6).

## Découpage (choix du user)

Deux PR empilées : **5a** vues, pastille, masquer / reprendre, historique et ses routes ; **5b** écran vide et
propositions, bandeau, dictée vocale, « Suivre la réponse ».

## Tests

Logique pure (repli des vues, bornes, stockage des préférences et de la conversation masquée, regroupement de
l'historique par période, propositions selon le contexte) ; API (liste, lecture, suppression limitées au principal).
