# Assistant kpilote — lot 6 : accès et administration

Date : 2026-11-05 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-acces` (empilée sur le lot 5b)
Référence PPG : PIL-1871 (`server/albert-access/`, `PagePanelAdministrateur/Albert/`).

## Intention

Décider qui utilise l'assistant, pouvoir le couper d'un coup, et lire ce que les gens en font
(conversations et retours) pour l'améliorer.

## Décisions

- **Page Assistant dédiée dans kpilote-admin** (choix du user), avec ses propres tables, plutôt que
  le feature flag générique. Onglets « Accès » et « Conversations ».
- **Pas de profils** : kpilote n'en a pas (`Utilisateur` sans rôle). L'accès se donne par
  utilisateur, choisi parmi les utilisateurs kpilote existants (comme les « e-mails » de PPG, qui
  sont des utilisateurs Pilote recherchés, pas des adresses saisies).
- **Règle** : `actif && utilisateur autorisé`. La coupure générale passe avant tout. Les clés API
  restent refusées (l'assistant est pour des humains) ; les admins kpilote sont des clés API, il
  n'y a donc pas d'« admin toujours autorisé ».
- **État initial** : coupé, liste vide (rien n'est ouvert sans geste de l'admin). Choix du builder.
- **Pas de mode « ouvert à tous »** : interrupteur + liste, comme la maquette validée. Choix du
  builder ; s'ajoute facilement si besoin.
- **Vue admin pseudonymisée** (choix du user) : ni nom, ni e-mail, ni identifiant du principal.
  Liste paginée (25) des conversations, des plus récentes aux plus anciennes : titre, dates, tours,
  👍, 👎, commentaires. Filtres : recherche dans le titre, avec 👍, avec 👎, avec commentaire,
  catégorie de problème. Détail : le fil (questions et réponses en texte), et pour chaque tour son
  évaluation, ses catégories et son commentaire, le modèle, les tokens et la durée.
- **Sécurité** : routes `/assistant/admin/*` réservées aux clés API ADMIN ; le proxy de
  kpilote-admin n'ouvre que `assistant/admin`, pas le chat.
- **Webapp inchangée** : `GET /assistant/acces` porte déjà la règle ; sans accès, ni pastille ni
  entrée dans la palette.

## Hors lot

Profils, export, purge, Matomo (lot 7), Evalite (lot 8).

## Tests

Règle d'accès (coupé, autorisé, non autorisé, clé API) ; routes admin (garde ADMIN, ajout d'un
utilisateur inconnu → 404, liste filtrée et paginée, aucune donnée d'identité dans les réponses) ;
appariement des tours et des évaluations dans le détail.
