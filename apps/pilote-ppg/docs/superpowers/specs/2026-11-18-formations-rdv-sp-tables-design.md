# Formations RDV-SP : tables et données fictives (PIL-1883, PIL-1923)

Date : 2026-11-18
Épic : PIL-1961 « Faciliter l'accès aux formations PILOTE »
Suivi des PR : [2026-11-18-formations-rdv-sp-suivi-pr.md](../plans/2026-11-18-formations-rdv-sp-suivi-pr.md)

## Intention

La DITP veut proposer aux utilisateurs les formations Campus PILOTE adaptées à leur profil, pendant des périodes d'information (PIL-1883), via une slide-in sur l'accueil (PIL-1923). Les motifs et les séances restent gérés dans Rendez-vous Service Public (RDV-SP) ; copilot les récupère déjà chaque jour et les écrira dans la base pilote.

Cette étape pose le socle : les tables et des données fictives locales, pour développer l'admin et la slide-in sans attendre l'écriture par copilot.

## Objectifs

- Tables des données RDV-SP, remplies par copilot.
- Tables du paramétrage DITP : motif ↔ profils, périodes d'information, motifs d'une période.
- Table d'état d'affichage de la slide-in, par utilisateur et par période.
- Script de données fictives, lancé à la main en local.

## Hors périmètre

- Écrans d'admin et slide-in, sauf l'onglet Séances à venir qui part avec les tables (PR 1 du suivi).
- Écriture côté copilot (ce document en fixe seulement le contrat).
- Mesure d'usage : elle passe par des événements Matomo (affichage, clic par formation, report, fermeture), envoyés par la slide-in.

## À éviter absolument

- Que le rechargement quotidien de copilot efface le paramétrage de l'admin.
- Que des formations fictives arrivent en recette ou en prod : `prisma db seed` tourne à chaque build, prod comprise.

## Écart avec PIL-1883

Le ticket avait tranché « séances récupérées à la volée, pas de stockage ». On stocke finalement motifs et séances, écrits par copilot dans la base pilote. Le ticket est à mettre à jour.

## Approches

**Propriété des tables RDV-SP**

- Retenu : PILOTE crée les tables par migration Prisma, dans `public`. Copilot ne fait qu'écrire des lignes. PILOTE garde la main sur le contrat ; base de test et seed e2e ont les tables sans rien faire (l'équipe juge déjà « pas bon » une table créée hors Prisma dans `tests/seed/schema.sql`).
- Écarté : copilot crée ses tables dans un schéma à lui, PILOTE les déclare dans Prisma sans migration. Dérive Prisma, tables à recréer à la main dans les tests.
- `raw_data` écarté au profit de `public`, à la demande de Tristan.

**Suivi de la slide-in par utilisateur**

- Retenu : une ligne d'état par utilisateur et par période, qui ne garde que ce qu'il faut pour décider d'afficher. Toute la mesure d'usage va dans Matomo.
- Écarté : un journal d'événements en base (une ligne par action), qui aurait aussi porté la mesure d'usage.

## Tables

Toutes dans `public`, avec `created_at` et `updated_at` (défaut `now()`). Les identifiants de motif et de séance sont ceux de RDV-SP (`bigint`).

### Remplies par copilot

`formation_motif`

| Colonne | Type | Note |
| --- | --- | --- |
| `id` | bigint, clé | identifiant RDV-SP du motif |
| `nom` | text | ex. « CAMPUS PILOTE : Introduction à l'outil » |
| `date_suppression` | timestamptz, nullable | motif supprimé dans RDV-SP |
| `created_at` | timestamptz, défaut `now()` | |
| `updated_at` | timestamptz, défaut `now()` | dernière écriture par copilot |

`formation_seance`

| Colonne | Type | Note |
| --- | --- | --- |
| `id` | bigint, clé | identifiant RDV-SP du rendez-vous |
| `motif_id` | bigint, FK `formation_motif` | |
| `date_debut` | timestamptz | |
| `duree_minutes` | integer | |
| `lieu` | text, nullable | adresse ou visioconférence |
| `animateurs` | text, nullable | noms des agents, pour « Animé par… » |
| `date_annulation` | timestamptz, nullable | `cancelled_at`, seule source de l'annulation |
| `nombre_places_max` | integer, nullable | `max_participants_count` |
| `nombre_inscrits` | integer | `users_count` |
| `url_inscription` | text | lien d'inscription pour l'utilisateur |
| `created_at` | timestamptz, défaut `now()` | |
| `updated_at` | timestamptz, défaut `now()` | dernière écriture par copilot |

Contrat avec copilot :

- Stratégie d'écriture pas encore tranchée (décision du 2026-11-19) : vider puis recharger (`TRUNCATE formation_seance, formation_motif` puis insertion des motifs et des séances, dans une seule transaction) ou upsert. Elle se décidera avec copilot, comme les éventuels ajustements de `created_at` et `updated_at`.
- Ne pas modifier la structure des tables (pas de colonnes `_dlt_*` ajoutées par dlt).
- Renseigner `updated_at` à l'heure de l'import sur chaque motif écrit (la valeur par défaut suffit en insertion, pas en mise à jour) : l'onglet Séances à venir affiche la plus récente, pour voir d'un coup d'œil si le DAG a tourné.
- Écrire tous les motifs de l'organisation, même sans séance à venir : l'admin doit pouvoir les paramétrer à l'avance. Le motif de chaque séance écrite doit figurer dans le même chargement, motif supprimé compris, sinon la clé étrangère fait échouer toute la transaction (la date d'import cesse alors d'avancer dans l'onglet Séances à venir).
- Renseigner `date_annulation` (le `cancelled_at` de RDV-SP) pour toute séance annulée : c'est la seule source de l'annulation pour PILOTE. Le `status` de RDV-SP n'est pas stocké (décision du 2026-11-19) : `cancelled_at` est rempli quand il passe à un statut d'annulation, la colonne aurait fait doublon.
- Si l'écriture passe par dlt, sa stratégie de remplacement ne doit ni vider les tables une à une, ni charger en jobs parallèles : c'est incompatible avec la transaction unique et la clé étrangère.
- Les séances peuvent être limitées à celles à venir. PILOTE refiltre de toute façon à l'affichage (passées, annulées, complètes), puisque les données ne sont rafraîchies qu'une fois par jour.

### Paramétrage DITP (PIL-1883)

`formation_motif_profil` : `motif_id` (bigint), `profil_code` (FK `profil`). Clé (`motif_id`, `profil_code`).

`formation_periode_information` : `id` (uuid), `date_debut` (date), `date_fin` (date). Pas de libellé : une période se reconnaît à ses dates dans la liste de l'admin.

Deux périodes ne peuvent pas se chevaucher (décision du 2026-11-18). La règle sera appliquée par la création et la modification de période, avec l'écran d'admin. Pas de contrainte d'exclusion en base pour l'instant : aucune migration du projet n'en contient, et Prisma ne la modélise pas. Les données fictives la respectent.

`formation_periode_information_motif` : `periode_id` (FK `formation_periode_information`, suppression en cascade), `motif_id` (bigint). Clé (`periode_id`, `motif_id`).

Aucune clé étrangère du paramétrage vers `formation_motif` : sinon le `TRUNCATE` de copilot échoue ou, en cascade, efface le paramétrage. Une association vers un motif disparu de RDV-SP reste en base et ne ressort simplement plus des jointures.

### État de la slide-in (PIL-1923)

`formation_periode_information_utilisateur`

| Colonne | Type | Note |
| --- | --- | --- |
| `utilisateur_id` | uuid, FK `utilisateur`, cascade | |
| `periode_id` | uuid, FK `formation_periode_information`, cascade | |
| `date_presentation` | timestamptz | première présentation |
| `date_report` | timestamptz, nullable | dernier clic sur « Plus tard » |
| `date_fermeture` | timestamptz, nullable | fermeture : plus de présentation sur la période |

Clé (`utilisateur_id`, `periode_id`). Pas de ligne : jamais présentée. `date_report` garde de quoi appliquer la règle de nouvelle présentation, encore à arbitrer (prochaine connexion, prochaine visite ou délai).

## Données fictives

- Script `src/database/prisma/seed-formations.ts`, sur le modèle de `seed-evaluation.ts`, lancé par un script pnpm dédié. Jamais appelé par `seed.ts` ni par le build.
- Refuse de tourner si `DATABASE_URL` ne pointe pas sur `localhost` ou `127.0.0.1` (même garde que `tests/seed/seed.sh`).
- Refuse aussi, avant toute écriture, si `formation_motif` ou `formation_periode_information` contient des lignes hors du jeu fictif : un tunnel vers la recette ou la prod expose la base distante sur `127.0.0.1`.
- Rejouable : il remplace ses propres lignes à chaque passage, et seulement elles.
- Contenu :
  - les six motifs Campus PILOTE du ticket, avec des identifiants fictifs ;
  - la matrice motif ↔ profils validée dans PIL-1883 ;
  - des séances datées par rapport au jour du lancement : à venir, passée, annulée, complète, pour exercer les filtres ;
  - une période en cours avec une partie des motifs, une période passée ;
  - aucune ligne d'état : la slide-in s'affiche pour tout le monde.

## Écran d'admin (PR 1 pour Séances à venir, PR 2 pour le reste)

Une entrée « Formations » dans le menu latéral du panel administrateur, réservée à DITP Admin, avec des onglets sur le modèle de la page Albert (`AlbertPanel`, onglet dans l'URL via `?onglet=`) :

1. **Profils** : la matrice du ticket, profils en lignes, motifs en colonnes, une case par croisement, enregistrée au clic avec un toast (comme « Permissions profils » d'Albert). Les motifs supprimés dans RDV-SP n'apparaissent pas.
2. **Périodes d'information** : liste (du, au, formations, statut calculé : à venir, en cours, passée), ajout et modification par un formulaire (dates et une case par motif), suppression. Une période passée reste visible mais ne se modifie plus. Le formulaire refuse un chevauchement.
3. **Séances à venir** : lecture seule, pour vérifier ce que copilot a ramené de RDV-SP. Toutes les séances qui n'ont pas commencé, avec un statut calculé (Ouverte, Complète, Annulée), dans un `TableauAdmin` (recherche, filtres, tri), et la date du dernier import en tête.

```
Panel administrateur › Formations
[ Profils ]  [ Périodes d'information ]  [ Séances à venir ]

Profil                              Intro  Commentaires  Rôles  Import  Assistant IA  Coordinateur
Coordinateur PILOTE régional         [x]       [x]        [x]    [ ]       [x]           [x]
Direction d'administration centrale  [x]       [x]        [x]    [x]       [x]           [ ]
…
```

### Règles des périodes d'information (validées le 2026-11-18)

- Statut calculé sur la date du jour, heure de Paris : À venir, En cours (du premier au dernier jour inclus), Passée.
- À l'enregistrement : fin ≥ début, au moins une formation, aucun chevauchement avec une autre période, bornes comprises.
- Création, ou période À venir : la fin ne peut pas être passée ; tout se modifie ; suppression possible.
- En cours : la fin et les formations se modifient, le début est figé, pas de suppression ; pour l'arrêter, on avance la fin à hier.
- Passée : lecture seule.
- Formulaire en modale, erreurs sous les champs au clic sur Enregistrer, boutons jamais désactivés.

## Laissé à la construction

- Noms exacts des modèles Prisma et des index.
- Effet d'un clic vers l'inscription sur la slide-in (à arbitrer dans PIL-1923) : une colonne s'ajoutera si la règle l'exige.
