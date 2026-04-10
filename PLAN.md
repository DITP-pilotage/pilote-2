# Plan d'implémentation — Export CSV des widgets cartographie

Référence : SPEC.md

## Étape 1 — Utilitaire CSV client

**Fichier** : `src/client/utils/csv.ts`

Créer deux fonctions :
- `genererContenuCsv(lignes: string[][]): string` — construit le contenu CSV avec BOM UTF-8, séparateur `;`, valeurs entre guillemets doubles
- `telechargerCsv(contenu: string, nomFichier: string): void` — déclenche le téléchargement via un `<a>` temporaire

---

## Étape 2 — Modification de `ExportableWidget`

**Fichier** : `src/client/components/_commons/Widget/ExportableWidget.tsx`

Ajouter le prop optionnel `boutonExportCsv?: ReactNode`. Le rendre à droite des deux boutons image existants quand il est fourni.

---

## Étape 3 — `BoutonExportCsvTA` (page accueil + page chantier)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographieTA/BoutonExportCsvTA.tsx`

Props : `chantierIds: string[]`, `jalon: number`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appel : `utils.chantier.recupererTauxAvancementTerritoires.fetch({ chantierIds, jalon })`
- Filtre `estApplicable !== false` et `territoiresPourExport`
- Colonnes : `Territoire ; Taux d'avancement ; Date`
- Intégrer dans `WidgetCartographieTA` : construire `territoiresPourExport` depuis `territoireCode` + `useTerritoiresCompares()`, passer le bouton à `ExportableWidget`

---

## Étape 4 — `BoutonExportCsvMeteo` (page chantier)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographieMeteo/BoutonExportCsvMeteo.tsx`

Props : `chantierId: string`, `jalon: number`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appel : `utils.chantier.recupererMeteosTerritoires.fetch({ chantierId, jalon })`
- Filtre `estApplicable !== false` et `territoiresPourExport`
- Colonnes : `Territoire ; Niveau de confiance ; Date de publication`
- Valeur météo : `libellesMeteos[meteo]` ou `"Non renseignée"`
- Intégrer dans `WidgetCartographieMeteo`

---

## Étape 5 — `BoutonExportCsvPVA` (page chantier)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographiePVA/BoutonExportCsvPVA.tsx`

Props : `chantierId: string`, `jalon: number`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appel : `utils.chantier.recupererPVAChantierTerritoires.fetch({ chantierId, jalon })`
- Filtre `estApplicable !== false` et `territoiresPourExport`
- Colonnes : `Territoire ; Nombre de propositions`
- Intégrer dans `WidgetCartographiePVA`

---

## Étape 6 — `BoutonExportCsvTAIndicateur` (page indicateur, multi-jalons)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographieTA/BoutonExportCsvTAIndicateur.tsx`

Props : `indicateurId: string`, `chantierId: string`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appels : `Promise.all(buildJalons().map(jalon => utils.indicateur.recupererTauxAvancementTerritoires.fetch({ indicateurId, chantierId, jalon })))`
- En-têtes dynamiques : `["Territoire", "TA 2022", "Date 2022", ..., "TA N", "Date N"]`
- Pivot : une ligne par `territoireCode`, une paire de colonnes par jalon
- Filtre `estApplicable !== false` sur l'union des territoires sur tous les jalons
- Intégrer dans `WidgetCartographieTA` (variante indicateur)

---

## Étape 7 — `BoutonExportCsvVA` (page indicateur, multi-jalons)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographieValeurAvancement/BoutonExportCsvVA.tsx`

Props : `indicateurId: string`, `chantierId: string`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appels : `Promise.all(buildJalons().map(jalon => utils.indicateur.recupererValeursAvancementTerritoires.fetch({ indicateurId, chantierId, jalon })))`
- En-têtes dynamiques : `["Territoire", "VA 2022", "Date 2022", ..., "VA N", "Date N"]`
- Valeur : `toLocaleString("fr-FR")` ou `"Non renseignée"`
- Intégrer dans `WidgetCartographieValeurAvancement`

---

## Étape 8 — `BoutonExportCsvPVAIndicateur` (page indicateur)

**Fichier** : `src/client/components/_commons/Widget/WidgetCartographiePVA/BoutonExportCsvPVAIndicateur.tsx`

Props : `indicateurId: string`, `chantierId: string`, `jalon: number`, `nomFichier: string`, `territoiresPourExport: string[]`

- Appel : `utils.indicateur.recupererPVATerritoires.fetch({ indicateurId, chantierId, jalon })`
- Colonnes : `Territoire ; Nombre de propositions`
- Intégrer dans `WidgetCartographiePVA` (variante indicateur)

---

## Ordre de réalisation recommandé

Les étapes 1 et 2 sont des prérequis bloquants. Les étapes 3 à 8 sont ensuite indépendantes entre elles.

```
Étape 1 (csv.ts)
    └── Étape 2 (ExportableWidget)
            ├── Étape 3 (BoutonExportCsvTA)
            ├── Étape 4 (BoutonExportCsvMeteo)
            ├── Étape 5 (BoutonExportCsvPVA)
            ├── Étape 6 (BoutonExportCsvTAIndicateur)
            ├── Étape 7 (BoutonExportCsvVA)
            └── Étape 8 (BoutonExportCsvPVAIndicateur)
```
