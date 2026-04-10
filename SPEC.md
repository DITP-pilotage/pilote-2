# Spec : Export CSV des widgets cartographie

Date : 2026-04-10

## Contexte

Les widgets de cartographie disposent déjà d'un export image (PNG, presse-papiers) via `ExportableWidget`. Cette spec décrit l'ajout d'un bouton d'export CSV à côté des boutons existants.

Chaque widget a son propre bouton. Chaque clic déclenche un rechargement complet des données via tRPC (pas de réutilisation du cache du widget).

---

## Périmètre

### Page d'accueil

| Widget | Colonnes CSV |
|--------|-------------|
| Taux d'avancement | Territoire ; Taux d'avancement ; Date |

### Page chantier

| Widget | Colonnes CSV |
|--------|-------------|
| Taux d'avancement | Territoire ; Taux d'avancement ; Date |
| Niveau de confiance | Territoire ; Niveau de confiance ; Date de publication |
| Proposition de valeurs d'avancement | Territoire ; Nombre de propositions |

### Page indicateur

| Widget | Colonnes CSV |
|--------|-------------|
| Valeurs d'avancement | Territoire ; VA 2022 ; Date 2022 ; VA 2023 ; Date 2023 ; … ; VA N ; Date N |
| Taux d'avancement | Territoire ; TA 2022 ; Date 2022 ; TA 2023 ; Date 2023 ; … ; TA N ; Date N |
| Proposition de valeurs d'avancement | Territoire ; Nombre de propositions |

Les colonnes jalons sont **dynamiques** : `buildJalons()` retourne `[2022, 2023, ..., annéeCourante]`. Le nombre de colonnes croît d'une paire par an.

---

## Règles de filtrage des lignes

| Cas | Comportement |
|-----|-------------|
| `estApplicable === false` | Ligne exclue |
| `estApplicable !== false` et valeur `null` | Ligne incluse, cellule = `"Non renseignée"` |
| Territoire non sélectionné | Ligne exclue |

### Territoires inclus dans l'export
- Territoire principal : `territoireCode` (paramètre d'URL)
- Territoires comparés : `territoiresCompares` (paramètre d'URL)

---

## Format du fichier

- Séparateur : `;`
- Encodage : UTF-8 avec BOM (`\uFEFF`) pour compatibilité Excel
- Valeurs entre guillemets doubles, guillemets internes doublés (`""`)
- Extension : `.csv`
- Nom de fichier : reprend le `nomFichier` existant déjà passé à `ExportableWidget`

### Formatage des valeurs

| Type | Format |
|------|--------|
| Taux d'avancement | `"42"` (entier, sans `%`) |
| Valeur d'avancement | Nombre localisé `fr-FR` via `toLocaleString` |
| Date | `dd/MM/yyyy` via `PiloteDateFormatter.isoDateFranceMetropolitaine(date)` |
| Niveau de confiance | Libellé humanisé issu de `libellesMeteos` (ex. `"Temps nuageux"`) |
| Nombre de propositions | Entier brut |
| Valeur manquante (applicable, null) | `"Non renseignée"` |

---

## Architecture technique

### 1. Utilitaire CSV client — `src/client/utils/csv.ts`

```typescript
export const genererContenuCsv = (lignes: string[][]): string => {
  const bom = '\uFEFF';
  const corps = lignes
    .map(ligne => ligne.map(cellule => `"${cellule.replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  return bom + corps;
};

export const telechargerCsv = (contenu: string, nomFichier: string): void => {
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `${nomFichier}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
};
```

### 2. Modification de `ExportableWidget`

Ajout d'un prop optionnel `boutonExportCsv?: ReactNode`. Quand il est fourni, le nœud est rendu à droite des deux boutons image existants. `ExportableWidget` ne gère ni l'état de chargement ni les appels tRPC — c'est entièrement la responsabilité du composant passé.

```typescript
// ExportableWidget.tsx
export const ExportableWidget = ({
  nomFichier,
  boutonExportCsv,  // nouveau, optionnel
  children,
}: {
  nomFichier: string;
  boutonExportCsv?: ReactNode;
  children: ReactNode;
}) => {
  // ...
  return (
    <div className="flex flex-col gap-2">
      {/* contenu du widget */}
      <div className="flex items-center justify-end">
        <span className="text-primary text-sm">exporter :</span>
        <button onClick={enregistrerCommeImage} ...>...</button>
        <button onClick={copierDansLePressePapiers} ...>...</button>
        {boutonExportCsv}
      </div>
    </div>
  );
};
```

### 3. Composants bouton d'export CSV

Chaque widget qui supporte le CSV expose son propre composant bouton. Ce composant encapsule entièrement : les appels tRPC via `api.useUtils()`, l'état de chargement, la construction des lignes CSV, et le déclenchement du téléchargement.

**Pattern commun :**

```typescript
// BoutonExportCsvXxx.tsx
export const BoutonExportCsvXxx = ({ /* props contextuelles */ }: Props) => {
  const utils = api.useUtils();
  const [enCours, setEnCours] = useState(false);

  const handleClick = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const donnees = await utils.<router>.<procedure>.fetch(params);
      const lignes = construireLignes(donnees, territoiresPourExport);
      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={enCours} type="button" aria-label="Exporter en CSV" aria-busy={enCours}>
      <Icone className="w-4 h-4" icone={CsvIcon} />
    </button>
  );
};
```

Le composant est instancié dans le widget parent avec ses props et passé à `ExportableWidget` via `boutonExportCsv={<BoutonExportCsvXxx ... />}`.

#### `BoutonExportCsvTA` — TA page accueil + page chantier

Props : `chantierIds`, `jalon`, `nomFichier`, `territoiresPourExport: string[]`

Appel tRPC : `utils.chantier.recupererTauxAvancementTerritoires.fetch({ chantierIds, jalon })`

Colonnes : `["Territoire", "Taux d'avancement", "Date"]`

Lignes (non-applicable exclus) :
- Territoire : `getLabelTerritoire(territoireCode)`
- Taux d'avancement : `tauxAvancementJalon?.toFixed(0) ?? "Non renseignée"`
- Date : `PiloteDateFormatter.isoDateFranceMetropolitaine(dateTauxAvancementAnnuel)` ou `"Non renseignée"`

#### `BoutonExportCsvTAIndicateur` — TA page indicateur (multi-jalons)

Props : `indicateurId`, `chantierId`, `nomFichier`, `territoiresPourExport: string[]`

Appels tRPC : `Promise.all(buildJalons().map(jalon => utils.indicateur.recupererTauxAvancementTerritoires.fetch({ indicateurId, chantierId, jalon })))`

En-têtes : `["Territoire", "TA 2022", "Date 2022", "TA 2023", "Date 2023", ...]`

Lignes : pivot par `territoireCode`, une colonne paire par jalon.

#### `BoutonExportCsvVA` — VA page indicateur (multi-jalons)

Même pattern que `BoutonExportCsvTAIndicateur` avec `utils.indicateur.recupererValeursAvancementTerritoires`.

En-têtes : `["Territoire", "VA 2022", "Date 2022", "VA 2023", "Date 2023", ...]`

Valeur formatée via `toLocaleString("fr-FR")` ou `"Non renseignée"`.

#### `BoutonExportCsvMeteo` — Niveau de confiance page chantier

Props : `chantierId`, `jalon`, `nomFichier`, `territoiresPourExport: string[]`

Appel tRPC : `utils.chantier.recupererMeteosTerritoires.fetch({ chantierId, jalon })`

Colonnes : `["Territoire", "Niveau de confiance", "Date de publication"]`

Valeur : `libellesMeteos[meteo]` ou `"Non renseignée"` si `meteo === null`.

#### `BoutonExportCsvPVA` — PVA page chantier

Props : `chantierId`, `jalon`, `nomFichier`, `territoiresPourExport: string[]`

Appel tRPC : `utils.chantier.recupererPVAChantierTerritoires.fetch({ chantierId, jalon })`

Colonnes : `["Territoire", "Nombre de propositions"]`

#### `BoutonExportCsvPVAIndicateur` — PVA page indicateur

Props : `indicateurId`, `chantierId`, `jalon`, `nomFichier`, `territoiresPourExport: string[]`

Appel tRPC : `utils.indicateur.recupererPVATerritoires.fetch({ indicateurId, chantierId, jalon })`

Colonnes : `["Territoire", "Nombre de propositions"]`

### 4. Récupération de la liste de territoires pour l'export

Dans chaque widget parent, la liste `territoiresPourExport` est construite à partir de :
- `territoireCode` (prop du widget, territoire principal)
- `territoiresCompares` (lu via `useTerritoiresCompares()`)

Concaténation et déduplication si le principal apparaît aussi dans les comparés. Cette liste est passée directement en prop au composant bouton.

---

## Comportement aux cas limites

| Cas | Résultat |
|-----|---------|
| Tous les territoires exclus (tous non-applicables) | CSV téléchargé avec uniquement la ligne d'en-têtes |
| Un seul territoire | CSV avec une seule ligne de données |
| Erreur tRPC pendant l'export | Catch silencieux, bouton se réactive (pas de toast requis pour l'instant) |
| Export indicateur avec jalons 2022→2026 (5 jalons) | 11 colonnes (1 territoire + 5×2) |

---

## Arborescence des fichiers à créer / modifier

```
src/client/utils/
  csv.ts                                                  (nouveau)

src/client/components/_commons/Widget/
  ExportableWidget.tsx                                    (modifier : prop boutonExportCsv)
  WidgetCartographieTA/
    BoutonExportCsvTA.tsx                                 (nouveau, accueil + chantier)
    BoutonExportCsvTAIndicateur.tsx                       (nouveau, indicateur multi-jalons)
  WidgetCartographieValeurAvancement/
    BoutonExportCsvVA.tsx                                 (nouveau)
  WidgetCartographieMeteo/
    BoutonExportCsvMeteo.tsx                              (nouveau)
  WidgetCartographiePVA/
    BoutonExportCsvPVA.tsx                                (nouveau, chantier)
    BoutonExportCsvPVAIndicateur.tsx                      (nouveau, indicateur)
```

---

## Ce qui n'est pas dans le scope

- Colonne "Maille" : non demandée, les libellés territoire sont suffisamment distinctifs
- Pagination / chunking : les exports widget couvrent un nombre limité de territoires sélectionnés
- Route API REST dédiée : tout se fait côté client
- Toast de succès / notification : non demandé
- Feature flag : la fonctionnalité est activée directement
