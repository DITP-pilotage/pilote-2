# PRD - Rapports Hebdomadaires : Section Suivi de l'Activité Chantiers VA

## Vue d'ensemble

Extension du système de rapports hebdomadaires pour inclure une nouvelle section "Suivi de l'Activité Chantiers VA" qui résume les changements de Valeurs d'Avancement (VA) sur les indicateurs des chantiers auxquels le coordinateur a accès.

## Objectifs

- Informer les coordinateurs des évolutions de VA sur les chantiers de leur périmètre
- Fournir une visibilité hebdomadaire sur les modifications de valeurs d'avancement
- Permettre un suivi proactif des indicateurs territoriaux

**Vision long terme** : Cette section s'inscrit dans l'enrichissement progressif du rapport hebdomadaire avec des indicateurs métier.

## Périmètre de la V1

### Nouvelle section : Suivi de l'Activité Chantiers VA

Liste des changements de VA (Valeur d'Avancement) survenus sur les indicateurs des chantiers du coordinateur durant la période.

### Données affichées par changement

Pour chaque combinaison indicateur/territoire ayant eu au moins un changement dans la période :

| Donnée | Description |
|--------|-------------|
| Nom du chantier | Nom du chantier concerné |
| Nom de l'indicateur | Nom de l'indicateur concerné |
| Territoire | Code et nom du territoire (ex: "DEPT-75 - Paris") |
| Date du changement | Date du dernier changement dans la période |
| Valeur avant | Valeur VA avant le premier changement de la période |
| Valeur après | Valeur VA finale dans la période |

**Note V2** : Ajout potentiel du Taux d'Avancement (TA) avant et après.

### Périmètre des chantiers

**Chantiers concernés** : Tous les chantiers auxquels le coordinateur a accès via ses habilitations (scope "lecture").

**Indicateurs concernés** : Tous les indicateurs publiés (`statut = 'PUBLIE'`) des chantiers accessibles.

### Périmètre territorial

Le filtrage territorial suit la même logique que pour la section activité comptes :
- **COORDINATEUR_REGION** : voit les changements VA sur sa région ET sur tous les départements enfants
- **COORDINATEUR_DEPARTEMENT** : voit les changements VA sur son département ET sur la région parente

### Événements tracés

Seuls les événements de modification de valeur sont pris en compte :
- `VALEUR_CREEE` - Création d'une nouvelle valeur
- `VALEUR_MODIFIEE` - Modification d'une valeur existante
- `VALEUR_HISTORISEE` - Historisation d'une valeur

Les événements liés aux propositions de valeur ne sont pas inclus.

### Logique de "fold" (agrégation)

Lorsque plusieurs modifications surviennent sur le même indicateur/territoire durant la période, elles sont agrégées :

1. **Valeur avant** : Dernière valeur VA connue AVANT le début de la période
2. **Valeur après** : Valeur VA du dernier événement dans la période
3. **Date du changement** : Date du dernier événement dans la période

Cela permet d'afficher uniquement le delta net sur la période.

### Période de rapport

Identique à la section activité comptes :
- **Début** : Lundi précédent à 09:00:01
- **Fin** : Moment d'exécution du script
- **Timezone** : Europe/Paris

### Règle d'envoi

La section est incluse si :
- Au moins 1 changement VA dans le périmètre du coordinateur

Si la section est vide (0 changement) : la section n'est pas affichée dans l'email, mais le rapport peut quand même être envoyé si la section activité comptes contient des données.

## Architecture technique

### Bounded Context : `rapports-hebdomadaires`

Extension du contexte existant avec de nouvelles dépendances vers les bounded contexts `chantiers` et `indicateur-territoire-valeur-evenement`.

### Nouvelles dépendances entre Bounded Contexts

```
rapports-hebdomadaires
    │
    ├──► gestion-utilisateur (existant)
    │       └── Coordinateurs + leurs chantiers
    │
    ├──► chantiers (nouveau)
    │       └── Indicateurs par batch de chantiers
    │
    └──► indicateur-territoire-valeur-evenement (nouveau)
            └── Événements VA par période
```

### Structure de fichiers (nouveaux/modifiés)

```
src/server/rapports-hebdomadaires/
├── domain/
│   ├── SectionActiviteChantiersVA.ts       # NOUVEAU - Type section VA
│   ├── Coordinateur.ts                      # MODIFIE - Ajouter chantiers
│   ├── RapportHebdomadaire.ts              # MODIFIE - Ajouter section VA
│   └── ports/
│       ├── ChantierGateway.ts              # NOUVEAU - Interface indicateurs/chantiers
│       └── ActiviteVAGateway.ts            # NOUVEAU - Interface activité VA
├── infrastructure/
│   └── adapters/
│       ├── ChantiersChantierGateway.ts     # NOUVEAU - Impl ChantierGateway
│       ├── EvenementsActiviteVAGateway.ts  # NOUVEAU - Impl ActiviteVAGateway + fold
│       ├── GestionUtilisateurCoordinateurGateway.ts  # MODIFIE - Mapper chantiers
│       ├── PrismaRapportRepository.ts      # MODIFIE - Stocker section VA
│       └── BrevoEnvoieEmailService.ts      # MODIFIE - Formater section VA
├── usecases/
│   └── ProduireRapportsHebdomadairesUseCase.ts  # MODIFIE - Intégrer section VA
└── container.ts                            # MODIFIE - Enregistrer nouvelles deps

src/server/chantiers/
└── infrastructure/
    └── queries/
        └── RecupererIndicateursParChantiersQuery.ts  # NOUVEAU

src/server/indicateur-territoire-valeur-evenement/
└── infrastructure/
    └── queries/
        └── RecupererEvenementsParPeriodeQuery.ts     # NOUVEAU

src/server/gestion-utilisateur/
└── infrastructure/
    └── queries/
        └── PrismaUtilisateursQuery.ts      # MODIFIE - Retourner chantiers
```

### Types du domaine

```typescript
// domain/SectionActiviteChantiersVA.ts

export type ActiviteIndicateurVA = {
  readonly chantierId: string;
  readonly chantierNom: string;
  readonly indicId: string;
  readonly indicNom: string;
  readonly territoireCode: string;
  readonly territoireNom: string;
  readonly dateChangement: Date;
  readonly valeurAvant: number | null;
  readonly valeurApres: number | null;
};

export type SectionActiviteChantiersVA = {
  readonly changementsVA: readonly ActiviteIndicateurVA[];
};
```

```typescript
// Mise à jour domain/Coordinateur.ts

export type Coordinateur = {
  readonly id: string;
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly profil: ProfilCoordinateur;
  readonly territoires: readonly TerritoireCoordinateur[];
  readonly chantiers: readonly string[];  // NOUVEAU - IDs des chantiers accessibles
};
```

```typescript
// Mise à jour domain/RapportHebdomadaire.ts

export type RapportHebdomadaire = {
  readonly id: string;
  readonly coordinateur: Coordinateur;
  readonly periode: PeriodeRapport;
  readonly sectionActiviteComptes: SectionActiviteComptes;
  readonly sectionActiviteChantiersVA: SectionActiviteChantiersVA;  // NOUVEAU
  readonly statutEnvoi: $Enums.statut_envoi_rapport;
  readonly dateCreation: Date;
  readonly dateEnvoi?: Date;
  readonly dateDerniereTentative?: Date;
  readonly nombreTentatives: number;
  readonly erreurEnvoi?: string;
};
```

### Interfaces des ports (Gateways)

```typescript
// domain/ports/ChantierGateway.ts

export type IndicateurPourRapport = {
  readonly indicId: string;
  readonly indicNom: string;
  readonly chantierId: string;
  readonly chantierNom: string;
};

export interface ChantierGateway {
  recupererIndicateursParChantiers(
    chantierIds: readonly string[]
  ): Promise<IndicateurPourRapport[]>;
}
```

```typescript
// domain/ports/ActiviteVAGateway.ts

import { ActiviteIndicateurVA } from "../SectionActiviteChantiersVA";

export interface ActiviteVAGateway {
  recupererActiviteVA(params: {
    indicIds: readonly string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<ActiviteIndicateurVA[]>;
}
```

### Nouvelle query dans `gestion-utilisateur`

Extension de `PrismaUtilisateursQuery` pour retourner également les chantiers :

```typescript
// Mise à jour UtilisateurDTO
export type UtilisateurDTO = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  territoires: TerritoireDTO[];
  chantiers: string[];  // NOUVEAU - IDs des chantiers via habilitations
};
```

La query récupère les chantiers depuis le champ `chantiers` de la table `habilitation`.

### Nouvelle query dans `chantiers`

```typescript
// chantiers/infrastructure/queries/RecupererIndicateursParChantiersQuery.ts

type IndicateurDTO = {
  indicId: string;
  indicNom: string;
  chantierId: string;
  chantierNom: string;
};

class RecupererIndicateursParChantiersQuery {
  async handle(chantierIds: string[]): Promise<IndicateurDTO[]> {
    // Query indicateur_identite JOIN chantier_identite
    // WHERE chantier_id IN (chantierIds) AND statut = 'PUBLIE'
  }
}
```

### Nouvelle query dans `indicateur-territoire-valeur-evenement`

```typescript
// indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsParPeriodeQuery.ts

type EvenementDTO = {
  id: string;
  indicId: string;
  territoireCode: string;
  territoireNom: string;
  typeEvenement: $Enums.type_evenement;
  typeValeur: $Enums.type_valeur;
  dateValeur: Date;
  valeur: number | null;
  dateCreation: Date;
  ordre: number;
};

class RecupererEvenementsParPeriodeQuery {
  async handle(params: {
    indicIds: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<EvenementDTO[]> {
    // Query indicateur_territoire_valeur_evenement
    // JOIN territoire pour le nom
    // WHERE indic_id IN (indicIds)
    // AND date_creation BETWEEN dateDebut AND dateFin
    // ORDER BY indic_id, territoire_code, date_creation, ordre
  }
}
```

### Adapter ActiviteVAGateway avec logique de fold

```typescript
// infrastructure/adapters/EvenementsActiviteVAGateway.ts

class EvenementsActiviteVAGateway implements ActiviteVAGateway {
  async recupererActiviteVA(params: {
    indicIds: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<ActiviteIndicateurVA[]> {
    // 1. Récupérer tous les événements dans la période
    const evenements = await this.recupererEvenementsQuery.handle(params);

    // 2. Filtrer pour garder uniquement les changements de valeur VA
    const evenementsVA = evenements.filter(ev =>
      ['VALEUR_CREEE', 'VALEUR_MODIFIEE', 'VALEUR_HISTORISEE'].includes(ev.typeEvenement) &&
      ev.typeValeur === 'VALEUR_AVANCEMENT'
    );

    // 3. Grouper par indicId + territoireCode
    const groupes = this.grouperParIndicateurTerritoire(evenementsVA);

    // 4. Pour chaque groupe, appliquer le fold
    const resultats: ActiviteIndicateurVA[] = [];

    for (const [key, events] of groupes) {
      const sorted = events.sort((a, b) =>
        a.dateCreation.getTime() - b.dateCreation.getTime() || a.ordre - b.ordre
      );

      const premier = sorted[0];
      const dernier = sorted[sorted.length - 1];

      // Récupérer la valeur AVANT la période
      const valeurAvant = await this.recupererValeurAvantPeriode({
        indicId: premier.indicId,
        territoireCode: premier.territoireCode,
        dateDebut: params.dateDebut,
      });

      resultats.push({
        indicId: dernier.indicId,
        indicNom: dernier.indicNom,  // À récupérer via join
        chantierId: dernier.chantierId,
        chantierNom: dernier.chantierNom,
        territoireCode: dernier.territoireCode,
        territoireNom: dernier.territoireNom,
        dateChangement: dernier.dateCreation,
        valeurAvant,
        valeurApres: dernier.valeur,
      });
    }

    return resultats;
  }

  private async recupererValeurAvantPeriode(params: {
    indicId: string;
    territoireCode: string;
    dateDebut: Date;
  }): Promise<number | null> {
    // Query le dernier événement AVANT la période
    // WHERE date_creation < dateDebut
    // AND type_valeur = 'VALEUR_AVANCEMENT'
    // AND type_evenement IN ('VALEUR_CREEE', 'VALEUR_MODIFIEE')
    // ORDER BY date_creation DESC, ordre DESC
    // LIMIT 1
  }
}
```

### Mise à jour de la persistance

Le schéma zod dans `PrismaRapportRepository` est étendu :

```typescript
const contenuRapportSchema = z.object({
  coordinateur: z.custom<Coordinateur>(),
  sectionActiviteComptes: z.custom<SectionActiviteComptes>(),
  sectionActiviteChantiersVA: z.custom<SectionActiviteChantiersVA>(),  // NOUVEAU
});
```

### Email Brevo

#### Paramètres du template (extension)

```typescript
{
  // Existants
  prenom: string;
  nom: string;
  territoire: string;
  afficherSectionComptes: boolean;
  afficherComptesCrees: boolean;
  comptesCrees: Array<...>;
  afficherComptesDesactives: boolean;
  comptesDesactives: Array<...>;

  // NOUVEAUX
  afficherSectionActiviteChantiersVA: boolean;
  changementsVA: Array<{
    chantierNom: string;
    indicateurNom: string;
    territoire: string;          // "DEPT-75 - Paris"
    dateChangement: string;      // "15/01/2026"
    valeurAvant: string | null;  // "45.2" ou null
    valeurApres: string | null;  // "52.8" ou null
  }>;
}
```

## Flux de données

### Mise à jour du workflow Phase 1 : Production

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 : PRODUCTION (étendue)                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 1. Calculer période
                                  │ 2. Récupérer coordinateurs (avec chantiers)
                                  │ 3. Récupérer activité comptes globale
                                  │
                          ┌───────┴───────┐
                          │   NOUVEAU     │
                          └───────┬───────┘
                                  │
                                  │ 4. Collecter tous les chantiers uniques
                                  │ 5. Récupérer indicateurs par chantiers
                                  │ 6. Récupérer activité VA globale (avec fold)
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Pour chaque coordinateur │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Filtrer activité comptes │
                    │  par territoire           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  NOUVEAU : Filtrer        │
                    │  activité VA par chantiers│
                    │  du coordinateur          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Activité trouvée ?       │
                    │  (comptes OU VA)          │
                    └─────────────┬─────────────┘
                                  │
                        OUI ──────┼────── NON (skip)
                                  │
                    ┌─────────────▼─────────────┐
                    │ Créer rapport avec        │
                    │ - sectionActiviteComptes  │
                    │ - sectionActiviteChantiersVA │
                    │ Sauvegarder en DB         │
                    └───────────────────────────┘
```

## Tests

### Tests d'intégration à ajouter

Fichier : `src/server/rapports-hebdomadaires/__tests__/usecases/ProduireRapportsHebdomadairesUseCase.integration.test.ts`

**Cas de tests** :
1. ✅ Coordinateur reçoit les changements VA pour ses chantiers
2. ✅ Coordinateur ne reçoit PAS les changements VA pour les chantiers auxquels il n'a pas accès
3. ✅ Fold correct avec plusieurs modifications sur même indicateur/territoire
4. ✅ Valeur avant = dernière valeur AVANT la période
5. ✅ Section vide quand aucun changement VA
6. ✅ Filtrage par type d'événement (seuls VALEUR_*)
7. ✅ Filtrage par type de valeur (seul VALEUR_AVANCEMENT)
8. ✅ Rapport créé si activité VA mais pas d'activité comptes
9. ✅ Rapport créé si activité comptes mais pas d'activité VA

### Fixtures à ajouter

Fichier : `src/server/infrastructure/test/fixtures.ts`

```typescript
fixtures.chantierIdentite({ id?, nom? })
fixtures.indicateurIdentite({ id?, chantierId, nom?, statut? })
fixtures.indicateurTerritoire({ indicId, territoireCode })
fixtures.indicateurTerritoireValeurEvenement({
  indicId,
  territoireCode,
  typeEvenement,
  typeValeur,
  valeur,
  dateCreation,
  ordre?
})
```

## Critères d'acceptation

### Fonctionnels

**Récupération des données** :
- [ ] Les chantiers sont récupérés depuis les habilitations du coordinateur
- [ ] Les indicateurs sont récupérés pour tous les chantiers du coordinateur
- [ ] Seuls les indicateurs publiés sont inclus
- [ ] Seuls les événements de type VALEUR_* sont inclus
- [ ] Seuls les événements de type VALEUR_AVANCEMENT sont inclus

**Logique de fold** :
- [ ] Plusieurs modifications sur même indicateur/territoire = un seul résultat
- [ ] La valeur avant = dernière valeur connue AVANT le début de la période
- [ ] La valeur après = valeur du dernier événement dans la période
- [ ] La date = date du dernier événement dans la période

**Filtrage territorial** :
- [ ] Le coordinateur régional voit les changements de sa région + départements enfants
- [ ] Le coordinateur départemental voit les changements de son département + région parente

**Envoi** :
- [ ] Section affichée dans l'email si au moins 1 changement VA
- [ ] Section masquée si 0 changement VA
- [ ] Rapport créé si activité VA même sans activité comptes

### Techniques

- [ ] Nouvelles queries créées dans les bounded contexts respectifs
- [ ] Gateways implémentés avec le pattern existant (args objets, return domain types)
- [ ] Tests d'intégration avec pattern `createIntegrationTest` et `fixtures`
- [ ] Types domaine immutables (`readonly`)
- [ ] Container mis à jour avec les nouvelles dépendances

## Questions ouvertes

### À définir avec l'équipe

1. **Affichage du chantier** :
   - Option A : Grouper les changements par chantier dans l'email
   - Option B : Liste plate triée par date
   - **Décision** : À définir

2. **Format des valeurs** :
   - Nombre de décimales à afficher
   - Affichage si valeur = null (ex: "-" ou "N/A")
   - **Décision** : À définir

3. **Template email Brevo** :
   - Mise à jour du template existant (ID 60) ou nouveau template
   - **Décision** : À définir

4. **Nom de l'indicateur** :
   - Afficher le nom complet ou une version tronquée
   - **Décision** : À définir

## Évolutions futures (hors V1)

- Ajout du Taux d'Avancement (TA) avant/après
- Filtrage par type de valeur (VI, VC) en plus de VA
- Seuil d'alerte sur les variations importantes
- Graphique d'évolution dans l'email
