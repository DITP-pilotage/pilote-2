# Spec — Rapport hebdomadaire des responsables de données (CH-197)

Date : 2026-07-29

## Contexte

Le rapport PVA existant notifie chaque semaine les équipes de direction de projet sur l'état de leurs indicateurs (propositions en attente, indicateurs non à jour, indicateurs à paramétrer). Il n'existe pas aujourd'hui de canal de notification vers les **responsables de la donnée** (`responsables_donnees_mails` sur `indicateur_identite`).

Ce rapport cible en particulier le chantier **CH-197**, dont les indicateurs ont des responsables de données identifiés. L'objectif est de notifier chaque responsable uniquement sur les indicateurs qui lui sont assignés et qui sont en retard de mise à jour.

---

## Périmètre fonctionnel

### Conditions de déclenchement

Un rapport est créé pour un responsable si, sur CH-197, **au moins un de ses indicateurs** vérifie :

- `est_a_jour IS FALSE` **ou** `est_a_jour IS NULL`
- `est_applicable = TRUE`
- `statut` de l'indicateur = `PUBLIE` ou `BROUILLON`
- `statut` du chantier = `PUBLIE` ou `BROUILLON`

C'est la même logique que `recupererIndicateursNonAJourParChantierId`, filtrée sur CH-197 avec un périmètre de statuts élargi.

### Destinataires

- Les adresses listées dans `responsables_donnees_mails` des indicateurs concernés.
- Ces emails proviennent du dépôt externe **PPG_metadata** (champ `resp_donnees_email`), chargé via dlt dans `raw_data.metadata_indicateurs_complementaire`. Ce ne sont **pas** nécessairement des utilisateurs de l'application Pilote.
- **Un email par adresse** : si un responsable est listé sur plusieurs indicateurs non à jour, il reçoit un seul email consolidant tous ses indicateurs.
- Si `responsables_donnees_mails` est vide pour un indicateur non à jour → log `warn`, aucun email envoyé pour cet indicateur.

### Contenu de l'email

Réutilisation du **template Brevo ID 4** (template PVA existant), avec uniquement la section "indicateurs non mis à jour" activée :

```
afficherSectionPropositions   = false
afficherSectionMajIndicateur  = true   ← seule section visible
afficherSectionParametrage    = false
```

Le paramètre `chantiers` contiendra un seul élément (CH-197). La structure `ChantierRapport` est réutilisée telle quelle, avec `indicateursNonMisAJour` limités aux indicateurs dont ce responsable est propriétaire.

Les champs inutilisés (`nombre_propositions`, `conseiller_email`, `indicateursPropositions`, `indicateursAParametrer`, `nombreIndicateursAParametrer`) sont passés avec leurs valeurs vides/par défaut pour rester compatibles avec le template.

---

## Architecture technique

### Nouveau fichier : cron endpoint

**`src/pages/api/admin/cron/rapports-responsables-donnees.ts`**

- Même structure que `rapports-pva.ts`
- Feature flag : `NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES`
- Guard : `scalingoEnvironment === "PROD"` (sauf `force=true`)
- Phase 1 : `creerLesRapportsResponsablesDonneesUseCase.run()`
- Phase 2 : `envoyerLesRapportsResponsablesDonneesUseCase.run()`
- Notification Tchap : même salle que le rapport PVA (`roomIdRapportPva`)
- Résolution via `getContainer("chantiers")`

### Nouveau modèle de domaine

**`src/server/chantiers/domain/RapportResponsableDonnees.ts`**

```typescript
export interface RapportResponsableDonnees {
  id: string;
  emailResponsable: string;       // pas de FK utilisateur (emails externes issus de PPG_metadata)
  contenuRapport: ContenuRapport; // réutilise ContenuRapport de RapportPropositionsAvancement.ts
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreurEnvoi: string | null;
}
```

Factory functions : `creerRapportResponsableDonnees`, `marquerRapportCommeEnvoye`, `marquerRapportCommeEchec` — même pattern que `RapportPropositionsAvancement`.

### Nouvelle table Prisma

**`rapport_responsable_donnees`** (schema `public`)

```prisma
model rapport_responsable_donnees {
  id                      String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email_responsable       String
  contenu_rapport         Json
  statut_envoi            statut_envoi_rapport @default(CREE)
  date_creation           DateTime             @default(now())
  date_envoi              DateTime?
  date_derniere_tentative DateTime?
  nombre_tentatives       Int                  @default(0)
  erreur_envoi            String?

  @@index([statut_envoi])
  @@index([email_responsable])
  @@schema("public")
}
```

Pas de FK vers `utilisateur` : les responsables de données sont des emails externes (source : PPG_metadata GitHub).

### Nouveau port repository

**`src/server/chantiers/domain/ports/RapportResponsableDonneesRepository.ts`**

```typescript
export interface RapportResponsableDonneesRepository {
  sauvegarder(rapport: RapportResponsableDonnees): Promise<void>;
  recupererRapportsParStatut(statut: $Enums.statut_envoi_rapport): Promise<RapportResponsableDonnees[]>;
}
```

### Nouveau repository Prisma

**`src/server/chantiers/infrastructure/adapters/PrismaRapportResponsableDonneesRepository.ts`**

Même pattern que `PrismaRapportPropositionsAvancementRepository`.

### Nouvelle méthode sur IndicateurRepository

**Port** (`src/server/chantiers/domain/ports/IndicateurRepository.ts`) :

```typescript
recupererIndicateursNonAJourAvecResponsablesDonneesPourChantierId(
  chantierId: string
): Promise<{ id: string; nom: string; mailles: string[]; responsablesDonneesMails: string[] }[]>
```

**Implémentation** (`PrismaIndicateurRepository`) :

Variante de `recupererIndicateursNonAJourParChantierId` avec trois différences :
1. Filtre `chantier_id = chantierId` (paramètre)
2. Inclut `statut IN ('PUBLIE', 'BROUILLON')` pour l'indicateur et le chantier (au lieu de `PUBLIE` uniquement)
3. Sélectionne `responsables_donnees_mails` depuis `indicateur_identite`

### Nouveau use case : création

**`src/server/chantiers/usecases/CreerLesRapportsResponsablesDonneesUseCase.ts`**

```
Algorithme :
1. Appeler recupererIndicateursNonAJourAvecResponsablesDonneesPourChantierId("CH-197")
2. Si liste vide → retourner { rapportsCrees: 0, erreursCreation: 0 }
3. Récupérer les infos du chantier CH-197 via chantierRepository
4. Construire une Map<emailResponsable, indicateur[]> (groupement)
   - Pour chaque indicateur :
     - Si responsablesDonneesMails vide → logger.warn + skip
     - Sinon, ajouter l'indicateur à la liste de chaque responsable
5. Pour chaque responsable :
   - Construire le ContenuRapport (template 4, section maj uniquement)
   - Créer et persister le rapport (statut CREE)
6. Retourner { rapportsCrees, erreursCreation }
```

### Nouveau use case : envoi

**`src/server/chantiers/usecases/EnvoyerLesRapportsResponsablesDonneesUseCase.ts`**

Même structure qu'`EnvoyerLesRapportsPropositionsUseCase` :
- Récupère les rapports `CREE` via `rapportResponsableDonneesRepository`
- Envoie avec `TEMPLATE_ID_RAPPORT_PROPOSITIONS = 4`
- `destinataire` = `rapport.emailResponsable` (pas `rapport.utilisateur.email`)
- Marque `ENVOYE` ou `ECHEC` selon résultat

### Construction du ContenuRapport

Nouvelle fonction utilitaire (dans `ParametresEnvoieEmailRapportProposition.ts` ou fichier dédié) :

```typescript
export const genererParametresRapportResponsableDonnees = (
  chantierInfo: { id: string; nom: string; conseillerMail: string },
  indicateurs: { id: string; nom: string; mailles: string[] }[],
): ContenuRapport
```

Produit un `ContenuRapport` avec :
- `chantiers` : un seul `ChantierRapport` pour CH-197
  - `afficherSectionMajIndicateur: true`
  - `indicateursNonMisAJour` : les indicateurs filtrés pour ce responsable
  - `afficherSectionPropositions: false`, `afficherSectionParametrage: false`
  - `indicateursPropositions: []`, `indicateursAParametrer: []`
  - `nombre_propositions: ""`, `nombreIndicateursAParametrer: ""`
- `texteIntro: "votre chantier prioritaire"`
- `conseillerEmail: chantierInfo.conseillerMail`

### Enregistrement dans le container

**`src/server/chantiers/module.ts`** — ajouter au `register` :

```typescript
rapportResponsableDonneesRepository: asModuleClass(PrismaRapportResponsableDonneesRepository),
creerLesRapportsResponsablesDonneesUseCase: asModuleClass(CreerLesRapportsResponsablesDonneesUseCase),
envoyerLesRapportsResponsablesDonneesUseCase: asModuleClass(EnvoyerLesRapportsResponsablesDonneesUseCase),
```

---

## Cas limites

| Cas | Comportement |
|-----|-------------|
| `responsables_donnees_mails = []` sur un indicateur non à jour | `logger.warn` avec l'id de l'indicateur, indicateur ignoré |
| Aucun indicateur non à jour sur CH-197 | Aucun rapport créé, cron retourne `{ skipped: false, rapportsCrees: 0 }` |
| Même email responsable de plusieurs indicateurs | Un seul email consolidé avec tous ses indicateurs |
| Erreur Brevo sur un email | Rapport marqué `ECHEC`, les autres continuent, email listé dans `emailsEnEchec` du résumé Tchap |
| Feature flag désactivé hors PROD | `{ skipped: true, reason: "..." }` 200 OK |

---

## Fichiers à créer / modifier

### Créer

| Fichier | Nature |
|---------|--------|
| `src/pages/api/admin/cron/rapports-responsables-donnees.ts` | Cron endpoint |
| `src/server/chantiers/domain/RapportResponsableDonnees.ts` | Modèle domaine |
| `src/server/chantiers/domain/ports/RapportResponsableDonneesRepository.ts` | Port |
| `src/server/chantiers/infrastructure/adapters/PrismaRapportResponsableDonneesRepository.ts` | Adapter |
| `src/server/chantiers/usecases/CreerLesRapportsResponsablesDonneesUseCase.ts` | Use case |
| `src/server/chantiers/usecases/EnvoyerLesRapportsResponsablesDonneesUseCase.ts` | Use case |
| Migration Prisma pour `rapport_responsable_donnees` | DB |

### Modifier

| Fichier | Changement |
|---------|-----------|
| `src/server/chantiers/domain/ports/IndicateurRepository.ts` | Ajouter `recupererIndicateursNonAJourAvecResponsablesDonneesPourChantierId` |
| `src/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository.ts` | Implémenter la nouvelle méthode |
| `src/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition.ts` | Ajouter `genererParametresRapportResponsableDonnees` |
| `src/server/chantiers/module.ts` | Enregistrer les 3 nouveaux composants |
| `src/config.ts` | Ajouter `NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES` |

---

## Tests à écrire

- **Unit** : `CreerLesRapportsResponsablesDonneesUseCase` — cas nominal, indicateur sans responsable, aucun indicateur non à jour
- **Unit** : `EnvoyerLesRapportsResponsablesDonneesUseCase` — envoi réussi, échec Brevo
- **Unit** : `genererParametresRapportResponsableDonnees` — structure du ContenuRapport produit
- **Integration** : `PrismaIndicateurRepository#recupererIndicateursNonAJourAvecResponsablesDonneesPourChantierId`
- **Integration** : `PrismaRapportResponsableDonneesRepository`

---

## Ce qui est hors périmètre

- Retry automatique des rapports en `ECHEC`
- Généralisation à d'autres chantiers que CH-197
- Nouveau template Brevo (réutilisation du template 4)
- Interface admin pour consulter les rapports envoyés
