# Spec : Export CSV des widgets de comparaison territoriale

## Contexte

Le composant `PanneauCarte` expose déjà deux exports (PNG et presse-papiers). On ajoute un troisième bouton pour exporter en CSV les données affichées dans le widget actif.

Les widgets concernés, leurs pages et leurs schémas CSV sont détaillés ci-dessous.

---

## Périmètre fonctionnel

### Widgets et pages concernés

| Widget | Page | Mode tRPC | Type CSV |
|---|---|---|---|
| `WidgetCartographieTA` | Accueil / Chantier | `chantiers` | TA simple |
| `WidgetCartographieTA` | Indicateur | `indicateur` | TA multi-jalons |
| `WidgetCartographieMeteo` | Chantier | — | Météo |
| `WidgetCartographiePVA` | Chantier / Indicateur | `chantier` / `indicateur` | PVA |
| `WidgetCartographieValeurAvancement` | Indicateur | — | VA multi-jalons |

### Territoires exportés

Seulement les **territoires sélectionnés** dans le panneau de suivi, soit :
- le territoire courant du panneau (`territoireCode`)
- les territoires ajoutés via l'`AjouterTerritoirePicker` (partagés en URL via `useTerritoiresCompares`)

En mode comparaison (deux panneaux), chaque panneau exporte indépendamment ses propres territoires.

---

## Schémas CSV

### Règles communes

- Séparateur : `;`
- Encodage : UTF-8 avec BOM (`\uFEFF`) pour compatibilité Excel
- Format des dates : `DD/MM/YYYY` (ex. `15/03/2024`)
- Valeurs numériques : valeur brute sans unité ni arrondi
- `estApplicable === false` → ligne exclue du CSV
- `valeur === null` avec `estApplicable !== false` → cellule `"Non renseigné"`

---

### 1. TA page accueil / chantier (`WidgetCartographieTA` mode `chantiers`)

```
Territoire;Taux d'avancement;Date de dernière mise à jour
```

| Colonne | Source |
|---|---|
| Territoire | `getLabelTerritoire(territoire.territoireCode)` |
| Taux d'avancement | `territoire.tauxAvancementJalon` (brut, ex. `72.3456`) |
| Date de dernière mise à jour | `territoire.dateTauxAvancementAnnuel` au format `DD/MM/YYYY` |

---

### 2. Météo / Niveau de confiance (`WidgetCartographieMeteo`)

```
Territoire;Niveau de confiance;Date de publication
```

| Colonne | Source |
|---|---|
| Territoire | `getLabelTerritoire(territoire.territoireCode)` |
| Niveau de confiance | `territoire.meteo` (code brut : `TRES_BON`, `BON`, `COURANT`, `MAUVAIS`, `TRES_MAUVAIS`, `NON_RENSEIGNEE`) |
| Date de publication | `territoire.dateDeMajQualitative` au format `DD/MM/YYYY` |

---

### 3. Propositions de valeur d'avancement (`WidgetCartographiePVA`)

```
Territoire;Nombre de propositions
```

| Colonne | Source |
|---|---|
| Territoire | `getLabelTerritoire(territoire.territoireCode)` |
| Nombre de propositions | `territoire.nombrePropositionsValeur` (entier, `0` inclus) |

Pas de colonne date (`PVATerritoireViewModel` n'expose pas de date).

---

### 4. Valeurs d'avancement (`WidgetCartographieValeurAvancement`)

```
Territoire;{jalon1};{jalon2};...;{jalonN}
```

Les colonnes jalons sont générées depuis `buildJalons()` (2022 → année courante). Toutes les colonnes sont présentes même si aucune valeur n'existe pour un jalon donné.

| Colonne | Source |
|---|---|
| Territoire | `getLabelTerritoire(territoire.territoireCode)` |
| `{jalon}` | `valeurAvancement` pour ce jalon (brut) ou `"Non renseigné"` |

Source des données : `api.indicateur.recupererValeursAvancementTerritoires({ indicateurId, chantierId, jalon })` par jalon.

---

### 5. TA page indicateur (`WidgetCartographieTA` mode `indicateur`)

```
Territoire;{jalon1};{jalon2};...;{jalonN}
```

Même structure que les VA. Pas de colonnes de date par jalon.

| Colonne | Source |
|---|---|
| Territoire | `getLabelTerritoire(territoire.territoireCode)` |
| `{jalon}` | `tauxAvancementJalon` pour ce jalon (brut) ou `"Non renseigné"` |

Source des données : `api.indicateur.recupererTauxAvancementTerritoires({ indicateurId, chantierId, jalon })` par jalon.

---

## Nom de fichier

```
{nomFichier}-{typeCarte}.csv
```

Exemples :
- `comparaison-territoriale-CH-001-ta.csv`
- `comparaison-territoriale-CH-001-meteo.csv`
- `comparaison-territoriale-IND-001-va.csv`

`typeCarte` est la valeur de la prop `typeCarte` du `PanneauCarte` (`"ta"`, `"meteo"`, `"pva"`, `"va"`).

---

## Architecture technique

### Principe général

Option A : `PanneauCarte` reçoit une prop `exporterEnCsv?: () => void`. Quand elle est fournie, le bouton CSV est affiché. Le clic appelle directement cette fonction. `PanneauCarte` ne connaît pas le format des données.

```typescript
// PanneauCarte.tsx — ajout de prop
type PanneauCarteProps<T extends string> = {
  // ... props existantes
  exporterEnCsv?: () => void;
};
```

### Accès aux données : lecture depuis le cache tRPC

Pas de hooks supplémentaires dans `PanneauCarte`. Les données sont lues depuis le cache tRPC via `api.useUtils()` dans les composants parents qui construisent `exporterEnCsv`.

**Cas single-jalon** (TA chantier, Météo, PVA) : les widgets ont déjà déclenché les requêtes — les données sont en cache. Le parent lit avec `utils.XXX.getData(params)` au moment du clic.

**Cas multi-jalons** (VA, TA indicateur) : le parent déclenche un `prefetch` pour chaque jalon au mount (non-suspending). Au clic, il lit tous les jalons depuis le cache.

```typescript
// Dans ComparaisonTerritoiresIndicateur (ou analogue)
const utils = api.useUtils();

// Prefetch au mount
useEffect(() => {
  for (const jalon of buildJalons()) {
    void utils.indicateur.recupererValeursAvancementTerritoires.prefetch(
      { indicateurId, chantierId, jalon },
      { staleTime: WIDGET_STALE_TIME },
    );
  }
}, [indicateurId, chantierId]);

// Fournie à PanneauCarte
const exporterVaEnCsv = () => {
  const jalons = buildJalons();
  const donneesParJalon = new Map(
    jalons.map((jalon) => [
      jalon,
      utils.indicateur.recupererValeursAvancementTerritoires.getData(
        { indicateurId, chantierId, jalon },
      ) ?? [],
    ]),
  );
  // filtrer les territoires sélectionnés, construire et déclencher le CSV
};
```

### Territoires sélectionnés

Le parent lit `useTerritoiresCompares()` pour obtenir les territoires ajoutés, et combine avec son propre `territoireCode` pour reconstruire la liste sélectionnée — identique à ce que fait `useSelectionTerritoires` dans le widget.

### Lieu de l'implémentation des fonctions d'export

| Parent | Widgets concernés | Schémas produits |
|---|---|---|
| `ComparaisonTerritoires` (PageChantier) | TA chantier, Météo, PVA | TA simple, Météo, PVA |
| `ComparaisonTerritoiresIndicateur` | TA indicateur, VA, PVA | TA multi-jalons, VA multi-jalons, PVA |

Chaque parent construit sa propre `exporterEnCsv` selon le `typeCarte` actif et la passe à `PanneauCarte`.

### Utilitaire CSV partagé

Extraire une fonction pure réutilisable dans `src/client/utils/csv/` :

```typescript
// src/client/utils/csv/genererCsv.ts
export const genererCsv = (colonnes: string[], lignes: string[][]): string => {
  const entete = colonnes.join(";");
  const corps = lignes.map((ligne) => ligne.join(";")).join("\n");
  return `\uFEFF${entete}\n${corps}`;
};

export const telechargerCsv = (contenu: string, nomFichier: string): void => {
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
};

export const formaterDateCsv = (dateIso: string | null): string => {
  if (!dateIso) return "Non renseigné";
  const date = new Date(dateIso);
  return date.toLocaleDateString("fr-FR"); // DD/MM/YYYY
};
```

---

## UX

- Le bouton CSV est un troisième icône dans la rangée d'export existante, après PNG et presse-papiers.
- Pas de feedback de chargement dans cette version (à traiter ultérieurement si le prefetch multi-jalons n'est pas encore en cache au moment du clic — cas rare, les prefetch partent au mount).
- En cas d'erreur (données absentes du cache), le bouton ne produit rien silencieusement (comportement identique au bouton PNG en cas d'erreur).

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `src/client/utils/csv/genererCsv.ts` | Créer — utilitaires CSV purs |
| `src/client/components/_commons/ComparaisonTerritoires/PanneauCarte.tsx` | Modifier — ajout prop `exporterEnCsv?` + bouton |
| `src/client/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx` | Modifier — construire `exporterEnCsv` pour TA/Météo/PVA chantier |
| `src/client/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx` | Modifier — construire `exporterEnCsv` pour TA/VA/PVA indicateur |

