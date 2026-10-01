# Expiration des mots de passe des comptes DITP_ADMIN

Date : 2026-10-01

## Objectif

Conformément aux recommandations de l'ANSSI et de la CNIL sur les accès
sensibles, les comptes de profil `DITP_ADMIN` doivent renouveler leur mot de
passe tous les 6 mois. L'administrateur est prévenu par email 30 jours avant,
7 jours avant et le jour de l'expiration. L'ancien mot de passe ne peut pas être
réutilisé.

Hors du périmètre de cette spec, traités dans une PR ultérieure :

- le journal d'audit des changements de mot de passe (horodatage, identifiant
  utilisateur, succès ou échec) ;
- le rapport consultable par les administrateurs de la sécurité (comptes
  expirés, comptes ayant renouvelé).

Le modèle de données est conçu pour les servir sans modification (voir
« Suites »).

## Conventions de nommage

Le métier est nommé en français, le technique en anglais. `password` est
considéré comme technique : les tables, enums, types et fonctions utilisent
`password`, les textes destinés aux utilisateurs disent « mot de passe ».

## Contexte et contraintes

- PILOTE ne stocke aucun mot de passe. Les mots de passe vivent dans Keycloak
  (realm `DITP`). PILOTE y accède uniquement par l'admin client
  (`UtilisateurIAMKeycloakRepository`).
- Certains utilisateurs se connectent par ProConnect, sans mot de passe PILOTE.
  Un `DITP_ADMIN` sans credential mot de passe dans Keycloak n'est pas soumis
  au cycle.
- Les politiques de mot de passe Keycloak s'appliquent à tout le realm. Le
  cycle de 6 mois ne doit concerner que les `DITP_ADMIN` : il est donc piloté
  par PILOTE, et non par la politique « Expire Password » de Keycloak.
- Le mécanisme de désactivation des comptes inactifs (`action_compte_inactif`,
  trois use cases, endpoint `cron/desactivation-comptes`, ADR 0006) est le
  modèle à suivre.

## Décision d'ensemble

Répartition des responsabilités :

| Responsabilité | Porté par |
|---|---|
| Stockage et vérification du mot de passe | Keycloak |
| Interdiction de réutiliser l'ancien mot de passe | Keycloak, politique « Not Recently Used » |
| Date de dernier changement, date d'expiration, cycle à 6 mois | PILOTE, table `suivi_password_admin` |
| Relances J-30, J-7, J0 | PILOTE, cron quotidien + Brevo |
| Forçage du changement à l'expiration | PILOTE, via l'admin API Keycloak |

La base PILOTE est la source du cycle. Keycloak ne fait qu'alimenter la date
de dernier changement, lue une fois par jour par le cron. Il n'y a pas de
synchronisation à la connexion.

À l'expiration, le compte n'est pas bloqué : l'utilisateur est forcé de définir
un nouveau mot de passe à sa prochaine connexion, et ses sessions Keycloak en
cours sont révoquées.

## Modèle de données

Deux nouvelles tables dans le schéma `public`. Aucune colonne n'est ajoutée à
`utilisateur`.

### `suivi_password_admin`

Une ligne par utilisateur soumis au cycle.

| Colonne | Type | Rôle |
|---|---|---|
| `utilisateur_id` | uuid, clé primaire, FK `utilisateur.id` (cascade) | |
| `date_dernier_changement` | timestamp | Date de création du credential `password` lue dans Keycloak |
| `date_expiration` | timestamp | Stockée, pas recalculée (voir « Transition au déploiement ») |
| `date_premiere_relance` | timestamp nullable | Date d'envoi de la relance J-30 du cycle courant |
| `date_deuxieme_relance` | timestamp nullable | Date d'envoi de la relance J-7 du cycle courant |
| `date_expiration_forcee` | timestamp nullable | Date à laquelle le changement a été forcé dans Keycloak |

### `action_password`

Même forme que `action_compte_inactif`.

| Colonne | Type |
|---|---|
| `id` | uuid, clé primaire |
| `utilisateur_id` | uuid |
| `type_action` | enum `type_action_password` : `PREMIERE_RELANCE`, `DEUXIEME_RELANCE`, `EXPIRATION` |
| `date_creation` | timestamp |
| `statut` | enum `statut_action_password` : `CREEE`, `SUCCES`, `ECHEC` |
| `date_succes` | timestamp nullable |
| `date_derniere_tentative` | timestamp nullable |
| `nombre_tentatives` | int, défaut 0 |
| `erreur` | text nullable |

Les enums existants de `action_compte_inactif` ne sont pas réutilisés : leur
nom est spécifique à l'inactivité, et les deux cycles doivent pouvoir évoluer
indépendamment.

## Domaine

Nouveaux fichiers dans `src/server/gestion-utilisateur/domain/`.

### `SuiviPasswordAdmin.ts`

Interface `SuiviPasswordAdmin` reflétant la table, et fonctions pures :

- `DUREE_VALIDITE_PASSWORD = { months: 6 }`,
  `DELAI_TRANSITION = { days: 30 }`, `DELAI_PREMIERE_RELANCE = { days: 30 }`,
  `DELAI_DEUXIEME_RELANCE = { days: 7 }`. Calculs de dates avec luxon.
- `calculerDateExpiration({ dateDernierChangement, aujourdHui })` :
  `dateDernierChangement + 6 mois`, remontée à `aujourdHui + 30 jours` si
  elle est antérieure à cette borne.
- `initSuivi({ utilisateurId, dateDernierChangement, aujourdHui })` :
  nouvelle ligne avec `date_expiration` calculée par la règle ci-dessus, dates
  de relance et d'expiration forcée à `null`.
- `saveNewPassword({ suivi, dateDernierChangement, aujourdHui })` : retourne
  le suivi avec la nouvelle date, `date_expiration` calculée par
  `calculerDateExpiration` (la borne de 30 jours est sans effet ici puisque la
  date est récente, mais un seul calcul évite deux règles), et les dates de
  relance et d'expiration forcée remises à `null`.
- `determinerTypeAction({ suivi, aujourdHui })` renvoie, dans cet ordre :
  - `EXPIRATION` si `aujourdHui >= date_expiration` et
    `date_expiration_forcee` est `null` ;
  - `DEUXIEME_RELANCE` si `aujourdHui >= date_expiration - 7 jours` et
    `date_deuxieme_relance` est `null` ;
  - `PREMIERE_RELANCE` si `aujourdHui >= date_expiration - 30 jours` et
    `date_premiere_relance` est `null` ;
  - `null` sinon.

  Après l'expiration forcée, aucune nouvelle action tant que le mot de passe
  n'a pas changé : pas de relance répétée.

### `ActionPassword.ts`

Copie de `ActionCompteInactif.ts` avec les nouveaux enums :
`creerActionPassword`, `marquerCommeSucces`, `marquerCommeEchec`.

### Ports (`domain/ports/`)

- `SuiviPasswordAdminRepository` :
  `recupererParUtilisateur(utilisateurId)`, `sauvegarder(suivi)`,
  `recupererDesComptesActifsParProfil(profilCode)` (un suivi de compte
  désactivé ou rétrogradé n'est plus considéré).
- `ActionPasswordRepository` : `sauvegarder(action)`,
  `recupererActionsParTypeEtStatut({ typesAction, statut })`,
  `annulerActionsEnAttente(utilisateurId)` (passe les actions `CREEE` de
  l'utilisateur en `ECHEC` avec l'erreur « Annulée : mot de passe changé »).
- `UtilisateurRepository`, deux méthodes ajoutées :
  `recupererComptesActifsParProfil(profilCode)` renvoyant `{ id, email }[]`,
  et `estActif(utilisateurId): Promise<boolean>`. La phase 3 retrouve l'email
  à partir de l'id avec `recupererUtilisateurEmail` qui existe déjà.
- `UtilisateurIAMRepository`, deux méthodes ajoutées :
  - `recupererDateDernierChangementPassword(email): Promise<Date | null>` :
    `users.find` exact sur l'email puis `users.getCredentials` ; renvoie la
    `createdDate` du credential de type `password`, `null` si l'utilisateur
    ou le credential n'existe pas.
  - `forcerChangementPassword(email): Promise<void>` : `users.update` en
    ajoutant `UPDATE_PASSWORD` aux `requiredActions` existantes (sans écraser
    les autres), puis `users.logout` pour révoquer les sessions.

## Use cases

Trois use cases dans `src/server/gestion-utilisateur/usecases/`, enregistrés
dans `module.ts`, chacun avec un résultat chiffré pour les logs et la réponse
HTTP. Les erreurs sont traitées par utilisateur : une erreur Keycloak sur un
compte n'interrompt pas le traitement des autres.

### Phase 1 : `SynchroniserLesSuivisPasswordAdminUseCase`

Pour chaque compte actif de profil `DITP_ADMIN` :

1. Lire la date du dernier changement dans Keycloak.
   - `null` : l'utilisateur n'est pas soumis. S'il existait une ligne de
     suivi, elle est conservée telle quelle (le cas est loggué en `warn`).
     Compteur `comptesNonSoumis`.
2. Pas de ligne de suivi : `initSuivi`, sauvegarde. Compteur
   `suivisInitialises`.
3. Ligne existante et date différente : `saveNewPassword`, sauvegarde,
   `annulerActionsEnAttente`. Compteur `changementsDetectes`.

Résultat : `{ suivisInitialises, changementsDetectes, comptesNonSoumis, erreurs }`.

### Phase 2 : `CreerLesActionsPasswordUseCase`

Pour chaque ligne de suivi d'un compte actif `DITP_ADMIN`, `determinerTypeAction`. Si une action est
déterminée et qu'aucune action `CREEE` du même type n'existe déjà pour
l'utilisateur, créer l'action. Résultat :
`{ actionsPremiereRelance, actionsDeuxiemeRelance, actionsExpiration }`.

Une action en `ECHEC` ne bloque pas : le lendemain, la date de relance étant
toujours `null`, une nouvelle action est créée. C'est le rejeu quotidien du
mécanisme existant.

### Phase 3 : `ExecuterLesActionsPasswordUseCase`

Pour chaque action `CREEE`, dans l'ordre `EXPIRATION`, `DEUXIEME_RELANCE`,
`PREMIERE_RELANCE` :

- `PREMIERE_RELANCE` et `DEUXIEME_RELANCE` : email Brevo au compte avec les
  paramètres `joursAvantExpiration` (30 ou 7) et `dateExpiration` (format
  `dd/MM/yyyy`), puis `date_premiere_relance` ou `date_deuxieme_relance` à
  maintenant.
- `EXPIRATION` : `forcerChangementPassword`, puis email Brevo J0 avec
  `joursAvantExpiration: 0`, puis `date_expiration_forcee` à maintenant.
- En cas d'erreur : action en `ECHEC` avec le message d'erreur.
- Garde d'obsolescence : avant d'agir, la phase 3 revérifie que
  `determinerTypeAction` donnerait encore ce type d'action pour le suivi
  courant. Sinon (mot de passe changé entre-temps, relance déjà posée par un
  passage interrompu), l'action est écartée en `ECHEC` « Action obsolète »
  sans compter d'erreur. La phase 3 est ainsi idempotente.

Un seul template Brevo pour les trois emails, identifié par la variable
d'environnement `BREVO_TEMPLATE_EXPIRATION_PASSWORD_ID`
(`configuration().brevo.templateExpirationPasswordId`). Tant qu'elle vaut 0,
la phase 3 refuse de s'exécuter (fail-fast) : forcer un mot de passe sans
pouvoir prévenir serait pire que ne rien faire. Le template distingue les trois
cas sur `joursAvantExpiration`.
Il indique que le changement se fait dans Keycloak lors de la connexion à
PILOTE.

Résultat : `{ premieresRelancesEnvoyees, deuxiemesRelancesEnvoyees, expirationsForcees, erreurs }`.

## Endpoint cron

`src/pages/api/admin/cron/expiration-password-admin.ts`, protégé par
`onlyCron`, sur le modèle de `desactivation-comptes.ts` :

- Répond `skipped` si l'environnement n'est pas `PROD` ou si le feature flip
  `NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN` (défaut `false`, enregistré dans
  le registre des flips et lu via `recupererFeatureFlipsUseCase`, donc
  pilotable depuis l'admin) est désactivé.
- Enchaîne les trois phases, logge chaque résultat en catégorie `utilisateur`
  avec `source: "cron/expiration-password-admin"`, renvoie les trois résultats
  en JSON.
- Message Tchap uniquement en cas d'erreur globale (exception non rattrapée)
  ou si `erreurs > 0`, dans le salon `roomIdDesactivationComptes` existant.
  Pas de bilan Tchap quotidien.

Entrée ajoutée dans `cron.json` : exécution quotidienne à 16h15, après la
désactivation des comptes (15h45) pour ne pas relancer un compte en cours de
désactivation.

## Transition au déploiement

Au premier passage, tous les mots de passe existants ont vraisemblablement
plus de 6 mois. La règle de `calculerDateExpiration` (expiration jamais à moins
de 30 jours lors de l'initialisation) fait que chaque `DITP_ADMIN` reçoit la
première relance dès le premier jour, puis la deuxième à J-7, puis l'expiration
forcée 30 jours après l'activation. Aucun compte n'est forcé sans préavis.

## Configuration Keycloak (manuelle, hors code)

À réaliser dans l'admin console du realm `DITP` avant d'activer le feature
flip. Documenté dans l'ADR :

- Politique de mot de passe « Not Recently Used » à 3.
- Le client `IMPORT_CLIENT_ID` doit disposer des rôles `view-users` et
  `manage-users` sur le realm (lecture des credentials, mise à jour des
  actions requises, révocation des sessions).

## Gestion des erreurs

- Keycloak injoignable en phase 1 : chaque compte compte une erreur, aucun
  suivi n'est modifié, les phases 2 et 3 s'exécutent sur l'état précédent.
- Échec d'envoi Brevo ou d'appel Keycloak en phase 3 : action en `ECHEC`,
  rejeu le lendemain.
- `forcerChangementPassword` réussi mais email J0 en échec : l'action est en
  `ECHEC` et sera rejouée. L'appel Keycloak est idempotent (l'action requise
  est déjà présente, le logout d'un utilisateur sans session est sans effet),
  le rejeu renvoie seulement l'email.
- Utilisateur désactivé entre deux phases : la phase 1 ne le sélectionne plus,
  mais une action `CREEE` existante serait exécutée. La phase 3 vérifie avec
  `estActif` que le compte est toujours actif avant d'agir, sinon marque
  l'action en `ECHEC` avec « Compte désactivé ».

## Tests

- Unitaires, domaine : `calculerDateExpiration` (cas nominal, cas de
  transition, cas limite exactement 30 jours), `determinerTypeAction` (chaque
  seuil, priorité expiration > deuxième relance > première relance, aucune
  action après expiration forcée, aucune action quand les dates sont déjà
  posées).
- Unitaires, use cases : les trois use cases avec des doubles en mémoire des
  repositories et du service email, comme
  `CreerLesActionsComptesInactifsUseCase.unit.test.ts` et
  `EnvoyerLesRelancesUseCase.unit.test.ts`. Cas couverts : initialisation,
  détection d'un changement avec annulation des actions en attente, compte non
  soumis, idempotence de la création d'actions, exécution réussie et en échec
  de chaque type d'action, compte désactivé entre deux phases.
- Intégration Prisma : les deux nouveaux repositories, en particulier
  `annulerActionsEnAttente` et `recupererComptesActifsParProfil`.
- Unitaire, endpoint : `skipped` hors PROD et flip désactivé, enchaînement des
  trois phases, message Tchap uniquement sur erreur.
- Pas de test automatisé contre Keycloak : l'adaptateur est couvert par une
  vérification manuelle en recette, comme les méthodes existantes.
- Tests e2e : à proposer à l'utilisateur en fin d'implémentation.

## Documentation

- ADR `docs/architecture/decisions/0010-expiration-des-mots-de-passe-ditp-admin.md`,
  en français, structure de l'ADR 0001 : contexte (exigences ANSSI/CNIL,
  Keycloak source des mots de passe), décision (répartition
  Keycloak / PILOTE, cycle piloté par la base PILOTE, pas de blocage, règle de
  transition), conséquences (configuration Keycloak manuelle, journal et
  rapport reportés).
- `.env.example` : nouveau feature flip.

## Suites (hors périmètre)

- Journal d'audit des changements de mot de passe : table dédiée, jamais
  purgée, sans clé étrangère vers `utilisateur`, alimentée par la phase 1
  (changements détectés, échecs lus dans les événements Keycloak
  `UPDATE_PASSWORD_ERROR`) et la phase 3 (relances, expiration forcée). Il
  faudra alors activer l'enregistrement des événements dans Keycloak et donner
  le rôle `view-events` au client d'import.
- Page admin `/admin/securite/mots-de-passe` réservée aux `DITP_ADMIN` :
  liste des comptes avec statut (`À jour`, `Expire dans moins de 30 jours`,
  `Expiré`, `Non soumis`) et journal filtrable. La table
  `suivi_password_admin` est prévue pour la servir sans migration.
- Extension du périmètre à d'autres profils : il suffit de paramétrer la liste
  des profils soumis dans la phase 1.
