# Formations RDV-SP : suivi des PR

Épic : [PIL-1961](https://data-ditp.atlassian.net/browse/PIL-1961) « Faciliter l'accès aux formations PILOTE »
Tickets : [PIL-1883](https://data-ditp.atlassian.net/browse/PIL-1883) (paramétrage DITP), [PIL-1923](https://data-ditp.atlassian.net/browse/PIL-1923) (slide-in utilisateur)
Design : [2026-11-18-formations-rdv-sp-tables-design.md](../specs/2026-11-18-formations-rdv-sp-tables-design.md)

Quatre PR empilées. Chacune est cadrée en détail au moment de la commencer.

## Avancement

| # | PR | Ticket | Base | Branche | Lien | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tables, données fictives, onglet Séances à venir | PIL-1883 | `dev` | `feat/PIL-1883-formations-tables-seances` | [#2707](https://github.com/DITP-pilotage/pilote-2/pull/2707) | En relecture : [plan](./2026-11-18-formations-rdv-sp-pr1.md) |
| 2 | Onglets Profils et Périodes d'information | PIL-1883 | PR 1 | à créer | – | À faire |
| 3 | Slide-in sur l'accueil | PIL-1923 | PR 2 | à créer | – | À faire |
| 4 | Mesure d'usage dans Matomo | PIL-1923 | PR 3 | à créer | – | À faire |

Statuts : À faire, À cadrer, Cadrée, En cours, En relecture, Mergée.

## PR 1 : tables, données fictives, onglet Séances à venir

Périmètre :

- Migration Prisma des six tables dans `public` (voir le design).
- Script local `seed-formations.ts`, lancé à la main, refusé hors base locale.
- Entrée « Formations » dans le menu du panel administrateur, page à onglets réservée à DITP Admin, sur le modèle de `AlbertPanel`.
- Onglet « Séances à venir », en lecture seule.
- Requête des séances ouvertes à l'inscription (pas passées, pas annulées, pas complètes), réutilisée ensuite par la slide-in.

Débloque copilot : il peut écrire dans les tables dès que la migration est passée en recette.

À cadrer :

- [x] Plan détaillé : [2026-11-18-formations-rdv-sp-pr1.md](./2026-11-18-formations-rdv-sp-pr1.md)
- [x] Colonnes affichées dans l'onglet Séances à venir : toutes les séances à venir avec un statut calculé (Ouverte, Complète, Annulée), dans un `TableauAdmin` avec recherche et filtres, et la date du dernier import (plus récent `updated_at` des motifs, ajouté au contrat copilot)

## PR 2 : onglets Profils et Périodes d'information

Périmètre :

- Onglet « Profils » : matrice profils en lignes, motifs en colonnes, une case par croisement, enregistrée au clic avec un toast.
- Onglet « Périodes d'information » : liste (du, au, formations, statut calculé), ajout, modification, suppression. Une période passée reste visible mais ne se modifie plus.
- Refus du chevauchement de deux périodes.

À cadrer :

- [ ] Plan détaillé

## PR 3 : slide-in sur l'accueil

Périmètre :

- Formations à proposer : période active, motifs de la période associés au profil de l'utilisateur, séances ouvertes à l'inscription.
- Slide-in sur l'accueil, d'après le prototype joint à PIL-1923.
- « Plus tard », fermeture, lien d'inscription par séance.
- Ligne d'état par utilisateur et par période (`formation_periode_information_utilisateur`).
- Ajout des données au seed e2e pour les tests de la slide-in.

À cadrer (points ouverts du ticket) :

- [ ] Règle de nouvelle présentation après « Plus tard » : prochaine connexion, prochaine visite ou délai
- [ ] Effet d'un clic vers l'inscription sur la slide-in
- [ ] Nouvelle présentation lors d'une campagne suivante
- [ ] Aucune formation disponible : ne pas afficher la slide-in (proposition du ticket)
- [ ] Plan détaillé

## PR 4 : mesure d'usage dans Matomo

Périmètre :

- Événements Matomo envoyés par la slide-in : affichage, clic par formation, report, fermeture, rattachés à la période d'information.
- Sur le modèle du suivi de l'assistant IA (`useAssistantTracking`).

À cadrer :

- [ ] Nommage des événements (catégorie, action, nom)
- [ ] Plan détaillé

## Hors pile

| Sujet | Responsable | Statut |
| --- | --- | --- |
| Écriture des motifs et séances par copilot, selon le contrat du design | à définir | À faire |
| Mise à jour de PIL-1883 : l'arbitrage « pas de stockage des séances » ne tient plus | à définir | À faire |
