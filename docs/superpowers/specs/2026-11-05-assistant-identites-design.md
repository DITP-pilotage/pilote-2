# Identités des personnes dans les réponses de l'assistant — design

Date : 2026-11-05
Ticket : PIL-1860 (epic PIL-1516 LLM)
Périmètre : `apps/pilote-ppg` (assistant Albert, serveur et front)

## Objectif

L'utilisateur doit pouvoir retrouver le nom, le prénom et l'e-mail des personnes citées dans les réponses de l'assistant (auteurs de commentaires, directeurs de projet, responsables, coordinateurs…), sans qu'aucune de ces données personnelles ne soit transmise à Albert.

Albert ne manipule que des **références** (l'identifiant interne de l'utilisateur). PILOTE les résout à l'affichage.

## Décisions (arbitrées)

1. **Référence = identifiant interne** (`utilisateur.id`, UUID), pas de pseudonyme dédié (refinement).
2. **Pas de détection des données personnelles en texte libre** (saisies par l'utilisateur ou présentes dans un commentaire) : sujet de formation, hors scope (refinement). Leur présence ne bloque pas l'échange.
3. **Syntaxe de la référence : `@[personne:UUID]`.** Substitution uniquement si le motif complet correspond, avec un UUID strict (`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`, insensible à la casse). Aucun risque de faux positif sur du texte utilisateur ; remark laisse `[personne:…]` en texte (pas de `(…)` derrière) ; un UUID ne contient aucun caractère d'emphase markdown.
4. **Toutes les personnes résolubles d'un coup** (voir « Personnes exposées »).
5. **Droits : tout utilisateur connecté peut résoudre tout id.** Un id n'atteint le client que via un outil qui a déjà contrôlé les habilitations, les UUID ne se devinent pas, et l'annuaire expose déjà responsables et coordinateurs. Suffisant pour commencer.
6. **Référence inconnue** (id absent de la base, malformé, ou compte supprimé après 2 ans) : afficher **« une personne »**. Cas jugé rarissime, on avisera s'il se présente.
7. **Résolution côté front, en batch** : endpoint tRPC qui résout une liste d'ids, appelé via un batcher [`@yornaath/batshit`](https://www.npmjs.com/package/@yornaath/batshit) ; chaque personne est mise en cache TanStack Query sous **une clé unitaire par id**, tandis que le fetch réseau se fait en batch.
8. **Les messages sont persistés avec les références**, jamais avec les identités. La résolution se fait à chaque affichage, avec les données du moment.

## Personnes exposées

| Source | Champ | Type stocké | Traitement |
|---|---|---|---|
| `chantier_identite` | `directeurs_projet_ids` | ids | référence |
| `chantier_territoire` | `responsables_locaux_ids`, `coordinateurs_territoriaux_ids` | ids | référence |
| `commentaire`, `synthese_des_resultats`, `decision_strategique`, `objectif` | `auteur_creation_id`, `auteur_modification_id` | ids | référence |
| `indicateur_identite` | `responsables_donnees_mails` | e-mails | id retrouvé par e-mail ; **e-mail sans compte → omis** (jamais transmis) |
| `chantier_identite` | `directeurs_administration_centrale` | texte libre (noms) | **exclu** : non résoluble, et ce sont des noms |

### Outils Albert concernés

Les requêtes chargent déjà la plupart de ces ids sans les exposer ; il s'agit d'élargir les `select` / mappings et d'ajouter les champs à la sortie des outils, sous forme de chaînes `@[personne:UUID]` (prêtes à recopier).

- `get_chantier_commentaires` (`GetChantierCommentairesQuery`) : pour chaque version, `auteur` (auteur de création de la publication) et `modifie_par` si différent.
- `get_chantier_objectifs` (`GetChantierObjectifsQuery`) : auteur(s) de chaque objectif.
- `get_chantiers` (`GetChantiersQuery`) : `directeurs_projet` au niveau chantier, `responsables_locaux` et `coordinateurs_territoriaux` au niveau territoire, et l'auteur de la synthèse. Les autres commentaires ne sont pas ajoutés à cet outil (ils restent dans `get_chantier_commentaires`).
- `get_chantier_indicateurs` (`GetChantierIndicateursQuery`) : `responsables_donnees` (ids retrouvés par e-mail, en une requête groupée).
- Encarts (`rediger_synthese_territoire`, `rediger_comparaison_territoires`) : ils consomment les données de `get_chantiers` via `collecterDonneesEncart` (vues `en_retard` et `en_difficulte`) ; les personnes leur parviennent donc, et **le prompt du sous-LLM d'encart (`subagents/encartSystemPrompts.ts`) reçoit la même règle de citation** que le prompt principal. Les encarts peuvent désormais citer des personnes.

**Pas de nouvel outil dédié** (ex. `get_chantier_responsables`) : on évite de multiplier les outils. Le surcoût en tokens (≈ 20-25 tokens par référence, quelques références par ligne) est accepté ; on mesure à l'usage et on avisera si une sortie devient trop lourde.

**Accès restreint** *(choix du builder-check)* : quand un outil masque déjà un contenu (`acces_restreint`, synthèse masquée, territoire hors périmètre), il masque aussi les personnes associées.

**Auteur d'un commentaire dédoublonné** *(choix du builder-check)* : l'auteur affiché est celui de la version retenue par `regrouperParType` (la plus récente de la série identique), cohérent avec la date retenue.

`search_chantiers` et les outils de valeurs d'indicateurs ne changent pas.

### Prompt système

Ajouter une règle courte (rubrique de lecture des résultats / rédaction) :
- les personnes sont fournies sous la forme `@[personne:UUID]` ; pour citer une personne, recopier la référence **exactement**, hors backticks et hors lien ;
- ne jamais inventer ni deviner un nom, ni modifier une référence ;
- une personne absente des résultats d'outils ne se cite pas.

Plus un cas dans les tests du prompt existants (`__tests__/systemPrompt.unit.test.ts`) si c'est la convention.

## Endpoint de résolution

- Procédure tRPC `protectedProcedure` en **query** (pour profiter du cache), nom au choix du builder, dans le module le plus naturel (piste : `albert` ou `annuaire`). Input : `ids: string[]` (zod, UUID, borné à 100).
- Implémentation : réutilise `UtilisateurRepository.recupererParIds` (port `chantiers`, déjà injecté dans `annuaire`) ou une query dédiée qui sélectionne en plus `date_desactivation`.
- Sortie, par id trouvé : `{ id, prenom, nom, email, service (libellé via getServiceLibelle), fonction, estDesactive }`. Les ids inconnus sont simplement absents ; le front les traite comme « une personne ».
- Pas de contrôle d'habilitation au-delà de la session (décision 5).
- Risque accepté (2026-11-10) : un utilisateur connecté peut obtenir le nom de n'importe quel compte dont il connaît l'id. Les personnes résolubles sont déjà publiques et leurs informations sont en ligne. Une version qui joignait les noms côté serveur, avec une liste `personnes_citables` en base, a été abandonnée pour cette version-ci, plus simple.

## Front

### Batcher et cache

- Un batcher `create({ fetcher, resolver, scheduler })` **créé une seule fois au niveau module** (pas dans un hook) :
  - `fetcher` : appelle la procédure tRPC via le client vanilla (`api.useUtils().client…` n'est pas utilisable hors hook ; le builder choisit le moyen d'obtenir le client tRPC hors React, ex. instancier un client vanilla ou injecter le client au premier usage) ;
  - `resolver` : `keyResolver("id")` — un id absent de la réponse se résout à `undefined` → « une personne » ;
  - `scheduler` : `windowedFiniteBatchScheduler({ windowMs: 10, maxBatchSize: 100 })`. Raison : le client ppg utilise `httpBatchLink` en GET avec `maxURLLength: 6000` ; 100 UUID ≈ 4 000 caractères.
- Hook `usePersonne(id)` : `useQuery({ queryKey: ["personne", id], queryFn: () => batcher.fetch(id), staleTime élevé })`. Une entrée de cache par personne ; N références rendues simultanément = 1 requête réseau.
- Une fonction utilitaire non-hook (ex. `resoudrePersonnes(queryClient, ids)`) qui fait `queryClient.fetchQuery` sur chaque id (le batcher regroupe) et renvoie une `Map` — utilisée par la copie et l'export (voir plus bas).

### Rendu dans le markdown

- Nouveau plugin remark `remarkPersonnes`, sur le modèle de `ChatUI/remarkChantierLinks.ts` : découpe les nœuds `text` (et `inlineCode` dont le contenu est exactement une référence) en nœuds dédiés, rendus via `components` de react-markdown par un composant `Personne`.
- Branché dans `AssistantMessageText.tsx` → couvre automatiquement les messages, les encarts (`EncartSynthese`), la vue admin (`ConversationTranscript` réutilise `AssistantMessage`).
- Composant `Personne` :
  - chargement : texte neutre discret (le builder choisit : « … » ou squelette) ;
  - trouvée : `Prénom Nom` avec l'infobulle existante `NomUtilisateurAvecTooltip`, enrichie de l'**e-mail** (service, fonction, e-mail) ;
  - compte désactivé : `Prénom Nom (désactivé)` — ppg n'a aujourd'hui aucun libellé dédié et affiche les désactivés comme des actifs ; on signale l'état sans masquer l'identité ;
  - inconnue / erreur : « une personne ».

### Textes bruts (hors markdown rendu)

Chaque endroit qui manipule le texte brut doit substituer avant usage, avec la même regex partagée et le même formatage texte (`Prénom Nom`, `Prénom Nom (désactivé)`, `une personne`) :

| Endroit | Fichier | Traitement |
|---|---|---|
| Copie d'un message | `ChatUI/AssistantMessage.tsx` (concat `texteEncarts` + `extractMessageText` + centre d'aide) | substitution via `resoudrePersonnes` avant `copyText` |
| « Copier la synthèse » (export markdown) | `ChatUI/EncartSynthese.tsx` | idem |
| Nom de fichier de l'export | `nomEncart` (`ChatUI/exporterEncart.ts`) | idem si le titre contient une référence |
| Export PDF | `imprimerEncart` clone le DOM rendu | rien à faire si les personnes sont résolues avant l'impression ; s'assurer qu'aucun état « chargement » n'est imprimé (attendre `resoudrePersonnes`) |
| Suites cliquables / clarification | `ChatUI/ChoicesInline.tsx` | **affichage** substitué ; l'**envoi** garde la référence brute (Albert doit la revoir telle quelle) |
| Message utilisateur | `ChatUI/UserMessage.tsx` | affichage substitué (cas d'une suite cliquée) |
| Vue admin : question utilisateur, titre, premier message | `ConversationTranscript.tsx`, `AlbertDashboardTable.tsx` | affichage substitué |

Le titre de conversation (`ChatConversation`, premier message utilisateur) et la recherche admin (`LIKE` sur le texte brut) restent en références : la recherche par nom de personne n'est pas un besoin.

## Non-objectifs

- Détection / masquage des données personnelles en texte libre (utilisateur ou contenu de commentaire).
- Contrôle d'accès fin (personne rattachée à un chantier lisible).
- Résolution des DAC (texte libre).
- Liens cliquables vers une fiche personne / l'annuaire.
- Résolution côté serveur pour d'autres canaux (mails, exports serveur) : il n'y en a pas pour l'assistant aujourd'hui.

## Anti-objectifs

- Un nom, prénom ou e-mail présent dans une sortie d'outil, le prompt système ou l'historique envoyé à Albert.
- Une identité supposée affichée pour une référence inconnue ou altérée.
- Une requête réseau par personne affichée.

## Tests

- Serveur : tests unitaires des outils modifiés (présence des références, absence de nom/prénom/e-mail dans la sortie — à vérifier explicitement), de la résolution e-mail → id des responsables des données (e-mail sans compte omis), et de l'endpoint (ids inconnus absents, désactivé signalé).
- Pas de plan de tests front (convention projet).

## Laissé au builder

- Nom et module de la procédure tRPC, nom des fichiers front.
- Manière d'obtenir le client tRPC hors React pour le batcher.
- Rendu de l'état de chargement.
- Forme exacte des champs ajoutés aux sorties d'outils (en restant cohérent avec les noms existants, en snake_case).
