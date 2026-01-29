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

**Structure hiérarchique** :
- 1 section par chantier
- Au sein de chaque section chantier : 1 sous-section par indicateur

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

### Stratégie anti-N+1

**Toutes les queries utilisent des fetches en batch** pour éviter les problèmes de performance N+1 :
- Les queries retournent des `Record<key, value>` plutôt que des tableaux plats
- Une seule requête DB par type de donnée (indicateurs, événements, valeurs avant)
- Le groupement et le filtrage se font en mémoire après le fetch

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
  indicId: string;
  indicNom: string;
  territoireCode: string;
  territoireNom: string;
  dateChangement: Date;
  valeurAvant: number | null;
  valeurApres: number | null;
};

export type SectionChantierVA = {
  chantierId: string;
  chantierNom: string;
  indicateurs: ActiviteIndicateurVA[];  // 1 sous-section par indicateur
};

export type SectionActiviteChantiersVA = {
  chantiers: SectionChantierVA[];  // 1 section par chantier
};

// Fonction pure pour le fold (logique métier)
export function foldEvenementsVA(params: {
  evenements: EvenementDTO[];
  valeurAvant: number | null;
}): ActiviteIndicateurVA | null {
  // 1. Filtrer les événements de type VALEUR_* et VALEUR_AVANCEMENT
  const evenementsVA = params.evenements.filter(ev =>
    ['VALEUR_CREEE', 'VALEUR_MODIFIEE', 'VALEUR_HISTORISEE'].includes(ev.typeEvenement) &&
    ev.typeValeur === 'VALEUR_AVANCEMENT'
  );

  if (evenementsVA.length === 0) return null;

  // 2. Trier par date + ordre
  const sorted = evenementsVA.sort((a, b) =>
    a.dateCreation.getTime() - b.dateCreation.getTime() || a.ordre - b.ordre
  );

  // 3. Garder le dernier
  const dernier = sorted[sorted.length - 1];

  return {
    indicId: dernier.indicId,
    indicNom: dernier.indicNom,
    territoireCode: dernier.territoireCode,
    territoireNom: dernier.territoireNom,
    dateChangement: dernier.dateCreation,
    valeurAvant: params.valeurAvant,
    valeurApres: dernier.valeur,
  };
}
```

```typescript
// Mise à jour domain/Coordinateur.ts

export type Coordinateur = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profil: ProfilCoordinateur;
  territoires: TerritoireCoordinateur[];
  chantiers: string[];  // NOUVEAU - IDs des chantiers accessibles
};
```

```typescript
// Mise à jour domain/RapportHebdomadaire.ts

export type RapportHebdomadaire = {
  id: string;
  coordinateur: Coordinateur;
  periode: PeriodeRapport;
  sectionActiviteComptes: SectionActiviteComptes;
  sectionActiviteChantiersVA: SectionActiviteChantiersVA;  // NOUVEAU
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi?: Date;
  dateDerniereTentative?: Date;
  nombreTentatives: number;
  erreurEnvoi?: string;
};
```

### Interfaces des ports (Gateways)

```typescript
// domain/ports/ChantierGateway.ts

export type IndicateurPourRapport = {
  indicId: string;
  indicNom: string;
};

export type ChantierAvecIndicateurs = {
  chantierId: string;
  chantierNom: string;
  indicateurs: IndicateurPourRapport[];
};

export interface ChantierGateway {
  // Retourne un Record pour éviter les N+1
  recupererIndicateursParChantiers(
    chantierIds: string[]
  ): Promise<Record<string, ChantierAvecIndicateurs>>;
}
```

```typescript
// domain/ports/ActiviteVAGateway.ts

import { ActiviteIndicateurVA } from "../SectionActiviteChantiersVA";

export interface ActiviteVAGateway {
  // Retourne un Record groupé par indicId_territoireCode pour éviter les N+1
  recupererActiviteVA(params: {
    indicIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<Record<string, ActiviteIndicateurVA>>;  // key = `${indicId}_${territoireCode}`
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
};

type ChantierAvecIndicateursDTO = {
  chantierId: string;
  chantierNom: string;
  indicateurs: IndicateurDTO[];
};

class RecupererIndicateursParChantiersQuery {
  // Retourne un Record pour éviter les N+1
  async handle(chantierIds: string[]): Promise<Record<string, ChantierAvecIndicateursDTO>> {
    // Query indicateur_identite JOIN chantier_identite
    // WHERE chantier_id IN (chantierIds) AND statut = 'PUBLIE'
    // Grouper par chantierId
    // Retourner Record<chantierId, { chantierId, chantierNom, indicateurs: [...] }>
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
  // Retourne un Record groupé par indicId_territoireCode pour éviter les N+1
  async handle(params: {
    indicIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<Record<string, EvenementDTO[]>> {
    // Query indicateur_territoire_valeur_evenement
    // JOIN territoire pour le nom
    // WHERE indic_id IN (indicIds)
    // AND territoire_code IN (territoireCodes)
    // AND date_creation BETWEEN dateDebut AND dateFin
    // ORDER BY indic_id, territoire_code, date_creation, ordre
    // Grouper par clé: `${indicId}_${territoireCode}`
    // Retourner Record<key, EvenementDTO[]>
  }
}
```

### Adapter ActiviteVAGateway avec logique de fold

```typescript
// infrastructure/adapters/EvenementsActiviteVAGateway.ts

class EvenementsActiviteVAGateway implements ActiviteVAGateway {
  async recupererActiviteVA(params: {
    indicIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
    dateFin: Date;
  }): Promise<Record<string, ActiviteIndicateurVA>> {
    // 1. Récupérer tous les événements dans la période (batch)
    const evenementsParGroupe = await this.recupererEvenementsQuery.handle({
      indicIds: params.indicIds,
      territoireCodes: params.territoireCodes,
      dateDebut: params.dateDebut,
      dateFin: params.dateFin,
    });

    // 2. Récupérer les valeurs AVANT la période (batch)
    const valeursAvant = await this.recupererValeursAvantPeriode({
      indicIds: params.indicIds,
      territoireCodes: params.territoireCodes,
      dateDebut: params.dateDebut,
    });

    // 3. Pour chaque groupe (indicId_territoireCode), appliquer le fold (fonction pure)
    const resultats: Record<string, ActiviteIndicateurVA> = {};

    for (const [key, evenements] of Object.entries(evenementsParGroupe)) {
      const valeurAvant = valeursAvant[key] ?? null;

      const activite = foldEvenementsVA({ evenements, valeurAvant });

      if (activite !== null) {
        resultats[key] = activite;
      }
    }

    return resultats;
  }

  // Récupération en batch pour éviter N+1
  private async recupererValeursAvantPeriode(params: {
    indicIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
  }): Promise<Record<string, number>> {
    // Query en batch tous les derniers événements AVANT la période
    // WHERE (indic_id, territoire_code) IN (combinations)
    // AND date_creation < dateDebut
    // AND type_valeur = 'VALEUR_AVANCEMENT'
    // AND type_evenement IN ('VALEUR_CREEE', 'VALEUR_MODIFIEE')
    // Utiliser window function ou subquery pour garder le dernier par groupe
    // Retourner Record<`${indicId}_${territoireCode}`, valeur>
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
  chantiers: Array<{
    chantierNom: string;
    indicateurs: Array<{
      indicateurNom: string;
      territoire: string;          // "DEPT-75 - Paris"
      dateChangement: string;      // "15/01/2026"
      valeurAvant: string | null;  // "45.2" ou null
      valeurApres: string | null;  // "52.8" ou null
    }>;
  }>;
}
```

**Structure d'affichage** :
- 1 section par chantier
- Dans chaque section chantier : liste des indicateurs avec leurs changements

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

### Tests unitaires pour la logique de fold

Fichier : `src/server/rapports-hebdomadaires/__tests__/domain/foldEvenementsVA.unit.test.ts`

**Fonction pure à tester** : `foldEvenementsVA(evenements: EvenementDTO[], valeurAvant: number | null): ActiviteIndicateurVA`

**Cas de tests** :
1. ✅ Un seul événement dans la période : valeur avant + valeur après + date
2. ✅ Plusieurs événements : garde le dernier + date du dernier
3. ✅ Tri correct par date_creation puis ordre
4. ✅ Filtrage des types d'événements (seuls VALEUR_*)
5. ✅ Filtrage du type de valeur (seul VALEUR_AVANCEMENT)
6. ✅ Gestion valeur avant null
7. ✅ Gestion valeur après null
8. ✅ Événements hors période ignorés

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
10. ✅ Sections groupées par chantier
11. ✅ Sous-sections par indicateur au sein d'un chantier

### Fixtures à ajouter

Fichier : `src/server/infrastructure/test/fixtures.ts`

```typescript
fixtures.chantierIdentite({ id, nom })
fixtures.indicateurIdentite({ id, chantierId, nom, statut })
fixtures.indicateurTerritoire({ indicId, territoireCode })
fixtures.indicateurTerritoireValeurEvenement({
  indicId,
  territoireCode,
  typeEvenement,
  typeValeur,
  valeur,
  dateCreation,
  ordre
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

**Structure de l'email** :
- [ ] 1 section par chantier
- [ ] Au sein de chaque section : 1 sous-section par indicateur

### Techniques

- [ ] Nouvelles queries créées dans les bounded contexts respectifs
- [ ] Queries retournent des `Record<key, value>` pour éviter N+1
- [ ] Gateways implémentés avec le pattern existant (args objets, return domain types)
- [ ] Fonction pure `foldEvenementsVA` dans le domaine
- [ ] Tests unitaires pour la fonction `foldEvenementsVA`
- [ ] Tests d'intégration avec pattern `createIntegrationTest` et `fixtures`
- [ ] Container mis à jour avec les nouvelles dépendances
- [ ] Fetch en batch pour les valeurs avant période (anti-N+1)

## Questions ouvertes

### À définir avec l'équipe

1. **Format des valeurs** :
   - Nombre de décimales à afficher
   - Affichage si valeur = null (ex: "-" ou "N/A")
   - **Décision** : À définir

2. **Template email Brevo** :
   - Mise à jour du template existant (ID 60) ou nouveau template
   - **Décision** : À définir

3. **Nom de l'indicateur** :
   - Afficher le nom complet ou une version tronquée
   - **Décision** : À définir

## Évolutions futures (hors V1)

- Ajout du Taux d'Avancement (TA) avant/après
- Filtrage par type de valeur (VI, VC) en plus de VA
- Seuil d'alerte sur les variations importantes
- Graphique d'évolution dans l'email
