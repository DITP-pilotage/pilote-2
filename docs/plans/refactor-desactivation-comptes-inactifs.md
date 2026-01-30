# Plan de refactoring : Script de désactivation des comptes inactifs

Date : 2026-01-30

## Contexte

Le use case actuel `DesactiverComptesInactifsUseCase` effectue toutes les opérations en une seule passe :
recherche des comptes inactifs, envoi des relances et désactivation. Ce fonctionnement monolithique pose plusieurs problèmes :

- **Debugabilité** : en cas d'erreur, il est difficile de savoir quelles actions ont été effectuées et lesquelles ont échoué
- **Reprise sur erreur** : si le script plante en cours d'exécution, il n'y a pas de trace des actions déjà réalisées ni de moyen de reprendre
- **Traçabilité** : aucun historique persisté des actions effectuées

## Décision

Refactorer le script en **3 phases distinctes** avec persistance intermédiaire en base de données, permettant une exécution séquentielle avec reprise sur erreur.

## Nouvelle table : `action_compte_inactif`

Migration Prisma :

```sql
CREATE TYPE type_action_compte_inactif AS ENUM ('PREMIERE_RELANCE', 'DEUXIEME_RELANCE', 'DESACTIVATION');
CREATE TYPE statut_action_compte_inactif AS ENUM ('CREEE', 'SUCCES', 'ERREUR');

CREATE TABLE action_compte_inactif (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id          TEXT NOT NULL,
  type_action             type_action_compte_inactif NOT NULL,
  date_creation           TIMESTAMP NOT NULL DEFAULT NOW(),
  statut                  statut_action_compte_inactif NOT NULL DEFAULT 'CREEE',
  date_succes             TIMESTAMP,
  date_derniere_tentative TIMESTAMP,
  nombre_tentatives       INTEGER NOT NULL DEFAULT 0,
  erreur                  TEXT
);
```

Modèle Prisma :

```prisma
enum type_action_compte_inactif {
  PREMIERE_RELANCE
  DEUXIEME_RELANCE
  DESACTIVATION
}

enum statut_action_compte_inactif {
  CREEE
  SUCCES
  ERREUR
}

model action_compte_inactif {
  id                      String                        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  utilisateur_id          String
  type_action             type_action_compte_inactif
  date_creation           DateTime                      @default(now())
  statut                  statut_action_compte_inactif  @default(CREEE)
  date_succes             DateTime?
  date_derniere_tentative DateTime?
  nombre_tentatives       Int                           @default(0)
  erreur                  String?

  utilisateur utilisateur @relation(fields: [utilisateur_id], references: [id])
}
```

Les types `$Enums.type_action_compte_inactif` et `$Enums.statut_action_compte_inactif` seront utilisés dans le code TypeScript.

## Les 3 phases

### Phase 1 : `CreerLesActionsComptesInactifsUseCase`

**Responsabilité** : Rechercher les comptes inactifs et créer les actions à effectuer en base.

**Logique** :
1. Récupérer l'utilisateur système (`import.csv@modernisation.gouv.fr`)
2. Récupérer les comptes inactifs via `utilisateurRepository.recupererComptesInactifs()`
3. Pour chaque compte, déterminer l'action à effectuer (même logique qu'aujourd'hui) :
   - `dateDesactivationProgramee` atteinte → action `DESACTIVATION`
   - Pas de première relance → action `PREMIERE_RELANCE`
   - 23+ jours après première relance et pas de deuxième → action `DEUXIEME_RELANCE`
   - Sinon → aucune action
4. Persister chaque action en base avec le statut `CREEE` via `actionCompteInactifRepository.sauvegarder()`

**Gestion des erreurs** :
- Erreur avant la boucle de création (ex: récupération des comptes) → **stopper** le script
- Erreur pendant la création d'une action individuelle → **logger l'erreur et continuer** avec les autres actions

**Retour** : nombre d'actions créées par type

**Dépendances** :
- `utilisateurRepository` (existant)
- `actionCompteInactifRepository` (nouveau)

### Phase 2 : `EnvoyerLesRelancesUseCase`

**Responsabilité** : Exécuter les actions de type `PREMIERE_RELANCE` et `DEUXIEME_RELANCE` au statut `CREEE`.

**Logique** :
1. Récupérer les actions de relance au statut `CREEE` via `actionCompteInactifRepository`
2. Pour chaque action :
   - Envoyer l'email via `contactInfoLettresService.envoieUnEmail()`
   - Mettre à jour les dates de relance en base (`mettreAJourDatePremiereRelanceDesactivation` / `mettreAJourDateDeuxiemeRelanceDesactivation`)
   - Pour la deuxième relance : mettre à jour `dateDesactivationProgramee`
   - Passer le statut de l'action à `SUCCES` avec `date_succes` via `actionCompteInactifRepository.sauvegarder()`

**Gestion des erreurs** (par action individuelle) :
- Capturer l'erreur dans le champ `erreur`
- Incrémenter `nombre_tentatives`
- Mettre à jour `date_derniere_tentative`
- Passer le statut à `ERREUR`
- Sauvegarder via `actionCompteInactifRepository.sauvegarder()`
- **Continuer** avec les autres actions

**Dépendances** :
- `actionCompteInactifRepository` (nouveau)
- `utilisateurRepository` (existant)
- `contactInfoLettresService` (existant)

### Phase 3 : `DesactiverLesComptesInactifsUseCase`

**Responsabilité** : Exécuter les actions de type `DESACTIVATION` au statut `CREEE`.

**Logique** :
1. Récupérer les actions de désactivation au statut `CREEE` via `actionCompteInactifRepository`
2. Pour chaque action :
   - Désactiver le compte via `utilisateurRepository.desactiver()`
   - Supprimer le contact Brevo via `contactInfoLettresService.supprimerContact()`
   - Désactiver dans Keycloak via `utilisateurIAMRepository.desactive()`
   - Supprimer les tokens API via `tokenAPIInformationRepository.supprimerTokenAPIInformation()`
   - Passer le statut de l'action à `SUCCES` avec `date_succes` via `actionCompteInactifRepository.sauvegarder()`

**Gestion des erreurs** (par action individuelle) :
- Capturer l'erreur dans le champ `erreur`
- Incrémenter `nombre_tentatives`
- Mettre à jour `date_derniere_tentative`
- Passer le statut à `ERREUR`
- Sauvegarder via `actionCompteInactifRepository.sauvegarder()`
- **Continuer** avec les autres actions

**Dépendances** :
- `actionCompteInactifRepository` (nouveau)
- `utilisateurRepository` (existant)
- `utilisateurIAMRepository` (existant)
- `tokenAPIInformationRepository` (existant)
- `contactInfoLettresService` (existant)

## Nouveau port : `ActionCompteInactifRepository`

```typescript
interface ActionCompteInactifRepository {
  sauvegarder(action: ActionCompteInactif): Promise<void>;

  recupererActionsParTypeEtStatut(
    typesAction: $Enums.type_action_compte_inactif[],
    statut: $Enums.statut_action_compte_inactif,
  ): Promise<ActionCompteInactif[]>;
}
```

La méthode `sauvegarder` effectue un **upsert** : insertion si l'action n'existe pas, mise à jour sinon. Cela simplifie l'interface et permet aux use cases de manipuler un objet `ActionCompteInactif` en mémoire puis de le sauvegarder en une seule opération, que ce soit pour la création initiale ou la mise à jour du statut/erreur.

Implémentation Prisma : `PrismaActionCompteInactifRepository`

## Modification du script

Le script `scripts/desactivationComptesInactifs.ts` exécutera les 3 phases séquentiellement :

```typescript
async function main() {
  const container = /* ... */;

  const resultatCreation = await container
    .resolve("creerLesActionsComptesInactifsUseCase")
    .run();
  logger.info("Phase 1 terminée", resultatCreation);

  const resultatRelances = await container
    .resolve("envoyerLesRelancesUseCase")
    .run();
  logger.info("Phase 2 terminée", resultatRelances);

  const resultatDesactivation = await container
    .resolve("desactiverLesComptesInactifsUseCase")
    .run();
  logger.info("Phase 3 terminée", resultatDesactivation);
}
```

## Fichiers à créer / modifier

### Nouveaux fichiers

| Fichier | Description |
|---|---|
| `src/database/prisma/migrations/xxx_action_compte_inactif/migration.sql` | Migration Prisma |
| `src/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository.ts` | Interface du repository |
| `src/server/gestion-utilisateur/infrastructure/adapters/PrismaActionCompteInactifRepository.ts` | Implémentation Prisma |
| `src/server/gestion-utilisateur/usecases/CreerLesActionsComptesInactifsUseCase.ts` | Phase 1 |
| `src/server/gestion-utilisateur/usecases/EnvoyerLesRelancesUseCase.ts` | Phase 2 |
| `src/server/gestion-utilisateur/usecases/DesactiverLesComptesInactifsUseCase.ts` | Phase 3 |
| `src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsComptesInactifsUseCase.unit.test.ts` | Tests unitaires Phase 1 |
| `src/server/gestion-utilisateur/__tests__/usecases/EnvoyerLesRelancesUseCase.unit.test.ts` | Tests unitaires Phase 2 |
| `src/server/gestion-utilisateur/__tests__/usecases/DesactiverLesComptesInactifsUseCase.unit.test.ts` | Tests unitaires Phase 3 |
| `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/ActionCompteInactifSQLRepository.integration.test.ts` | Tests d'intégration du repository |

### Fichiers à modifier

| Fichier | Description |
|---|---|
| `src/database/prisma/schema.prisma` | Ajout des enums et du modèle `action_compte_inactif` |
| `src/server/gestion-utilisateur/container.ts` | Enregistrement des 3 nouveaux use cases + repository |
| `scripts/desactivationComptesInactifs.ts` | Appel séquentiel des 3 phases |

### Fichiers à supprimer

| Fichier | Description |
|---|---|
| `src/server/gestion-utilisateur/usecases/DesactiverComptesInactifsUseCase.ts` | Ancien use case monolithique |
| `src/server/gestion-utilisateur/__tests__/usecases/DesactiverComptesInactifsUseCase.unit.test.ts` | Anciens tests |

## Plan de tests

### Tests d'intégration : `ActionCompteInactifSQLRepository`

1. `sauvegarder` crée une nouvelle action en base
2. `sauvegarder` met à jour une action existante (upsert)
3. `recupererActionsParTypeEtStatut` retourne les actions filtrées par type et statut
4. `recupererActionsParTypeEtStatut` retourne un tableau vide quand aucune action ne correspond

### Tests unitaires : `CreerLesActionsComptesInactifsUseCase`

1. Crée une action `DESACTIVATION` quand la date de désactivation programmée est atteinte
2. Crée une action `PREMIERE_RELANCE` quand aucune relance n'a été envoyée
3. Crée une action `DEUXIEME_RELANCE` quand 23+ jours après la première relance
4. Ne crée aucune action quand les 23 jours ne sont pas écoulés
5. Crée les bonnes actions pour un mix de comptes dans des états différents
6. Continue la création des autres actions si une erreur survient sur une action individuelle
7. Stoppe si la récupération des comptes inactifs échoue

### Tests unitaires : `EnvoyerLesRelancesUseCase`

1. Envoie un email J-30 et met à jour la date de première relance pour une action `PREMIERE_RELANCE`
2. Envoie un email J-7, met à jour la date de deuxième relance et la date de désactivation programmée pour une action `DEUXIEME_RELANCE`
3. Marque l'action en `SUCCES` après envoi réussi
4. Marque l'action en `ERREUR` avec capture de l'erreur en cas d'échec d'envoi
5. Continue avec les autres actions malgré une erreur individuelle
6. Incrémente le nombre de tentatives et met à jour la date de dernière tentative en cas d'erreur

### Tests unitaires : `DesactiverLesComptesInactifsUseCase`

1. Désactive le compte, supprime le contact Brevo, désactive dans Keycloak, supprime les tokens API
2. Marque l'action en `SUCCES` après désactivation réussie
3. Marque l'action en `ERREUR` avec capture de l'erreur en cas d'échec
4. Continue avec les autres actions malgré une erreur individuelle
5. Incrémente le nombre de tentatives et met à jour la date de dernière tentative en cas d'erreur

## Ordre d'implémentation

1. Migration Prisma + enums + modèle `action_compte_inactif`
2. Port `ActionCompteInactifRepository` + implémentation `PrismaActionCompteInactifRepository` + tests d'intégration
3. `CreerLesActionsComptesInactifsUseCase` + tests unitaires
4. `EnvoyerLesRelancesUseCase` + tests unitaires
5. `DesactiverLesComptesInactifsUseCase` + tests unitaires
6. Enregistrement dans le container
7. Modification du script
8. Suppression de l'ancien use case et ses tests
