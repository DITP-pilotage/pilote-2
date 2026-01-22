# PRD - Rapports Hebdomadaires pour Coordinateurs

## Vue d'ensemble

Système d'envoi automatique de rapports hebdomadaires par email aux coordinateurs de régions et départements, résumant l'activité de gestion des comptes sur leur territoire.

## Objectifs

- Informer les coordinateurs de l'activité dans leur périmètre territorial
- Automatiser la communication des changements de comptes (création/désactivation)
- Fournir une visibilité hebdomadaire sur la gestion des utilisateurs

**Vision long terme** : enrichir le rapport avec d'autres sections métier
- Suivi des chantiers : évolution des valeurs d'avancement (VA), valeurs initiales (VI), valeurs cibles (VC)
- Autres indicateurs de performance territoriale

## Périmètre de la V1

### Section unique : Activité de gestion des comptes

Deux listes dans chaque rapport :
1. **Comptes créés** - Liste des comptes créés dans la période
2. **Comptes désactivés** - Liste des comptes désactivés dans la période

### Profils concernés

**Destinataires des rapports** : tous les utilisateurs avec profil
- `COORDINATEUR_REGION`
- `COORDINATEUR_DEPARTEMENT`

**Comptes tracés dans les rapports** : uniquement les profils
- `COORDINATEUR_REGION` / `COORDINATEUR_DEPARTEMENT`
- `PREFET_REGION` / `PREFET_DEPARTEMENT`
- `SERVICES_DECONCENTRES_REGION` / `SERVICES_DECONCENTRES_DEPARTEMENT`

### Périmètre territorial

- **COORDINATEUR_REGION** : reçoit les comptes créés/désactivés dans sa région ET dans tous les départements enfants
- **COORDINATEUR_DEPARTEMENT** : reçoit uniquement les comptes de son département

### Période de rapport

- **Début** : Lundi précédent à 09:00:01
- **Fin** : Moment d'exécution du script
- **Timezone** : Europe/Paris

### Règle d'envoi

- Si aucune activité (0 compte créé ET 0 compte désactivé) → **ne pas envoyer d'email**
- Sinon → envoyer le rapport

## Architecture technique

### Bounded Context : `rapports-hebdomadaires`

Nouveau contexte indépendant qui consomme les autres contextes via des gateways (adapters mappant les queries externes vers le domaine interne).

**Pattern architectural** : Functional Core / Imperative Shell
- **Functional Core (domain/)** : logique métier pure, sans effets de bord
- **Imperative Shell (infrastructure/)** : gestion des effets de bord (DB, email, autres contexts)

**Pattern d'exécution** : Two-Phase Processing (résistance aux échecs)
1. **Phase 1 - Production** : Créer tous les rapports et les persister en DB
2. **Phase 2 - Envoi** : Envoyer les emails et tracker le statut (continuer même en cas d'échec)

Avantages :
- Résilience : un échec d'envoi n'empêche pas les autres
- Traçabilité : historique complet des rapports générés
- Rejeu : possibilité de renvoyer un rapport en échec
- Observabilité : suivi du taux de succès/échec

#### Structure de fichiers

```
src/server/rapports-hebdomadaires/
├── domain/
│   ├── RapportHebdomadaire.ts          # Type + fonctions pures
│   ├── StatutEnvoi.ts                  # Enum statut (CREE, ENVOYE, ECHEC)
│   ├── SectionActiviteComptes.ts       # Type
│   ├── CompteActivite.ts               # Type
│   ├── Coordinateur.ts                 # Type + fonctions pures
│   ├── PeriodeRapport.ts               # Type + fonctions pures
│   └── ports/
│       ├── ActiviteComptesGateway.ts   # Interface (args objets, return domain types)
│       ├── CoordinateurGateway.ts      # Interface (args objets, return domain types)
│       ├── RapportRepository.ts        # Interface pour persister les rapports
│       └── EnvoieEmailService.ts       # Interface (args objets, return primitives)
├── usecases/
│   ├── ProduireRapportsHebdomadairesUseCase.ts      # Phase 1 : Crée + persiste
│   └── EnvoyerRapportsHebdomadairesUseCase.ts       # Phase 2 : Envoie + track status
├── infrastructure/
│   └── adapters/
│       ├── GestionUtilisateurActiviteComptesGateway.ts  # Adapte PrismaActiviteComptesQuery
│       ├── PrismaCoordinateurGateway.ts                 # Implémente CoordinateurGateway
│       ├── PrismaRapportRepository.ts                   # Implémente RapportRepository
│       └── BrevoEnvoieEmailService.ts                   # Implémente EnvoieEmailService
├── container.ts
└── __tests__/
    └── usecases/
        ├── ProduireRapportsHebdomadairesUseCase.integration.test.ts
        └── EnvoyerRapportsHebdomadairesUseCase.integration.test.ts
```

#### Schéma de base de données

Table pour persister les rapports avant envoi (résilience et traçabilité).

```prisma
enum statut_envoi_rapport {
  CREE      // Rapport créé, pas encore envoyé
  ENVOYE    // Email envoyé avec succès
  ECHEC     // Échec d'envoi (à rejouer)

  @@schema("public")
}

model rapport_hebdomadaire_coordinateur {
  id                        String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  coordinateur_id           String                    @db.Uuid
  coordinateur_email        String
  coordinateur_nom          String
  coordinateur_prenom       String
  coordinateur_profil       String
  territoire_code           String
  territoire_nom            String
  date_debut_periode        DateTime
  date_fin_periode          DateTime
  comptes_crees             Json                      // Array de CompteActivite
  comptes_desactives        Json                      // Array de CompteActivite
  statut_envoi              statut_envoi_rapport      @default(CREE)
  date_creation             DateTime                  @default(now())
  date_envoi                DateTime?                 // Date d'envoi réussi
  date_derniere_tentative   DateTime?                 // Date de la dernière tentative d'envoi
  nombre_tentatives         Int                       @default(0)
  erreur_envoi              String?                   // Message d'erreur si échec

  @@index([statut_envoi])
  @@index([date_creation])
  @@index([coordinateur_email])
  @@schema("public")
}
```

**Stratégie de rétention** :
- Conserver 3 mois d'historique pour audit
- Script de nettoyage mensuel (hors scope V1)

#### Functional Core : Types + Fonctions pures

Le domaine est composé uniquement de types et de fonctions pures (pas de classes, pas de méthodes). Types et fonctions sont colocalisés dans le même fichier.

**Principes** :
- Immutabilité complète (`readonly`)
- Arguments toujours sous forme d'objets
- Pas d'effets de bord
- Colocalisation type + fonctions

**Exemples de types du domaine** :

```typescript
// domain/StatutEnvoi.ts
export enum StatutEnvoi {
  CREE = 'CREE',       // Rapport créé, pas encore envoyé
  ENVOYE = 'ENVOYE',   // Email envoyé avec succès
  ECHEC = 'ECHEC',     // Échec d'envoi (à rejouer)
}

// domain/Coordinateur.ts
export type Coordinateur = {
  readonly id: string;
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly profil: 'COORDINATEUR_REGION' | 'COORDINATEUR_DEPARTEMENT';
  readonly territoire: {
    readonly code: string;
    readonly nom: string;
    readonly maille: 'REG' | 'DEPT';
    readonly codesEnfants: readonly string[]; // Départements sous la région
  };
};

// Fonction pure colocalisée
export function estDansPerimetreGeographique(params: {
  coordinateur: Coordinateur;
  codeTerrtoireCompte: string | undefined;
}): boolean {
  // Le coordinateur supervise son territoire + les territoires enfants
  return params.codeTerrtoireCompte === params.coordinateur.territoire.code ||
    params.coordinateur.territoire.codesEnfants.includes(params.codeTerrtoireCompte);
}

// domain/RapportHebdomadaire.ts
export type RapportHebdomadaire = {
  readonly id?: string;
  readonly coordinateur: Coordinateur;
  readonly periode: PeriodeRapport;
  readonly sectionActiviteComptes: SectionActiviteComptes;
  readonly statutEnvoi: StatutEnvoi;
  readonly dateCreation: Date;
  readonly dateEnvoi?: Date;
  readonly nombreTentatives: number;
  readonly erreurEnvoi?: string;
};

// Fonctions de transition d'état (pures)
export function creerRapportHebdomadaire(params: {...}): RapportHebdomadaire;
export function marquerCommeEnvoye(params: { rapport }): RapportHebdomadaire;
export function marquerCommeEchec(params: { rapport, erreur }): RapportHebdomadaire;
export function filtrerActiviteParTerritoire(params: {...}): ActiviteComptes;
```

#### Gateways : Anti-corruption layer

Les gateways sont des interfaces du domaine implémentées dans l'infrastructure. Ils consomment les queries des autres bounded contexts et mappent les résultats vers les types du domaine interne.

**Principes** :
- Arguments toujours sous forme d'objets
- Return types = types du domaine interne (pas de types externes qui fuient)
- Pas de logique métier (mapping uniquement)
- Anti-corruption layer entre bounded contexts

**Types du domaine** :

```typescript
// domain/CompteActivite.ts
export type CompteActivite = {
  email: string;
  nom: string;
  prenom: string;
  profil: string;
  territoire?: {
    code: string;
    nom: string;
  };
};

export type EvenementCompte =
  | { type: 'COMPTE_CREE'; compte: CompteActivite; date: Date }
  | { type: 'COMPTE_DESACTIVE'; compte: CompteActivite; date: Date };

export type ActiviteComptes = EvenementCompte[];

// Fonction utilitaire pour grouper par type
export function grouperEvenementsParType(activite: ActiviteComptes): {
  comptesCreés: CompteActivite[];
  comptesDésactivés: CompteActivite[];
} {
  return {
    comptesCreés: activite
      .filter(e => e.type === 'COMPTE_CREE')
      .map(e => e.compte),
    comptesDésactivés: activite
      .filter(e => e.type === 'COMPTE_DESACTIVE')
      .map(e => e.compte),
  };
}
```

**Interfaces des ports** :

```typescript
// domain/ports/ActiviteComptesGateway.ts
export interface ActiviteComptesGateway {
  recupererActivite(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: string[];
  }): Promise<ActiviteComptes>; // Array d'événements
}

// domain/ports/CoordinateurGateway.ts
export interface CoordinateurGateway {
  recupererCoordinateurs(params: {
    profils: ('COORDINATEUR_REGION' | 'COORDINATEUR_DEPARTEMENT')[];
  }): Promise<Coordinateur[]>;
}

// domain/ports/RapportRepository.ts
export interface RapportRepository {
  sauvegarder(params: { rapport }): Promise<RapportHebdomadaire>;
  mettreAJour(params: { rapport }): Promise<RapportHebdomadaire>;
  recupererRapportsACreesPourEnvoi(params: { dateCreationMin? }): Promise<RapportHebdomadaire[]>;
}

// domain/ports/EnvoieEmailService.ts
export interface EnvoieEmailService {
  envoyerRapportHebdomadaire(params: { rapport }): Promise<void>;
}
```

**Exemple d'implémentation (adapter)** :

```typescript
// infrastructure/adapters/GestionUtilisateurActiviteComptesGateway.ts
export class GestionUtilisateurActiviteComptesGateway implements ActiviteComptesGateway {
  constructor(private readonly activiteComptesQuery: PrismaActiviteComptesQuery) {}

  async recupererActivite(params: {...}): Promise<ActiviteComptes> {
    // 1. Appel query externe (gestion-utilisateur bounded context)
    const evenements = await this.activiteComptesQuery.recupererActiviteComptes(params);

    // 2. Mapping vers domaine interne rapports-hebdomadaires
    return evenements.map(evt => ({
      type: evt.type,
      compte: mapToCompteActivite(evt.compte),
      date: evt.date,
    }));
  }
}
```

### Query générique dans `gestion-utilisateur`

Nouvelle query réutilisable, positionnée comme un endpoint REST générique.

#### Emplacement

```
src/server/gestion-utilisateur/
└── infrastructure/
    └── queries/
        ├── PrismaActiviteComptesQuery.ts
        └── __tests__/
            └── PrismaActiviteComptesQuery.integration.test.ts
```

#### Signature de la query

```typescript
// DTO de la query (contrat externe)
type EvenementCompteDTO =
  | { type: 'COMPTE_CREE'; compte: CompteDTO; date: Date }
  | { type: 'COMPTE_DESACTIVE'; compte: CompteDTO; date: Date };

interface CompteDTO {
  email: string;
  nom: string;
  prenom: string;
  profil: string;
  territoire?: {
    code: string;
    nom: string;
    maille: 'DEPT' | 'REG' | 'NAT';
  };
}

class PrismaActiviteComptesQuery {
  /**
   * Récupère l'activité des comptes (événements de création/désactivation)
   * pour une période et un ensemble de profils donnés
   *
   * @returns Array d'événements triés chronologiquement
   */
  async recupererActiviteComptes(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: string[];
  }): Promise<EvenementCompteDTO[]>;
}
```

#### Tests d'intégration

Fichier : `src/server/gestion-utilisateur/infrastructure/queries/__tests__/PrismaActiviteComptesQuery.integration.test.ts`

**Stratégie** :
- Pattern `createIntegrationTest` (ADR-0003) - isolation transactionnelle
- Pattern `fixtures` (ADR-0004) - création de données minimales
- Structure Given/When/Then stricte

**Cas de tests à couvrir** :
1. ✅ Événements COMPTE_CREE dans la période (filtre date_creation)
2. ✅ Événements COMPTE_DESACTIVE dans la période (filtre date_desactivation)
3. ✅ Mix des deux types d'événements dans un même résultat
4. ✅ Filtrage par profils (PREFET, COORDINATEUR, SERVICES_DECONCENTRES)
5. ✅ Inclusion des informations de territoire via habilitations
6. ✅ Ordre chronologique des événements (tri par date)
7. ✅ Cas limites : dates exactes début/fin, tableau vide

**Exemple de test** :

```typescript
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaActiviteComptesQuery", () => {
  it(
    "doit retourner les événements de comptes créés et désactivés dans la période",
    createIntegrationTest(async (tx) => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const territoire = await fixtures.territoire({ code: "REG-11", nom: "Île-de-France" });

      const compteCreé = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({ utilisateurId: compteCreé.id, territoireCode: territoire.code });

      const compteDesactivé = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
        date_creation: new Date("2026-01-01T10:00:00Z"),
        date_desactivation: new Date("2026-01-16T14:00:00Z"),
      });
      await fixtures.habilitation({ utilisateurId: compteDesactivé.id, territoireCode: territoire.code });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION", "COORDINATEUR_DEPARTEMENT"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: 'COMPTE_CREE',
          compte: {
            email: compteCreé.email,
            nom: compteCreé.nom,
            prenom: compteCreé.prenom,
            profil: "PREFET_REGION",
            territoire: { code: "REG-11", nom: "Île-de-France", maille: "REG" },
          },
          date: new Date("2026-01-15T10:00:00Z"),
        },
        {
          type: 'COMPTE_DESACTIVE',
          compte: {
            email: compteDesactivé.email,
            nom: compteDesactivé.nom,
            prenom: compteDesactivé.prenom,
            profil: "COORDINATEUR_DEPARTEMENT",
            territoire: { code: "REG-11", nom: "Île-de-France", maille: "REG" },
          },
          date: new Date("2026-01-16T14:00:00Z"),
        },
      ]);
    }),
  );
});
```

### Exécution : Script schedulé

#### Fichier

```
scripts/rapportHebdomadaireCoordinateurs.ts
```

Pattern identique à `scripts/rapportPropositionValeurAvancement.ts`

#### Configuration cron

Ajout dans `cron.json` :
```json
{
  "jobs": [
    {
      "command": "0 6 * * 1 /bin/bash scripts/run_rapport_pva.sh"
    },
    {
      "command": "0 9 * * 1 /bin/bash scripts/run_rapport_coordinateurs.sh"
    }
  ]
}
```

#### Shell script

```bash
# scripts/run_rapport_coordinateurs.sh
if [ "$NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS" == "true" ] && [ $ENVIRONMENT == "PROD" ]; then
  export NPM_CONFIG_PRODUCTION=false
  npm ci
  npx tsx scripts/rapportHebdomadaireCoordinateurs.ts
fi
```

#### Feature flag

Variable d'environnement : `NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS=true`

### Notification Tchap

En cas de succès ou d'échec, poster un message dans un salon Tchap dédié après chaque phase.

Variables d'environnement :
- `TCHAP_BASE_URL`
- `TCHAP_ROOM_ID_RAPPORT_COORDINATEURS`
- `TCHAP_ACCESS_TOKEN`

Format des messages :
```markdown
## 📊 Rapports hebdomadaires coordinateurs - Phase 1 : Production

✅ **20 rapports créés** et persistés en base
ℹ️ 5 coordinateurs sans activité (aucun rapport créé)

---

## 📧 Rapports hebdomadaires coordinateurs - Phase 2 : Envoi

✅ **18 emails envoyés avec succès**
❌ **2 emails en échec** :
* coordinateur1@example.com - Timeout Brevo
* coordinateur2@example.com - Email invalide

Les rapports en échec restent en statut ECHEC et peuvent être renvoyés manuellement.
```

En cas d'erreur critique (exception non gérée) :
```markdown
## ⚠️ Erreur lors de l'exécution des rapports hebdomadaires

**Phase en échec** : Phase 1 - Production
**Erreur** : [Message d'erreur]

Veuillez regarder les logs pour en savoir plus :
- [Logs](${SCALINGO_LOGS_URL})
```

### Email Brevo

#### Template Brevo

Nouveau template Brevo (ID à définir, ex: template ID 5)

#### Paramètres du template

```typescript
{
  prenom: string;
  nom: string;
  territoire: string;          // "Île-de-France", "Paris", etc.
  dateDebut: string;           // "Lundi 13 janvier 2025"
  dateFin: string;             // "Lundi 20 janvier 2025 à 09:00"
  comptesCreés: Array<{
    nom: string;
    prenom: string;
    email: string;
    profil: string;
    territoire?: string;       // Optionnel : territoire du compte
  }>;
  comptesDésactivés: Array<{
    nom: string;
    prenom: string;
    email: string;
    profil: string;
    territoire?: string;
  }>;
}
```

## Flux de données : Two-Phase Processing

### Vue d'ensemble

```typescript
// scripts/rapportHebdomadaireCoordinateurs.ts
async function main() {
  // Phase 1 : Production (créer + persister tous les rapports)
  const resultProduction = await produireRapportsUseCase.run();

  // Phase 2 : Envoi (envoyer + tracker, continuer même en cas d'échec)
  const resultEnvoi = await envoyerRapportsUseCase.run({
    dateCreationMin: resultProduction.dateExecution,
  });
}
```

### Phase 1 : ProduireRapportsHebdomadairesUseCase

**Responsabilités** :
1. Calculer la période (dernier lundi 9h → maintenant)
2. Récupérer tous les coordinateurs via `CoordinateurGateway`
3. Récupérer l'activité globale via `ActiviteComptesGateway` (1 seul appel, retourne array d'événements)
4. Pour chaque coordinateur :
   - **Filtrer** les événements par territoire (pure function)
   - **Grouper** par type (COMPTE_CREE / COMPTE_DESACTIVE) pour la section du rapport
   - Créer le rapport si activité non vide (pure function)
   - Persister en DB avec statut `CREE`

**Exemple de code** :
```typescript
// Récupérer tous les événements (créations + désactivations)
const evenementsGlobaux = await activiteComptesGateway.recupererActivite({...});

for (const coordinateur of coordinateurs) {
  // Filtrer les événements du territoire
  const evenementsFiltrés = evenementsGlobaux.filter(evt =>
    estDansPerimetreGeographique({
      coordinateur,
      codeTerrtoireCompte: evt.compte.territoire?.code,
    })
  );

  // Grouper par type pour créer les sections du rapport
  const { comptesCreés, comptesDésactivés } = grouperEvenementsParType(evenementsFiltrés);

  // Créer rapport si activité
  if (comptesCreés.length > 0 || comptesDésactivés.length > 0) {
    const rapport = creerRapportHebdomadaire({ coordinateur, periode, comptesCreés, comptesDésactivés });
    await rapportRepository.sauvegarder({ rapport });
  }
}
```

**Return** : `{ rapportsCreés, coordinateursSansActivite, dateExecution }`

### Phase 2 : EnvoyerRapportsHebdomadairesUseCase

**Responsabilités** :
1. Récupérer tous les rapports avec statut `CREE`
2. Pour chaque rapport :
   - Tenter l'envoi via `EnvoieEmailService`
   - **Si succès** : marquer `ENVOYE` (pure function) + persister
   - **Si échec** : marquer `ECHEC` (pure function) + persister erreur + **continuer**

**Return** : `{ emailsEnvoyés, emailsEnEchec, erreursDetails }`

### Query générique (gestion-utilisateur)

```typescript
// gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery.ts

type EvenementCompteDTO =
  | { type: 'COMPTE_CREE'; compte: CompteDTO; date: Date }
  | { type: 'COMPTE_DESACTIVE'; compte: CompteDTO; date: Date };

class PrismaActiviteComptesQuery {
  async recupererActiviteComptes(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: string[];
  }): Promise<EvenementCompteDTO[]> {
    const evenements: EvenementCompteDTO[] = [];

    // 1. Récupérer comptes créés
    const comptesCreés = await prisma.utilisateur.findMany({
      where: {
        date_creation: { gte: params.dateDebut, lte: params.dateFin },
        profilCode: { in: params.profilCodes },
      },
      include: { habilitation: { include: { territoire: true } } },
    });

    evenements.push(...comptesCreés.map(u => ({
      type: 'COMPTE_CREE' as const,
      compte: mapToDTO(u),
      date: u.date_creation,
    })));

    // 2. Récupérer comptes désactivés
    const comptesDésactivés = await prisma.utilisateur.findMany({
      where: {
        date_desactivation: { gte: params.dateDebut, lte: params.dateFin },
        profilCode: { in: params.profilCodes },
      },
      include: { habilitation: { include: { territoire: true } } },
    });

    evenements.push(...comptesDésactivés.map(u => ({
      type: 'COMPTE_DESACTIVE' as const,
      compte: mapToDTO(u),
      date: u.date_desactivation!,
    })));

    // Tri chronologique optionnel
    return evenements.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
```

### Séparation des responsabilités

| Couche | Responsabilité | Exemple |
|--------|---------------|---------|
| **Domain (Functional Core)** | Types + fonctions pures, immutabilité, logique métier | `creerRapportHebdomadaire()`, `marquerCommeEnvoye()`, `marquerCommeEchec()`, `estDansPerimetreGeographique()`, `calculerPeriodeDerniereLundiNeufHeures()` |
| **Ports (Interfaces)** | Contrats pour consommer d'autres contexts (args objets, return domain types) | `ActiviteComptesGateway`, `CoordinateurGateway`, `RapportRepository`, `EnvoieEmailService` |
| **Use Cases** | Orchestration, coordination, gestion des erreurs (appelle gateways + fonctions domain) | `ProduireRapportsHebdomadairesUseCase` (Phase 1), `EnvoyerRapportsHebdomadairesUseCase` (Phase 2) |
| **Adapters (Imperative Shell)** | Implémentation des ports, mapping externe→interne, effets de bord | `GestionUtilisateurActiviteComptesGateway`, `PrismaCoordinateurGateway`, `PrismaRapportRepository`, `BrevoEnvoieEmailService` |
| **Queries externes** | API REST-like dans autres bounded contexts (pas de logique métier) | `PrismaActiviteComptesQuery` dans `gestion-utilisateur` |

**Principes appliqués :**
- ✅ Functional core : types + fonctions pures colocalisées
- ✅ Immutabilité : `readonly` partout dans le domaine
- ✅ Arguments objets : tous les params sous forme `{ key: value }`
- ✅ Return types cohérents : gateways → domain types, queries → DTOs
- ✅ Pas de logique métier dans les interfaces (anti-corruption layer uniquement)
- ✅ Two-phase processing : production (créer + persister) puis envoi (envoyer + tracker)
- ✅ Résilience : continuer en cas d'échec individuel, tracker les erreurs

### Vue d'ensemble du workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 : PRODUCTION                             │
│                   (ProduireRapportsHebdomadairesUseCase)            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 1. Calculer période
                                  │ 2. Récupérer coordinateurs
                                  │ 3. Récupérer activité globale
                                  ▼
                    ┌──────────────────────────┐
                    │ Pour chaque coordinateur │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Filtrer par territoire   │ (pure function)
                    │  Activité trouvée ?       │
                    └─────────────┬─────────────┘
                                  │
                        OUI ──────┼────── NON (skip)
                                  │
                    ┌─────────────▼─────────────┐
                    │ Créer rapport (CREE)      │ (pure function)
                    │ Sauvegarder en DB         │ (imperative)
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ Notification Tchap        │
                    │ - X rapports créés        │
                    │ - Y sans activité         │
                    └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2 : ENVOI + TRACKING                       │
│                  (EnvoyerRapportsHebdomadairesUseCase)              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Récupérer rapports (statut=CREE)
                                  ▼
                    ┌──────────────────────────┐
                    │   Pour chaque rapport    │
                    └──────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Tenter envoi email       │ (imperative)
                    └─────────────┬─────────────┘
                                  │
                  SUCCÈS ─────────┼────────── ÉCHEC
                                  │
                    ┌─────────────▼──────────┐  ┌───────────────────────┐
                    │ marquerCommeEnvoye()   │  │ marquerCommeEchec()   │
                    │ (pure function)        │  │ + erreur + tentatives │
                    │                        │  │ (pure function)       │
                    │ Mettre à jour DB       │  │ Mettre à jour DB      │
                    │ statut = ENVOYE        │  │ statut = ECHEC        │
                    └────────────────────────┘  └───────────────────────┘
                                  │                        │
                                  │                        │
                                  └────────┬───────────────┘
                                           │
                                           │ CONTINUER (ne pas stopper)
                                           ▼
                    ┌───────────────────────────────────────┐
                    │ Notification Tchap                    │
                    │ - X envoyés                           │
                    │ - Y échecs (avec détails)             │
                    └───────────────────────────────────────┘
```

## Gestion des échecs et résilience

### Stratégie de gestion des erreurs

**Phase 1 - Production (échec critique)** :
- Si une erreur se produit pendant la récupération des coordinateurs ou de l'activité → stopper et alerter Tchap
- Si une erreur se produit lors de la sauvegarde d'un rapport → logger l'erreur, continuer avec les autres rapports
- Utiliser une transaction pour garantir la cohérence (si possible)

**Phase 2 - Envoi (échec non bloquant)** :
- ✅ Continuer l'envoi même en cas d'échec individuel
- ✅ Capturer l'erreur et la persister dans `erreur_envoi`
- ✅ Incrémenter `nombre_tentatives`
- ✅ Mettre le statut à `ECHEC`
- ✅ Passer au rapport suivant

**Types d'erreurs anticipées** :
- Timeout Brevo
- Email invalide
- Quota Brevo dépassé
- Erreur réseau temporaire
- Erreur de template Brevo (mauvais paramètres)

### Rejeu manuel des rapports en échec

En cas d'échec, un rapport reste en statut `ECHEC` dans la base. Il peut être renvoyé :

**Option 1 : Script de rejeu manuel** (hors scope V1)
```bash
npm run script:rejouer-rapport-hebdo -- --rapport-id=<uuid>
```

**Option 2 : Via interface admin** (hors scope V1)
- Page admin listant les rapports en échec
- Bouton "Renvoyer" par rapport

### Observabilité et monitoring

**Métriques à suivre** :
- Nombre de rapports créés par exécution
- Nombre de coordinateurs sans activité
- Nombre d'emails envoyés avec succès
- Nombre d'emails en échec
- Taux de succès d'envoi (%)
- Durée d'exécution de chaque phase
- Nombre de tentatives par rapport

**Alertes à configurer** (hors scope V1) :
- 🚨 Taux d'échec > 10%
- 🚨 Aucun rapport créé alors que des coordinateurs existent
- 🚨 Durée d'exécution > 10 minutes

**Logs structurés** :
```typescript
logger.info('Phase 1 démarrée', {
  dateExecution: date.toISOString(),
  nombreCoordinateurs: coordinateurs.length,
});

logger.info('Rapport créé', {
  rapportId: rapport.id,
  coordinateurEmail: rapport.coordinateur.email,
  nombreComptesCreés: rapport.sectionActiviteComptes.comptesCreés.length,
});

logger.error('Échec envoi email', {
  rapportId: rapport.id,
  coordinateurEmail: rapport.coordinateur.email,
  erreur: error.message,
  nombreTentatives: rapport.nombreTentatives,
});
```

### Idempotence

**Le script peut-il être exécuté plusieurs fois ?**
- Phase 1 : ⚠️ Non idempotent - créera des doublons de rapports si ré-exécuté
- Phase 2 : ✅ Idempotent - n'envoie que les rapports avec statut `CREE`

**Recommandation** :
- Ajouter une contrainte unique sur `(coordinateur_id, date_debut_periode, date_fin_periode)` pour éviter les doublons
- Ou vérifier l'existence avant de créer

## Questions ouvertes

### À définir avec l'équipe

1. **Affichage du territoire dans l'email** :
   - Option A : "Jean Dupont (jean@gouv.fr) - PREFET_REGION"
   - Option B : "Jean Dupont (jean@gouv.fr) - PREFET_REGION - Île-de-France"
   - **Décision** : À définir

2. **Template email Brevo** :
   - Design/contenu exact du template
   - Obtenir l'ID du template une fois créé dans Brevo

3. **Salon Tchap** :
   - Créer le salon dédié pour les notifications
   - Obtenir le ROOM_ID

4. **Cas d'un compte avec multiples habilitations territoriales** :
   - Comment afficher ? Premier territoire ? Liste ? "Multiple" ?
   - **Décision** : À définir

5. **Contrainte unicité** :
   - Ajouter une contrainte unique sur `(coordinateur_id, date_debut_periode, date_fin_periode)` ?
   - **Décision** : Recommandé pour éviter les doublons

## Évolutions futures (hors V1)

### Nouvelles sections du rapport
- **Suivi des chantiers** : évolution hebdomadaire des indicateurs territoriaux
  - Valeurs d'avancement (VA) modifiées
  - Valeurs initiales (VI) créées ou modifiées
  - Valeurs cibles (VC) ajustées
  - Nouveaux commentaires ajoutés
- **Alertes et blocages** : chantiers en difficulté nécessitant attention
- **KPIs territoriaux** : statistiques globales du territoire

### Améliorations fonctionnelles
- Configuration personnalisée par coordinateur (fréquence, contenu, sections)
- Export CSV en pièce jointe
- Dashboard web pour consulter les historiques de rapports
- Résumé exécutif avec tendances (progression, régression)

## Critères d'acceptation

### Fonctionnels

**Production des rapports** :
- [ ] Les coordinateurs REGION reçoivent les comptes de leur région + départements enfants
- [ ] Les coordinateurs DEPARTEMENT reçoivent uniquement les comptes de leur département
- [ ] Les rapports ne sont créés que s'il y a de l'activité (créations OU désactivations)
- [ ] La période couvre du lundi précédent 9h01 à l'exécution
- [ ] Seuls les profils COORDINATEUR, PREFET et SERVICES_DECONCENTRES sont inclus
- [ ] Tous les rapports sont persistés en base avant envoi

**Envoi et tracking** :
- [ ] Les emails sont envoyés uniquement pour les rapports en statut CREE
- [ ] En cas d'échec d'envoi, le statut passe à ECHEC et l'erreur est tracée
- [ ] En cas de succès, le statut passe à ENVOYE avec la date d'envoi
- [ ] Un échec d'envoi n'empêche pas les autres envois
- [ ] Le nombre de tentatives est incrémenté à chaque échec

### Techniques

**Query générique** :
- [ ] Query `PrismaActiviteComptesQuery` dans gestion-utilisateur/infrastructure/queries
- [ ] Tests d'intégration de la query avec pattern `createIntegrationTest` et `fixtures`
- [ ] Coverage complète : période, profils, territoires, cas limites

**Bounded context rapports-hebdomadaires** :
- [ ] Functional core : types + fonctions pures (immutabilité, args objets)
- [ ] Gateways pour consommer gestion-utilisateur (anti-corruption layer)
- [ ] RapportRepository pour persister les rapports
- [ ] StatutEnvoi (CREE, ENVOYE, ECHEC) avec fonctions de transition
- [ ] Tests d'intégration des use cases avec fixtures

**Infrastructure** :
- [ ] Table `rapport_hebdomadaire_coordinateur` avec migration Prisma
- [ ] Index sur `statut_envoi`, `date_creation`, `coordinateur_email`
- [ ] Script standalone exécutable via cron (two-phase processing)
- [ ] Feature flag `NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS`
- [ ] Template Brevo configuré et testé
- [ ] Notifications Tchap pour Phase 1 et Phase 2

### Non-fonctionnels

**Performances** :
- [ ] Phase 1 : production de tous les rapports en < 2 minutes
- [ ] Phase 2 : envoi de 100 emails en < 5 minutes

**Résilience** :
- [ ] En cas d'échec d'envoi individuel, continuer avec les autres
- [ ] Rapports en échec restent en base et peuvent être rejoués
- [ ] Contrainte unicité sur (coordinateur_id, periode) pour éviter doublons

**Observabilité** :
- [ ] Logs structurés pour chaque phase (début, fin, erreurs)
- [ ] Logs pour chaque rapport créé et envoyé
- [ ] Métriques : nombre créés, envoyés, échecs, taux de succès
- [ ] Notification Tchap avec détails (succès, échecs, emails)

**Sécurité** :
- [ ] Aucune donnée sensible en clair dans les logs
- [ ] Emails des coordinateurs non loggés (sauf en cas d'échec pour debug)

## Notes d'implémentation

### Tests

- Utiliser ADR-0003 : pattern `createIntegrationTest` pour l'isolation transactionnelle
- Utiliser ADR-0004 : pattern `fixtures` pour la création de données de test
- Pas de nettoyage manuel (beforeEach/afterEach) grâce au rollback automatique
- Structure Given/When/Then stricte

### Fixtures à ajouter

Si nécessaire, enrichir `src/server/infrastructure/test/fixtures.ts` avec :
- `fixtures.territoire()` (si pas déjà présent)
- `fixtures.habilitation()` (si pas déjà présent)
- `fixtures.utilisateur()` avec support des overrides pour `date_desactivation`
