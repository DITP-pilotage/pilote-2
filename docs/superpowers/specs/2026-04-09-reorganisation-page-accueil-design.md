# PIL-1370 : Reorganisation de la page d'accueil en sections

Date : 2026-04-09

## Contexte

La page d'accueil (`/accueil/chantier/[territoireCode]`) est un monolithe : le layout (sidebar, header, modales) est dans `[territoireCode]/index.tsx` et le contenu principal dans `PageChantiers.tsx`. Toute la logique conditionnelle (feature flags, alertes, archives) est inline.

On applique le meme pattern de refacto que la page chantier (PR #2040, commit `0a27e22ea`) : extraction en sections autonomes, layout separé, feature flag pour switcher.

## Objectif

Refacto structurel pur — aucun changement visuel. La page rendue doit etre pixel-perfect avec l'existant quand le feature flag est actif.

## Approche

Replication exacte du pattern PageChantier :
- `BasePageAccueilSection` = wrapper reutilisable
- Chaque section = un fichier autonome dans `sections/`
- `BasePageAccueilLayout` = chrome de la page (sidebar, header, modales)
- `PageAccueil` = orchestrateur qui compose les sections
- `PageAccueilLegacy` = ancien code, feature flag pour rollback

## Feature flag

`NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL`

- Ajout dans `config.ts` (`configurationFeatureFlip`)
- Ajout dans `VariableContenuDisponible.ts` (interface + definitions)
- Switch dans `[territoireCode]/index.tsx` via `useEnv()`

## Structure des fichiers

```
src/client/components/PageAccueil/
├── PageAccueil.tsx                         # Orchestrateur (compose les sections)
├── PageAccueilLegacy.tsx                   # Ancien ChantierLayout renomme
├── PageAccueilContext.tsx                  # Contexte React pour les donnees SSR
├── BasePageAccueilLayout.tsx               # Sidebar + header sticky + modales
├── sections/
│   ├── BasePageAccueilSection.tsx          # Wrapper reutilisable (titre, infobulle)
│   ├── SectionAvancementMoyen.tsx          # Jauge TA moyen
│   ├── SectionRepartitionTerritoriale.tsx  # Min/mediane/max
│   ├── SectionRepartitionMeteos.tsx        # Repartition des meteos
│   ├── SectionCartographie.tsx             # Carte TA par territoire
│   ├── SectionComparaisonTerritoires.tsx   # Widget comparaison (feature flag)
│   ├── SectionChantiersSignales.tsx        # Alertes + widgets signales (feature flags)
│   └── SectionTableauChantiers.tsx         # Tableau des chantiers
├── PageChantiers/                          # Inchange (utilise par Legacy)
│   └── ...
└── ... (Filtres/, FiltresActifs/, boutons - inchanges)
```

## Composants

### PageAccueilContext

Contexte React qui expose les donnees SSR a toutes les sections. Evite le props drilling.

```tsx
interface PageAccueilContextValue {
  chantiers: ChantierAccueilContratV2[];
  chantierIds: string[];
  chantierIdsSansFiltrageAlertes: string[];
  nombreTotalChantiersAvecAlertes: number;
  ministeres: Ministere[];
  territoireCode: string;
  mailleQuery: MailleInterne;
  filtresComptesCalcules: Record<TypeAlerteChantier, number>;
  avancementsAgreges: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  jalon: number;
  jalonParDefaut: number;
  moyenneTerritoire: number | null;
}
```

Hook `usePageAccueilContext()` pour consommer.

### BasePageAccueilSection

Wrapper Tailwind pour toutes les sections.

```tsx
interface BasePageAccueilSectionProps {
  id: string;
  titre: string;
  infobulle?: ReactNode;
  children: ReactNode;
  className?: string;
}
```

Rend : `<section>` avec titre h2, infobulle optionnelle, enfants. Utilise Tailwind pour le styling.

### BasePageAccueilLayout

Extrait de l'actuel `ChantierLayout`. Contient :
- `BarreLaterale` avec `Filtres` et boutons navigation
- Header sticky avec `PanelMenuNavigation`, `FiltresActifs`, `BoutonSyntheseTerritoire`
- Les 3 modales (video, infolettre, renseigner service)
- Recoit `children` pour le contenu principal

### PageAccueil (orchestrateur)

```tsx
export const PageAccueil = (props) => (
  <PageAccueilProvider value={props}>
    <BasePageAccueilLayout>
      <main>
        <div className="py-4 px-0 md:px-4">
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col">
              <SectionAvancementMoyen />
              <SectionRepartitionTerritoriale />
              <SectionRepartitionMeteos />
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-6 xl:pl-2">
              <SectionCartographie />
            </div>
          </div>
          <SectionComparaisonTerritoires />
          <SectionChantiersSignales />
          <SectionTableauChantiers />
        </div>
      </main>
    </BasePageAccueilLayout>
  </PageAccueilProvider>
);
```

### Sections

Chaque section :
1. Consomme `usePageAccueilContext()` pour les donnees
2. Utilise `useEnv()` pour les feature flags (pas le contexte)
3. Gere sa propre logique conditionnelle
4. Delegue le rendu aux composants existants
5. Wrap dans `BasePageAccueilSection` si applicable

#### SectionAvancementMoyen
- Donnees : `moyenneTerritoire`, `jalon`, statut archive
- Rendu : `JaugeDeProgression` dans un Bloc

#### SectionRepartitionTerritoriale
- Donnees : `avancementsAgreges` (max, mediane, min), `jalon`, statut archive
- Rendu : 3x `JaugeDeProgressionSmall`

#### SectionRepartitionMeteos
- Donnees : `repartitionMeteosChantiers`
- Rendu : `RepartitionsMeteosChantiers`

#### SectionCartographie
- Donnees : `avancementsGlobauxTerritoriauxMoyens`, `territoireCode`, `mailleQuery`, `jalon`
- Rendu : `CartographieAvancement`

#### SectionComparaisonTerritoires
- Feature flag : `NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES` via `useEnv()`
- Donnees : `chantierIds`, `jalon`, `mailleQuery`, `territoireCode`
- Rendu : `TuileWidget` + `WidgetCartographieTA`
- Rendu conditionnel : null si FF desactive

#### SectionChantiersSignales
- Feature flags : `NEXT_PUBLIC_FF_ALERTES_BAISSE`, `NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2`, `NEXT_PUBLIC_FF_REPARTITION_METEOS_V2` via `useEnv()`
- Donnees : `filtresComptesCalcules`, `chantierIds`, `chantierIdsSansFiltrageAlertes`, `territoireCode`, `jalonParDefaut`
- Rendu : alertes (RemonteeAlerte) + widgets (WidgetRepartitionMeteos, WidgetChantiersSignales)
- Logique : masque si chantiers archives

#### SectionTableauChantiers
- Donnees : `chantiers`, `ministeres`, `territoireCode`, `jalon`, `nombreTotalChantiersAvecAlertes`, `filtresComptesCalcules`, `avancementsAgreges`
- Rendu : `TableauChantiers`

## Passage de donnees dans [territoireCode]/index.tsx

```tsx
// getServerSideProps reste identique

const ChantierLayout = (props) => {
  const ffReorganisationPageAccueil = useEnv("NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL");

  return ffReorganisationPageAccueil
    ? <PageAccueil {...props} />
    : <PageAccueilLegacy {...props} />;
};
```

`PageAccueilLegacy` = copie exacte du `ChantierLayout` actuel (renomme).

## Conventions

- Tailwind pour tout le nouveau code (pas de classes `fr-*`)
- `useEnv()` pour les feature flags dans les sections
- Le contexte SSR est un pont temporaire — a terme les sections deviendront des widgets autonomes
- Rendu visuel identique a l'existant

## Ce qui ne change pas

- `getServerSideProps` (identique)
- Composants enfants existants (TableauChantiers, Filtres, CartographieAvancement, etc.)
- Les hooks existants (usePageChantiers, useCartographie, etc.)
- La sidebar et le header (extraits tels quels dans le Layout)
