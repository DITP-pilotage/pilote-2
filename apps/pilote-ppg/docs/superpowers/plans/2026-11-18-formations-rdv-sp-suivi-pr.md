# Formations RDV-SP : suivi des PR

Épic : [PIL-1961](https://data-ditp.atlassian.net/browse/PIL-1961) « Faciliter l'accès aux formations PILOTE »
Tickets : [PIL-1883](https://data-ditp.atlassian.net/browse/PIL-1883) (paramétrage DITP), [PIL-1923](https://data-ditp.atlassian.net/browse/PIL-1923) (slide-in utilisateur)
Design : [2026-11-18-formations-rdv-sp-tables-design.md](../specs/2026-11-18-formations-rdv-sp-tables-design.md)

Cinq PR empilées (stack GitHub #2709). Chacune est cadrée en détail au moment de la commencer. La synchronisation copilot → PILOTE a été ajoutée en PR 3 le 2026-11-19. Les PR 1 à 3 sont mergées dans `dev` : la PR 4 part de `dev`.

## Avancement

| #   | PR                                               | Ticket                 | Base  | Branche                                     | Lien                                                         | Statut                                                                                                                                     |
| --- | ------------------------------------------------ | ---------------------- | ----- | ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Tables, données fictives, onglet Séances à venir | PIL-1883               | `dev` | `feat/PIL-1883-formations-tables-seances`   | [#2707](https://github.com/DITP-pilotage/pilote-2/pull/2707) | Mergée : [plan](./2026-11-18-formations-rdv-sp-pr1.md)                                                                                     |
| 2   | Onglets Profils et Périodes d'information        | PIL-1883               | PR 1  | `feat/PIL-1883-formations-profils-periodes` | [#2708](https://github.com/DITP-pilotage/pilote-2/pull/2708) | Mergée : [plan](./2026-11-18-formations-rdv-sp-pr2.md)                                                                                     |
| 3   | Synchronisation copilot → PILOTE par l'open-api  | PIL-1883 (à confirmer) | PR 2  | `feat/PIL-1883-formations-synchro-copilot`  | [#2728](https://github.com/DITP-pilotage/pilote-2/pull/2728) | Mergée : [design](../specs/2026-11-19-formations-synchro-copilot-design.md), [plan](./2026-11-19-formations-rdv-sp-pr3-synchro-copilot.md) |
| 4   | Slide-in sur l'accueil                           | PIL-1923               | `dev` | `feat/PIL-1923-formations-slide-in`         | –                                                            | En cours : [design](../specs/2026-11-23-formations-slide-in-design.md), [plan](./2026-11-23-formations-rdv-sp-pr4-slide-in.md)             |
| 5   | Mesure d'usage dans Matomo                       | PIL-1923               | PR 4  | à créer                                     | –                                                            | À faire                                                                                                                                    |

Statuts : À faire, À cadrer, Cadrée, En cours, En relecture, Mergée.

## PR 1 : tables, données fictives, onglet Séances à venir

Périmètre :

- Migration Prisma des six tables dans `public` (voir le design).
- Script local `seed-formations.ts`, lancé à la main, refusé hors base locale.
- Entrée « Formations » dans le menu du panel administrateur, page à onglets réservée à DITP Admin, sur le modèle de `AlbertPanel`.
- Onglet « Séances à venir », en lecture seule.
- Requête des séances à venir, avec leur statut (ouverte, complète, annulée) ; la slide-in ne gardera que les séances ouvertes.

Débloque copilot : il peut écrire dans les tables dès que la migration est passée en recette.

À cadrer :

- [x] Plan détaillé : [2026-11-18-formations-rdv-sp-pr1.md](./2026-11-18-formations-rdv-sp-pr1.md)
- [x] Colonnes affichées dans l'onglet Séances à venir : toutes les séances à venir avec un statut calculé (Ouverte, Complète, Annulée), dans un `TableauAdmin` avec recherche et filtres, et la date du dernier import (plus récent `updated_at` des motifs, ajouté au contrat copilot)

## PR 2 : onglets Profils et Périodes d'information

Périmètre :

- Onglet « Profils » : matrice profils en lignes, motifs en colonnes, une case par croisement, enregistrée au clic avec un toast.
- Onglet « Périodes d'information » : liste (du, au, formations, statut calculé), ajout, modification, suppression. Une période passée reste visible mais ne se modifie plus.
- Une période enregistrée remplace celles qu'elle chevauche, qui sont supprimées (soft delete, colonne `deleted_at`), avec un avertissement dans le formulaire.

À cadrer :

- [x] Plan détaillé : [2026-11-18-formations-rdv-sp-pr2.md](./2026-11-18-formations-rdv-sp-pr2.md), avec les règles des périodes validées le 2026-11-18
- [x] Mise à plat des règles des périodes et relecture (2026-11-19) : [2026-11-19-formations-rdv-sp-pr2-periodes.md](./2026-11-19-formations-rdv-sp-pr2-periodes.md)

## PR 3 : synchronisation copilot → PILOTE

Périmètre :

- Route `PUT /api/open-api/formations`, documentée dans le swagger, protégée par un secret dédié (`FORMATIONS_API_SECRET`).
- Copilot envoie chaque jour l'état complet : upsert des motifs, motifs absents retirés (`deleted_at`), séances rechargées, le tout dans une transaction.
- Colonnes alignées : `deleted_at` et `cancelled_at`, `lieu` retirée, `animateurs` en tableau.
- Formations retirées de RDV-SP signalées et écartées dans l'onglet Périodes d'information.

À cadrer :

- [x] Design : [2026-11-19-formations-synchro-copilot-design.md](../specs/2026-11-19-formations-synchro-copilot-design.md)
- [x] Plan détaillé : [2026-11-19-formations-rdv-sp-pr3-synchro-copilot.md](./2026-11-19-formations-rdv-sp-pr3-synchro-copilot.md)
- [ ] Ticket Jira de la PR (PIL-1883 par défaut)

## PR 4 : slide-in sur l'accueil

Périmètre :

- Formations à proposer : période active, motifs de la période non retirés de RDV-SP (`deleted_at IS NULL`) et associés au profil de l'utilisateur, séances ouvertes à l'inscription. Période active = non supprimée (`deleted_at IS NULL`) et en cours : réutiliser `statutPeriode`. Une période supprimée ne présente plus la slide-in. Sans verrou, deux périodes peuvent être en cours en même temps : prendre la plus récemment créée (`created_at`).
- Slide-in sur l'accueil, d'après le prototype joint à PIL-1923.
- « Plus tard », fermeture, lien d'inscription par séance.
- Ligne d'état par utilisateur et par période (`formation_periode_information_utilisateur`).
- Ajout des données au seed e2e pour les tests de la slide-in.

À cadrer (points ouverts du ticket) :

Décidé le 2026-11-23, détaillé dans le [design](../specs/2026-11-23-formations-slide-in-design.md) :

- [x] Contenu : variante D du canevas (prochaine séance avec heure de début et durée, places restantes, autres dates dépliables, sans animateurs)
- [x] Règle de nouvelle présentation après « Plus tard » (croix et Échap compris) : 7 jours après le dernier report, sans languette pour rouvrir
- [x] Effet d'un clic vers l'inscription : aucun, la slide-in reste ouverte et l'utilisateur choisit ensuite « Plus tard » ou « Ne plus me les proposer »
- [x] Nouvelle présentation lors d'une campagne suivante : une nouvelle période est une nouvelle campagne
- [x] Aucune formation disponible : pas de slide-in et aucune ligne d'état
- [x] Chargement : requête tRPC côté client, hors du `getServerSideProps` de l'accueil
- [x] Validation du design (2026-11-23)
- [x] Plan détaillé : [2026-11-23-formations-rdv-sp-pr4-slide-in.md](./2026-11-23-formations-rdv-sp-pr4-slide-in.md)

## PR 5 : mesure d'usage dans Matomo

Périmètre :

- Événements Matomo envoyés par la slide-in : affichage, clic par formation, report, fermeture, rattachés à la période d'information.
- Sur le modèle du suivi de l'assistant IA (`useAssistantTracking`).

À cadrer :

- [ ] Nommage des événements (catégorie, action, nom)
- [ ] Plan détaillé

## Hors pile

| Sujet                                                                                                                                                                                                                                                                                 | Responsable | Statut                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| Envoi des motifs et séances par copilot, selon le [contrat de la synchronisation](../specs/2026-11-19-formations-synchro-copilot-design.md#contrat-avec-copilot)                                                                                                                      | à définir   | À faire                                          |
| Mise à jour de PIL-1883 : l'arbitrage « pas de stockage des séances » ne tient plus                                                                                                                                                                                                   | à définir   | À faire                                          |
| Mise à plat des règles des périodes d'information (décidée le 2026-11-19, après la relecture de la PR 2) : une période en cours créée par erreur ne peut ni se supprimer ni se corriger ; une période en cours dont toutes les formations ont disparu de RDV-SP ne peut pas s'arrêter | Tristan     | Faite dans la PR 2 (soft delete et remplacement) |
