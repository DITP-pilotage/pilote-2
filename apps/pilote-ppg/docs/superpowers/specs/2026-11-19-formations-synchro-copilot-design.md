# Formations RDV-SP : synchronisation copilot → PILOTE par l'open-api

Date : 2026-11-19
Épic : PIL-1961 « Faciliter l'accès aux formations PILOTE ». Ticket : PIL-1883 (à confirmer).
Stack GitHub #2709 (#2707, puis #2708) : cette PR en devient la troisième, sur la PR 2 (#2708), branche `feat/PIL-1883-formations-synchro-copilot`.
Suivi des PR : [2026-11-18-formations-rdv-sp-suivi-pr.md](../plans/2026-11-18-formations-rdv-sp-suivi-pr.md)
Design des tables : [2026-11-18-formations-rdv-sp-tables-design.md](./2026-11-18-formations-rdv-sp-tables-design.md). Ce document en remplace la partie « Contrat avec copilot ».

## Intention

Les motifs et les séances de formation viennent de Rendez-vous Service Public (RDV-SP), que copilot interroge chaque jour. Le design des tables prévoyait que copilot écrive directement dans la base de PILOTE, avec dlt. On passe plutôt par l'open-api : copilot envoie à PILOTE, une fois par jour, l'état de RDV-SP, et PILOTE écrit lui-même ses tables.

PILOTE garde la main sur ses tables et ses règles, et copilot n'a plus besoin d'accès à la base. Le fonctionnement doit être carré et simple : un seul appel, un état complet, tout ou rien.

## Objectifs

- Une route de l'open-api, documentée dans le swagger, qui reçoit l'état complet des motifs et des séances à venir de Campus PILOTE et met à jour `formation_motif` et `formation_seance`.
- `formation_seance` réduite aux colonnes utiles, noms alignés sur `created_at`, `updated_at`, `deleted_at`.
- Les formations retirées de RDV-SP traitées dans l'admin (bug connu de la modale des périodes, reporté à cette PR).

## Hors périmètre

- Le code côté copilot (dépôt `DITP-pilotage/copilot`). Ce document fixe le contrat et dit comment copilot obtient chaque champ.
- Le lieu et le mode des séances (visio, sur place). Envisagés puis laissés de côté le 2026-11-19, à reprendre si le besoin apparaît.
- L'historique des séances passées : la mesure d'usage passe par Matomo.
- Un envoi incrémental (seulement ce qui a changé).
- Slide-in (PR 4) et Matomo (PR 5).

## À éviter absolument

- Effacer un motif : le paramétrage (profils, périodes) le référence, avec des clés étrangères `ON DELETE RESTRICT`.
- Laisser voir un état intermédiaire pendant un import (motifs à jour, séances vides ou de la veille).
- Qu'une panne de RDV-SP ou de copilot, qui enverrait une liste vide, retire toutes les formations.
- Exposer le lien de visioconférence de RDV-SP (`visio_url`) : d'après la documentation de RDV-SP, il permet d'entrer dans une séance sans s'inscrire.
- Donner à copilot un accès plus large que cette route.

## Approches

**Écriture des motifs**

- Retenu : upsert de chaque motif reçu. Un motif non supprimé qui manque dans l'envoi est marqué supprimé (`deleted_at` = maintenant). Un motif supprimé qui revient redevient actif (`deleted_at` = NULL). Le paramétrage est conservé et ressort tel quel.
- Écarté : vider puis recharger. Bloqué par les clés `RESTRICT`, et `created_at` serait perdu. Retirer ces clés laisserait un paramétrage pointant vers des motifs inconnus.
- Écarté : upsert seul. Un motif retiré de RDV-SP resterait proposé, sauf à faire envoyer par copilot les motifs supprimés et leur date.

**Écriture des séances**

- Retenu : vider puis recharger, dans la même transaction. Aucune table ne référence `formation_seance`.
- Écarté : upsert et suppression des absentes. Même résultat avec plus de code ; garde une date de première apparition que rien n'affiche.
- Écarté : upsert sans suppression. Une séance retirée de RDV-SP resterait affichée.

**Une route ou deux**

- Retenu : une route qui reçoit l'état complet (motifs et séances) et l'écrit dans une transaction. Chaque séance référence un motif du même envoi ; c'est tout ou rien ; copilot peut rejouer l'appel ; une seule date d'import.
- Écarté : deux routes, motifs puis séances. L'ordre est imposé, un échec entre les deux appels laisse les motifs à jour et les séances de la veille, et un import quotidien n'a rien à y gagner.

**Authentification** (choix de Tristan, 2026-11-19)

- Retenu : un secret dédié, dans une variable d'environnement de PILOTE, que copilot transmet en `Authorization: Bearer`. Il n'ouvre que cette route, n'expire pas et se révoque en changeant la variable.
- Écarté : un compte de service avec un token d'API. Le token expire au bout de 365 jours. En prod, le cron `desactivation-comptes` désactive un compte sans connexion web depuis 11 mois et supprime son token. Et un token DITP_ADMIN ouvre aussi l'import d'indicateurs sur tous les chantiers.

**Colonnes de `formation_seance`** (choix de Tristan, 2026-11-19)

- `lieu` retirée, sans remplacement : `en_visio`, `adresse` et une enum `lieu_type` ont été envisagées puis laissées de côté.
- `animateurs` en tableau plutôt qu'en texte concaténé.
- `date_annulation` renommée `cancelled_at`.

## La route

`PUT /api/open-api/formations`

- `PUT`, parce que l'appel remplace l'état et que le rejouer ne change rien. Toute autre méthode : 405.
- Authentification : le secret reçu dans `Authorization: Bearer <secret>` est comparé, en temps constant, à la variable d'environnement `FORMATIONS_API_SECRET`.
  - header absent ou mal formé : 401 ;
  - secret faux : 403 ;
  - variable non renseignée dans l'environnement : la route refuse tous les appels (503, comme le garde `onlyAcmeApiKey`), ce qui distingue une erreur de configuration de PILOTE d'un mauvais secret.
- La route vit sous `/api/open-api`, déjà public dans `proxy.ts` (pas de session). Elle n'utilise pas `endpointProtege`, qui exige le token JWT d'un utilisateur, mais un garde dédié sur le modèle d'`onlyCron`, avec le même `errorHandler`. Comme les routes d'export de l'open-api (`chantier/[chantierId]/donnees.ts`), la route porte elle-même sa fonction `handle` : validation, refus en 400, appel du handler d'écriture, journalisation (décision du 2026-11-20, relecture de la PR).
- Corps en JSON, avec la limite de taille par défaut de Next (1 Mo), largement suffisante : quelques motifs et quelques dizaines de séances.

### Corps

```json
{
  "motifs": [{ "id": 2101, "nom": "CAMPUS PILOTE : Introduction à l'outil" }],
  "seances": [
    {
      "id": 884512,
      "motif_id": 2101,
      "date_debut": "2026-12-03T09:30:00+01:00",
      "duree_minutes": 90,
      "animateurs": ["Camille Martin", "Alex Durand"],
      "cancelled_at": null,
      "nombre_places_max": 20,
      "nombre_inscrits": 12,
      "url_inscription": "https://rdv.anct.gouv.fr/users/rdv_wizard_step/new?rdv_collectif_id=884512"
    }
  ]
}
```

### Validation

Toute erreur renvoie un 400 et rien n'est écrit. Deux étapes (décision du 2026-11-20, relecture de la PR) :

1. le format, par un schéma zod (`src/validation/import-formations.ts`, comme les autres imports de l'open-api) : types, entiers, dates, lien ;
2. les règles de l'envoi, par une fonction de domaine (`verifierEnvoi`, `src/server/formations/domain/envoiFormations.ts`) : au moins un motif, pas de doublon, motif de chaque séance présent dans l'envoi.

Le détail des contrôles :

- `motifs` : au moins un motif. Une liste vide viendrait d'une panne et retirerait toutes les formations.
  - `id` : entier positif, unique dans l'envoi ;
  - `nom` : texte non vide.
- `seances` : peut être vide (aucune séance à venir).
  - `id` : entier positif, unique dans l'envoi ;
  - `motif_id` : présent dans `motifs` du même envoi ;
  - `date_debut` : date ISO 8601 avec fuseau ;
  - `duree_minutes` : entier strictement positif ;
  - `animateurs` : tableau de textes, éventuellement vide ou `null`, noms `null` acceptés. Le handler ignore à l'écriture les noms absents, vides ou faits d'espaces (agent sans prénom ni nom) : un nom manquant ne doit pas bloquer tout l'import ;
  - `cancelled_at` : date ISO 8601 avec fuseau, ou `null` ;
  - `nombre_places_max` : entier positif ou nul, ou `null` pour une séance sans limite de places ;
  - `nombre_inscrits` : entier positif ou nul ;
  - `url_inscription` : URL en `https`.
- Les champs inconnus sont ignorés : copilot peut ajouter un champ avant que PILOTE ne le lise, et un champ envoyé par erreur (`visio_url`, par exemple) n'est jamais stocké.
- Les séances déjà commencées ne sont pas refusées : PILOTE les filtre à l'affichage.

### Réponses

- 200 : `{ "motifs": { "ecrits": 6, "retires": 1 }, "seances": { "ecrites": 14 } }`. `retires` compte les motifs que cet appel a marqués supprimés.
- 400 : `{ "message": "…", "erreurs": [{ "chemin": "seances.3.motif_id", "message": "Le motif 2107 ne fait pas partie de l'envoi." }] }`, sur le modèle de l'import des commentaires.
- 401, 403, 503 : authentification (voir plus haut).

## Écriture

Dans une seule transaction (la `transaction` du module, comme `SavePeriodeInformationHandler`) :

1. Upsert de chaque motif reçu : création avec `id` et `nom` ; mise à jour du `nom` et de `deleted_at` à NULL. Le `updated_at` de chaque motif écrit avance.
2. Les motifs non supprimés qui manquent dans l'envoi reçoivent `deleted_at` = maintenant.
3. Suppression de toutes les séances, puis insertion des séances reçues.

Les lecteurs (admin, slide-in) voient l'état d'avant ou celui d'après, jamais un état partiel.

Deux appels simultanés : le second peut échouer (clé en double à l'insertion des séances), et copilot le rejoue. Pas de verrou, comme pour les périodes : copilot n'appelle qu'une fois par jour.

Journalisation : `logger.info` en catégorie `formation`, source `open-api/formations`, avec les compteurs ; `logger.warn` sur chaque refus (validation, secret).

## Tables après cette PR

`formation_motif` : `id`, `nom`, `deleted_at` (renommée depuis `date_suppression`), `created_at`, `updated_at`.

- `deleted_at` : le motif manquait dans un envoi de copilot (retiré de RDV-SP, désactivé ou sorti de l'organisation). La colonne suit la convention posée par les périodes en PR 2.
- `updated_at` : le plus récent sert toujours de « date du dernier import » dans l'onglet Séances à venir. Un appel refusé ne le fait pas avancer, ce qui signale la panne.

`formation_seance` : `id`, `motif_id`, `date_debut`, `duree_minutes`, `animateurs` (`text[]`, non nul, vide par défaut), `cancelled_at` (renommée depuis `date_annulation`), `nombre_places_max`, `nombre_inscrits`, `url_inscription`, `created_at`, `updated_at`. La colonne `lieu` est supprimée. `created_at` et `updated_at` valent tous deux la date de l'import, puisque les séances sont rechargées ; ils restent pour suivre la convention des tables `formation_*`.

Migration : une nouvelle migration dans cette PR (renommages, suppression de `lieu`, `animateurs` de `text` vers `text[]` en convertissant les valeurs existantes, qui ne viennent que du seed). Les PR 1 et 2 restent telles qu'elles ont été relues, et les bases locales (test, `pilote_demo`) passent la migration sans recréer les tables.

## Changements côté PILOTE

**Onglet Séances à venir**

- Colonne Lieu retirée ; animateurs affichés séparés par « , » ; recherche sur la formation et les animateurs.
- Statut inchangé : Annulée si `cancelled_at` est renseignée, sinon Complète ou Ouverte.
- Date du dernier import inchangée.

**Onglet Profils**

- Rien à changer, hormis le renommage de `deleted_at`.
- Un motif retiré disparaît des colonnes ; ses cases restent en base et réapparaissent avec lui.
- Un nouveau motif arrive sans aucune case cochée : il n'est proposé à personne tant que l'admin ne l'a pas paramétré.

**Onglet Périodes d'information**

- Tableau : une formation retirée reste citée dans sa période, suivie de « (retirée de RDV-SP) ». `ListPeriodesInformationQuery` renvoie cette information pour chaque motif d'une période.
- Modale : les cases pré-cochées se limitent aux formations disponibles. Une formation retirée disparaît donc d'une période dès qu'on l'enregistre. Si c'était la seule, le message « Au moins une formation » s'affiche : l'admin en choisit une autre ou supprime la période.
- Serveur : `SavePeriodeInformationHandler` refuse une formation retirée en la citant, comme il le fait déjà pour une formation introuvable. `SetMotifProfilHandler` refuse déjà un motif retiré.

**Slide-in (PR 4, à reprendre dans son cadrage)** : ne proposer que des motifs non retirés, et des séances à venir, non annulées, non complètes.

**Seed local et fixtures** : adaptés aux colonnes (renommages, `lieu` retirée, `animateurs` en tableau), sans toucher à la garde anti-tunnel du seed.

## Swagger

Dans `doc/api/pilote-api.yml` :

- un tag « Formations », décrit comme réservé à la synchronisation par copilot (DITP), pas aux ministères ;
- un second schéma de sécurité bearer pour le secret de synchronisation, distinct de `bearerAuth` ;
- le chemin `/formations` en `PUT`, avec le corps, les réponses et un exemple ;
- la description de chaque champ, avec sa source dans RDV-SP (tableau du contrat ci-dessous).

## Contrat avec copilot

Copilot appelle la route une fois par jour, après son chargement RDV-SP, avec l'état complet de l'organisation Campus PILOTE :

- `motifs` : les motifs actifs de l'organisation ouverts à l'inscription des usagers (`bookable_by` à `everyone` ou `agents_and_prescripteurs_and_invited_users`), même sans séance à venir, pour que l'admin puisse les paramétrer à l'avance. Un motif réservé aux agents n'aurait jamais de séance qu'un usager puisse réserver : il n'a rien à faire dans l'admin ;
- `seances` : les séances collectives à venir de ces motifs, annulées comprises, pour que l'admin les voie dans l'onglet Séances à venir.

Copilot ne récupère aujourd'hui que `GET /api/v1/rdvs`, rechargé en entier chaque jour par dlt dans le schéma `rdv_sp`.

| Champ               | Source RDV-SP                 | Comment l'obtenir dans copilot                                                                                                                           |
| ------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `motifs[].id`       | `motif.id`                    | nouvel appel `GET /api/v1/organisations/{organisation_id}/motifs?active=true` (nouvelle ressource dans `sources/rdv_sp/store.py`, même authentification) |
| `motifs[].nom`      | `motif.name`                  | même appel                                                                                                                                               |
| `seances[].id`      | `rdv.id`                      | `stg__rdv_sp_rdvs.id`                                                                                                                                    |
| `motif_id`          | `rdv.motif.id`                | `stg__rdv_sp_rdvs.motif_id`                                                                                                                              |
| `date_debut`        | `rdv.starts_at`               | `stg__rdv_sp_rdvs.starts_at`, déjà en `timestamptz`, à envoyer en ISO 8601                                                                               |
| `duree_minutes`     | `rdv.duration_in_min`         | `stg__rdv_sp_rdvs.duration_in_min`                                                                                                                       |
| `animateurs`        | `rdv.agents[]`, prénom et nom | `int__rdv_sp_organisateurs.organisateurs_nom`, déjà un tableau                                                                                           |
| `cancelled_at`      | `rdv.cancelled_at`            | `stg__rdv_sp_rdvs.cancelled_at`                                                                                                                          |
| `nombre_places_max` | `rdv.max_participants_count`  | colonne brute de `rdv_sp.rdvs`, à extraire dans `stg__rdv_sp_rdvs`                                                                                       |
| `nombre_inscrits`   | `rdv.users_count`             | `stg__rdv_sp_rdvs.users_count`                                                                                                                           |
| `url_inscription`   | aucun                         | à construire : `https://<domaine de url_for_agents>/users/rdv_wizard_step/new?rdv_collectif_id=<id>`                                                     |

Filtres sur les séances envoyées :

- organisation Campus PILOTE (1453 d'après le lien de PIL-1923, à confirmer) ;
- séances collectives (`collectif = true`) ;
- séances à venir (`starts_at` postérieur au moment de l'envoi) ;
- motif présent dans l'envoi, donc ouvert à l'inscription des usagers : sinon le lien d'inscription mène à une erreur.

Lien d'inscription :

- `url_for_agents` (`url_formation` dans le mart `rdv_sp_formations`) est réservé aux agents : ce n'est pas un lien d'inscription.
- Le lien retenu est celui du bouton « S'inscrire » de RDV-SP (vue `search/_rdv_collectif`). RDV-SP retrouve la séance avec le seul `rdv_collectif_id` (`Users::RdvBuilder`). L'usager passe par la connexion RDV-SP avant le formulaire.
- Le domaine dépend de l'organisation (`rdv.anct.gouv.fr` pour Campus PILOTE) : copilot le prend dans `url_for_agents`.
- C'est une route interne de RDV-SP, pas un engagement de son API : à tester sur une vraie séance avant la mise en recette.

À ne jamais envoyer : `visio_url`.

Le secret : à créer pour chaque environnement (recette, prod), dans la variable de PILOTE et dans la configuration de copilot.

## Tests

- Intégration, sur l'écriture :
  - premier envoi : motifs et séances créés ;
  - même envoi rejoué : même état, `created_at` des motifs inchangé ;
  - motif absent : `deleted_at` renseigné, profils et périodes qui le citent conservés ;
  - motif qui revient : `deleted_at` vidé, paramétrage retrouvé ;
  - séances absentes supprimées, séances reçues écrites ;
  - envoi refusé (motifs vides, séance au motif absent, doublon) : rien n'est écrit.
- Unitaire : validation de l'envoi (règles ci-dessus) ; garde du secret (absent, mal formé, faux, non configuré, bon).
- Existants à adapter : `ListSeancesAVenirQuery`, `ListPeriodesInformationQuery` (motif retiré signalé), `SavePeriodeInformationHandler` (motif retiré refusé), `statutSeance`.
- Pas de test client : aucun précédent dans le module.

## Documents à mettre à jour

- Suivi des PR : nouvelle PR 3 (cette synchronisation, base #2708) ; la slide-in passe en PR 4, Matomo en PR 5.
- Design des tables : la partie « Contrat avec copilot » renvoie à ce document, et les points propres à dlt disparaissent (structure des tables, colonnes `_dlt_*`, jobs parallèles, `updated_at` à renseigner par copilot). Les colonnes suivent la section « Tables après cette PR ».
- Hors pile du suivi : la ligne « Écriture des motifs et séances par copilot » renvoie au contrat ci-dessus.

## Laissé à la construction

- Noms du handler, du garde, des schémas zod et du fichier de route.
- Nom exact de la variable d'environnement.
- Libellés exacts des messages d'erreur, en français.
- Une requête Bruno dans `doc/api/testing/bruno`, si elle aide.
- Nom du champ d'annulation côté TypeScript (`cancelledAt` ou `dateAnnulation`).

## Décisions

Décidé par Tristan le 2026-11-19 :

- lien copilot → PILOTE par une route de l'open-api documentée dans le swagger, dans une nouvelle PR avant la slide-in ;
- une route, état complet, upsert des motifs avec retrait des absents, séances rechargées, garde-fous, `deleted_at` sur les motifs, correction de la modale des périodes ;
- secret dédié plutôt que compte de service ;
- colonnes des séances : `lieu` retirée, `animateurs` en tableau, `cancelled_at` ; visio et adresse laissées de côté.

Choix de construction (les miens, à vérifier à la lecture) :

- nouvelle migration dans cette PR, plutôt que modifier celle de la PR 1, comme l'a fait la PR 2 ;
- motifs envoyés limités à ceux ouverts à l'inscription des usagers ;
- liste de motifs vide refusée ;
- pas de verrou contre deux appels simultanés ;
- lien d'inscription construit par copilot, pas par PILOTE ;
- formation retirée signalée « (retirée de RDV-SP) » dans le tableau des périodes ;
- formation retirée refusée à l'enregistrement d'une période.
