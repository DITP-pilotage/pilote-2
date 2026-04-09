# Reorganisation de la page d'accueil en sections — Plan d'implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructurer la page d'accueil en sections autonomes avec un feature flag pour switcher entre l'ancien et le nouveau code.

**Architecture:** Extraction du monolithe `PageChantiers.tsx` + `ChantierLayout` en sections independantes (`sections/*.tsx`), un layout (`BasePageAccueilLayout`), un contexte React (`PageAccueilContext`), et un orchestrateur (`PageAccueil`). Feature flag `NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL` pour basculer.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Next.js SSR, nuqs, convict (config)

**Spec:** `docs/superpowers/specs/2026-04-09-reorganisation-page-accueil-design.md`

---

## File Map

| Action | Path | Responsabilite |
|--------|------|----------------|
| Modify | `src/config.ts` | Ajouter FF `reorganisationPageAccueil` |
| Modify | `src/server/gestion-contenu/domain/VariableContenuDisponible.ts` | Ajouter FF dans interface + definitions |
| Modify | `src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts` | Ajouter FF dans les mocks |
| Modify | `.env.test` | Ajouter FF=false |
| Create | `src/client/components/PageAccueil/PageAccueilContext.tsx` | Contexte React donnees SSR |
| Create | `src/client/components/PageAccueil/sections/BasePageAccueilSection.tsx` | Wrapper section reutilisable |
| Create | `src/client/components/PageAccueil/sections/SectionAvancementMoyen.tsx` | Jauge TA moyen |
| Create | `src/client/components/PageAccueil/sections/SectionRepartitionTerritoriale.tsx` | Min/mediane/max |
| Create | `src/client/components/PageAccueil/sections/SectionRepartitionMeteos.tsx` | Repartition meteos |
| Create | `src/client/components/PageAccueil/sections/SectionCartographie.tsx` | Carte TA par territoire |
| Create | `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx` | Widget comparaison (FF) |
| Create | `src/client/components/PageAccueil/sections/SectionChantiersSignales.tsx` | Alertes + widgets (FF) |
| Create | `src/client/components/PageAccueil/sections/SectionTableauChantiers.tsx` | Tableau des chantiers |
| Create | `src/client/components/PageAccueil/BasePageAccueilLayout.tsx` | Layout (sidebar, header, modales) |
| Create | `src/client/components/PageAccueil/PageAccueil.tsx` | Orchestrateur sections |
| Create | `src/client/components/PageAccueil/PageAccueilLegacy.tsx` | Ancien ChantierLayout renomme |
| Modify | `src/pages/accueil/chantier/[territoireCode]/index.tsx` | Switch FF entre nouveau et legacy |

---

### Task 1: Ajouter le feature flag REORGANISATION_PAGE_ACCUEIL

**Files:**
- Modify: `src/config.ts:343-347`
- Modify: `src/server/gestion-contenu/domain/VariableContenuDisponible.ts:41,220`
- Modify: `src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts`
- Modify: `.env.test`

- [ ] **Step 1: Ajouter la config convict dans config.ts**

Dans `src/config.ts`, apres le bloc `refontePageChantier` (ligne ~347), ajouter avant la fermeture de `featureFlip` :

```typescript
    reorganisationPageAccueil: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL",
    },
```

- [ ] **Step 2: Ajouter dans l'interface VARIABLE_CONTENU_DISPONIBLE**

Dans `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`, ajouter dans l'interface `VARIABLE_CONTENU_DISPONIBLE` (apres ligne 41 `NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER`) :

```typescript
  NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL: boolean;
```

- [ ] **Step 3: Ajouter dans FEATURE_FLIP_DEFINITIONS**

Dans le meme fichier, ajouter apres le bloc `refontePageChantier` (ligne ~220) :

```typescript
  {
    envKey: "NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL",
    configKey: "reorganisationPageAccueil",
    label: "Reorganisation page accueil en sections",
  },
```

- [ ] **Step 4: Mettre a jour les mocks du test**

Dans `src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts`, ajouter `reorganisationPageAccueil: false,` dans les deux appels `vi.mocked(configurationFeatureFlip).mockReturnValue({...})` (apres `lienContactBrevo: false,`).

- [ ] **Step 5: Ajouter dans .env.test**

Ajouter a la fin de `.env.test` :

```
NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL=false
```

- [ ] **Step 6: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 7: Commit**

```bash
git add src/config.ts src/server/gestion-contenu/domain/VariableContenuDisponible.ts src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts .env.test
git commit -m "feat: ajouter le feature flag REORGANISATION_PAGE_ACCUEIL (PIL-1370)"
```

---

### Task 2: Creer le PageAccueilContext

**Files:**
- Create: `src/client/components/PageAccueil/PageAccueilContext.tsx`

- [ ] **Step 1: Creer le fichier contexte**

Creer `src/client/components/PageAccueil/PageAccueilContext.tsx` :

```tsx
import { createContext, FunctionComponent, ReactNode, useContext } from "react";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";

export interface PageAccueilContextValue {
  chantiers: ChantierAccueilContratV2[];
  chantierIds: string[];
  chantierIdsSansFiltrageAlertes: string[];
  nombreTotalChantiersAvecAlertes: number;
  ministères: Ministère[];
  territoireCode: string;
  mailleQuery: MailleInterne;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  jalon: number;
  jalonParDefaut: number;
  moyenneTerritoire: number | null;
}

const PageAccueilContext = createContext<PageAccueilContextValue | null>(null);

export const PageAccueilProvider: FunctionComponent<{
  value: PageAccueilContextValue;
  children: ReactNode;
}> = ({ value, children }) => (
  <PageAccueilContext.Provider value={value}>
    {children}
  </PageAccueilContext.Provider>
);

export const usePageAccueilContext = (): PageAccueilContextValue => {
  const context = useContext(PageAccueilContext);
  if (!context) {
    throw new Error(
      "usePageAccueilContext doit être utilisé dans un PageAccueilProvider",
    );
  }
  return context;
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/PageAccueilContext.tsx
git commit -m "feat: creer PageAccueilContext pour les donnees SSR (PIL-1370)"
```

---

### Task 3: Creer BasePageAccueilSection

**Files:**
- Create: `src/client/components/PageAccueil/sections/BasePageAccueilSection.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/BasePageAccueilSection.tsx` :

```tsx
import { ReactNode } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";

interface BasePageAccueilSectionProps {
  id: string;
  titre: string;
  infobulle?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const BasePageAccueilSection = ({
  id,
  titre,
  infobulle,
  children,
  className,
}: BasePageAccueilSectionProps) => {
  return (
    <section className={className} id={id}>
      {infobulle ? (
        <TitreInfobulleConteneur>
          <Titre
            baliseHtml="h2"
            className="fr-text--lg fr-mb-0 fr-py-1v leading-6"
            estInline
          >
            {titre}
          </Titre>
          <Infobulle>{infobulle}</Infobulle>
        </TitreInfobulleConteneur>
      ) : (
        <Titre
          baliseHtml="h2"
          className="fr-text--lg fr-mb-0 fr-py-1v leading-6"
        >
          {titre}
        </Titre>
      )}
      {children}
    </section>
  );
};
```

Note : on garde les classes `fr-text--lg` etc. sur le `Titre` car c'est un composant existant qui s'attend a ces classes DSFR. Le Tailwind s'applique au layout des sections, pas aux composants reutilises existants.

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/BasePageAccueilSection.tsx
git commit -m "refactor: creer BasePageAccueilSection wrapper reutilisable (PIL-1370)"
```

---

### Task 4: Extraire SectionAvancementMoyen

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionAvancementMoyen.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionAvancementMoyen.tsx` :

```tsx
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionAvancementMoyen = () => {
  const { moyenneTerritoire, jalon } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  return (
    <BasePageAccueilSection
      id="avancement-moyen"
      infobulle={INFOBULLE_CONTENUS.chantiers.jauges}
      titre="Taux d'avancement moyen"
    >
      <Bloc
        className="w-full h-full"
        contenuClassesSupplémentaires="fr-p-2w"
      >
        <div className="flex w-full justify-center px-1 mt-2">
          <JaugeDeProgression
            couleur={chantiersSontArchives ? "gris" : "bleu"}
            libellé={`Taux d'avancement à échéance ${jalon}`}
            pourcentage={moyenneTerritoire}
            taille="lg"
          />
        </div>
      </Bloc>
    </BasePageAccueilSection>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionAvancementMoyen.tsx
git commit -m "refactor: extraire SectionAvancementMoyen (PIL-1370)"
```

---

### Task 5: Extraire SectionRepartitionTerritoriale

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionRepartitionTerritoriale.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionRepartitionTerritoriale.tsx` :

```tsx
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { JaugeDeProgressionSmall } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionRepartitionTerritoriale = () => {
  const { avancementsAgrégés, jalon } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  return (
    <BasePageAccueilSection
      id="repartition-territoriale"
      infobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
      titre={`Répartition territoriale ${jalon}`}
    >
      <Bloc
        className="h-full"
        contenuClassesSupplémentaires="fr-p-2w"
      >
        <div className="flex flex-col items-center px-3">
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "vert"}
            libellé="Maximum"
            pourcentage={avancementsAgrégés.maximum || null}
          />
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "violet"}
            libellé="Médiane"
            pourcentage={avancementsAgrégés.médiane || null}
          />
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "orange"}
            libellé="Minimum"
            pourcentage={avancementsAgrégés.minimum || null}
          />
        </div>
      </Bloc>
    </BasePageAccueilSection>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionRepartitionTerritoriale.tsx
git commit -m "refactor: extraire SectionRepartitionTerritoriale (PIL-1370)"
```

---

### Task 6: Extraire SectionRepartitionMeteos

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionRepartitionMeteos.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionRepartitionMeteos.tsx` :

```tsx
import Bloc from "@/components/_commons/Bloc/Bloc";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import RepartitionsMeteosChantiers from "@/components/PageAccueil/PageChantiers/FiltresMeteos/RepartitionsMeteosChantiers";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionRepartitionMeteos = () => {
  const { repartitionMeteosChantiers } = usePageAccueilContext();

  return (
    <BasePageAccueilSection
      id="repartition-meteos"
      infobulle={INFOBULLE_CONTENUS.chantiers.météos}
      titre="Répartition des météos renseignées"
    >
      <Bloc contenuClassesSupplémentaires="fr-py-2w fr-px-3w">
        <RepartitionsMeteosChantiers
          repartitionMeteos={repartitionMeteosChantiers}
        />
      </Bloc>
    </BasePageAccueilSection>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionRepartitionMeteos.tsx
git commit -m "refactor: extraire SectionRepartitionMeteos (PIL-1370)"
```

---

### Task 7: Extraire SectionCartographie

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionCartographie.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionCartographie.tsx` :

```tsx
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import CartographieAvancement from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement";
import useCartographie from "@/components/_commons/Cartographie/useCartographie";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographie = () => {
  const {
    avancementsGlobauxTerritoriauxMoyens,
    territoireCode,
    mailleQuery,
    jalon,
  } = usePageAccueilContext();

  const pathname = "/accueil/chantier/[territoireCode]";
  const { auClicTerritoireCallback } = useCartographie(
    territoireCode,
    pathname,
  );

  return (
    <Bloc>
      <section id="cartographie">
        <Titre
          baliseHtml="h2"
          className="fr-text--lg break-keep fr-mb-0 fr-py-1v leading-6"
        >
          Taux d'avancement des chantiers par territoire
        </Titre>
        <CartographieAvancement
          auClicTerritoireCallback={auClicTerritoireCallback}
          données={avancementsGlobauxTerritoriauxMoyens}
          jalon={jalon}
          mailleSelectionnee={mailleQuery}
          pathname={pathname}
          territoireCode={territoireCode}
          élémentsDeLégende={ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS}
        />
      </section>
    </Bloc>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionCartographie.tsx
git commit -m "refactor: extraire SectionCartographie (PIL-1370)"
```

---

### Task 8: Extraire SectionComparaisonTerritoires

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx` :

```tsx
import { useEnv } from "@/client/hooks/useEnv";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionComparaisonTerritoires = () => {
  const featureComparaisonTerritoires = useEnv(
    "NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES",
  );
  const { chantierIds, jalon, mailleQuery, territoireCode } =
    usePageAccueilContext();

  if (!featureComparaisonTerritoires) return null;

  return (
    <section id="comparaison-territoires">
      <TuileWidget titre="Comparaison territoriale et évolution">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
          mode="chantiers"
          territoireCode={territoireCode}
        />
      </TuileWidget>
    </section>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx
git commit -m "refactor: extraire SectionComparaisonTerritoires (PIL-1370)"
```

---

### Task 9: Extraire SectionChantiersSignales

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionChantiersSignales.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionChantiersSignales.tsx` :

```tsx
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEnv } from "@/client/hooks/useEnv";
import Titre from "@/components/_commons/Titre/Titre";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import RemontéeAlerte from "@/components/_commons/RemontéeAlerteChantier/RemontéeAlerte";
import { WidgetRepartitionMeteos } from "@/components/_commons/Widget/WidgetRepartitionMeteos/WidgetRepartitionMeteos";
import { WidgetChantiersSignales } from "@/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import usePageChantiers from "@/components/PageAccueil/PageChantiers/usePageChantiers";

export const SectionChantiersSignales = () => {
  const {
    chantiers,
    chantierIds,
    chantierIdsSansFiltrageAlertes,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
    jalonParDefaut,
  } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const ffAlertesBaisse = useEnv("NEXT_PUBLIC_FF_ALERTES_BAISSE");
  const featureChantiersSignalesV2 = useEnv(
    "NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2",
  );
  const featureRepartitionMeteosV2 = useEnv(
    "NEXT_PUBLIC_FF_REPARTITION_METEOS_V2",
  );

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  const { remontéesAlertes } = usePageChantiers(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  if (chantiersSontArchives) return null;

  return (
    <section id="chantiers-signales">
      <div className="pt-4 px-4 md:px-0">
        <div className="mb-4">
          <TitreInfobulleConteneur>
            <BadgeIcône type="warning" />
            <Titre
              baliseHtml="h2"
              className="fr-text--lg fr-mb-0 fr-py-1v ml-2 !text-dsfr-warning-425 leading-6"
              estInline
            >
              Chantiers signalés
            </Titre>
            <Infobulle classNameBouton="!text-dsfr-warning-425">
              {INFOBULLE_CONTENUS.chantiers.alertes}
            </Infobulle>
          </TitreInfobulleConteneur>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {remontéesAlertes.map(
            ({ nomCritère, libellé, nombre, estActivée }) =>
              (ffAlertesBaisse || nomCritère !== "estEnAlerteBaisse") && (
                <div key={libellé} title={libellé}>
                  <RemontéeAlerte
                    estActivée={estActivée}
                    libellé={libellé}
                    nomCritère={nomCritère}
                    nombre={nombre}
                  />
                </div>
              ),
          )}
        </div>
      </div>
      {featureChantiersSignalesV2 ? (
        <div className="pt-4 px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureRepartitionMeteosV2 ? (
            <WidgetRepartitionMeteos
              chantierIds={chantierIds}
              territoireCode={territoireCode}
            />
          ) : null}
          <WidgetChantiersSignales
            chantierIds={chantierIdsSansFiltrageAlertes}
            jalonParDefaut={jalonParDefaut}
            territoireCode={territoireCode}
          />
        </div>
      ) : null}
    </section>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionChantiersSignales.tsx
git commit -m "refactor: extraire SectionChantiersSignales (PIL-1370)"
```

---

### Task 10: Extraire SectionTableauChantiers

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionTableauChantiers.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/sections/SectionTableauChantiers.tsx` :

```tsx
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import usePageChantiers from "@/components/PageAccueil/PageChantiers/usePageChantiers";
import TableauChantiers from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers";

export const SectionTableauChantiers = () => {
  const {
    chantiers,
    nombreTotalChantiersAvecAlertes,
    ministères,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
    jalon,
  } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  const { donnéesTableauChantiers } = usePageChantiers(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  return (
    <section className="mt-4" id="tableau-chantiers">
      <Bloc>
        <TitreInfobulleConteneur>
          <Titre
            baliseHtml="h2"
            className="fr-text--lg fr-mb-0 fr-py-1v leading-6"
            estInline
          >
            {`Liste des chantiers (${nombreTotalChantiersAvecAlertes})`}
          </Titre>
        </TitreInfobulleConteneur>
        <TableauChantiers
          chantiersSontArchives={chantiersSontArchives}
          données={donnéesTableauChantiers}
          jalon={jalon}
          ministèresDisponibles={ministères}
          nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
          territoireCode={territoireCode}
        />
      </Bloc>
    </section>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionTableauChantiers.tsx
git commit -m "refactor: extraire SectionTableauChantiers (PIL-1370)"
```

---

### Task 11: Creer BasePageAccueilLayout

**Files:**
- Create: `src/client/components/PageAccueil/BasePageAccueilLayout.tsx`

Ce composant extrait le "chrome" de la page depuis l'actuel `ChantierLayout` dans `[territoireCode]/index.tsx` : sidebar, header sticky, modales. Il recoit `children` pour le contenu principal.

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/BasePageAccueilLayout.tsx` :

```tsx
import { FunctionComponent, ReactNode, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { useEnv } from "@/client/hooks/useEnv";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Filtres } from "@/components/PageAccueil/Filtres/Filtres";
import Titre from "@/components/_commons/Titre/Titre";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import { FiltresActifs } from "@/components/PageAccueil/FiltresActifs/FiltresActifs";
import { BoutonNavigationFicheTerritoriale } from "@/components/PageAccueil/BoutonNavigationFicheTerritoriale";
import { BoutonNavigationRapportDetaille } from "@/components/BoutonNavigationRapportDetaille";
import { BoutonExportDesDonnees } from "@/components/PageAccueil/BoutonExportDesDonnees";
import { BoutonSyntheseTerritoire } from "@/components/PageAccueil/BoutonSyntheseTerritoire";
import { ModaleVideoAccueil } from "@/components/PageAccueil/PageChantiers/ModaleVideoAccueil/ModaleVideoAccueil";
import { ModaleInscriptionInfolettre } from "@/components/PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre";
import { ModaleRenseignerService } from "@/components/PageAccueil/PageChantiers/ModaleRenseignerService/ModaleRenseignerService";
import Axe from "@/server/domain/axe/Axe.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { profilsRégionaux } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { clsxm } from "@/utils/clsxm";

const PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set([
  ProfilEnum.CABINET_MTFP,
  ProfilEnum.PM_ET_CABINET,
  ProfilEnum.PR,
  ProfilEnum.CABINET_MINISTERIEL,
  ProfilEnum.DIR_ADMIN_CENTRALE,
  ProfilEnum.DROM,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.RESPONSABLE_REGION,
]);

const PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set(
  profilsRégionaux,
);

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.RESPONSABLE_DEPARTEMENT,
]);

interface BasePageAccueilLayoutProps {
  axes: Axe[];
  ministères: Ministère[];
  territoireCode: string;
  mailleSelectionnee: string;
  mailleQuery: MailleInterne;
  jalon: number;
  nombreTotalChantiersAvecAlertes: number;
  doitAfficherModaleVideoAccueil: boolean;
  doitAfficherLaModaleInfolettre: boolean;
  doitAfficherLaFicheTerritoriale: boolean;
  children: ReactNode;
}

export const BasePageAccueilLayout: FunctionComponent<
  BasePageAccueilLayoutProps
> = ({
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  jalon,
  nombreTotalChantiersAvecAlertes,
  doitAfficherModaleVideoAccueil: doitAfficherModaleVideoAccueilInitial,
  doitAfficherLaModaleInfolettre: doitAfficherLaModaleInfolettreInitial,
  doitAfficherLaFicheTerritoriale,
  children,
}) => {
  const { data: session } = useSession();
  const profil = useProfilUtilisateurConnecte();
  const monProfilEstDisponible = useEnv("NEXT_PUBLIC_FF_MON_PROFIL");
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");

  const estProfilTerritorialise =
    PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || "");
  const estProfilRegionalAutoriseAVoirLaTerritorialisation =
    PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(
      session?.profil || "",
    );
  const estAutoriseAVoirLeSelecteurDeMaille =
    !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(
      session?.profil || "",
    );

  const doitAfficherModaleRenseignerService =
    !!monProfilEstDisponible &&
    (profil.service == null || profil.fonction == null);

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [isModaleInfolettreOpen, setIsModaleInfolettreOpen] = useState(
    doitAfficherLaModaleInfolettreInitial,
  );
  const [isModaleVideoAccueilOpen, setIsModaleVideoAccueilOpen] = useState(
    doitAfficherModaleVideoAccueilInitial,
  );
  const [isModaleRenseignerServiceOpen, setIsModaleRenseignerServiceOpen] =
    useState(doitAfficherModaleRenseignerService);

  const filtresStatut = useQueryState(
    "statut",
    parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
  );
  const chantiersSontArchives = filtresStatut?.includes("ARCHIVE") ?? false;

  const pathname = "/accueil/chantier/[territoireCode]";

  return (
    <div className="[&_.fr-h2]:!text-[1.875rem] [&_.fr-h2]:!leading-9">
      <Head>
        <title>PILOTE - Piloter l'action publique par les résultats</title>
      </Head>
      <div className="flex">
        <BarreLatérale
          estOuvert={estOuverteBarreLatérale}
          setEstOuvert={setEstOuverteBarreLatérale}
        >
          <BarreLatéraleEncart>
            <Titre
              baliseHtml="h1"
              className={clsxm(
                `fr-h2 fr-p-0 fr-mb-3w`,
                chantiersSontArchives
                  ? "titre-gris"
                  : "fr-text-title--blue-france",
              )}
            >
              {`${nombreTotalChantiersAvecAlertes} ${nombreTotalChantiersAvecAlertes >= 2 ? "chantiers" : "chantier"}`}
            </Titre>
            <div className="inline-flex flex-col gap-1">
              {doitAfficherLaFicheTerritoriale &&
              estAutoriséAConsulterLaFicheTerritoriale(
                session?.profil || "",
              ) ? (
                <BoutonNavigationFicheTerritoriale
                  jalon={jalon}
                  territoireCode={territoireCode}
                />
              ) : null}
              <BoutonNavigationRapportDetaille
                territoireCode={territoireCode}
              />
              <BoutonExportDesDonnees territoireCode={territoireCode} />
            </div>
          </BarreLatéraleEncart>
          <section>
            <Filtres
              afficherToutLesFiltres
              axes={axes}
              estProfilRegionalAutoriseAVoirLaTerritorialisation={
                estProfilRegionalAutoriseAVoirLaTerritorialisation
              }
              estProfilTerritorialise={estProfilTerritorialise}
              ministères={ministères}
            />
          </section>
        </BarreLatérale>
        <div className="w-full">
          <div className="sticky top-0 z-[1] w-full shadow-[0_6px_18px_var(--shadow-color)] bg-dsfr-blue-france-850 fr-grid-row fr-pt-2w">
            <PanelMenuNavigation
              estAutoriseAVoirLeSelecteurDeMaille={
                estAutoriseAVoirLeSelecteurDeMaille
              }
              mailleQuery={mailleQuery}
              pathname={pathname}
              setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
              territoireCode={territoireCode}
            />
            <FiltresActifs
              axes={axes}
              mailleSelectionnee={mailleSelectionnee}
              ministères={ministères}
            />
            {ffAskAI || session?.profil === ProfilEnum.DITP_ADMIN ? (
              <BoutonSyntheseTerritoire
                jalon={jalon}
                territoireCode={territoireCode}
              />
            ) : null}
          </div>
          {children}
          <ModaleVideoAccueil
            onOpenChange={setIsModaleVideoAccueilOpen}
            open={isModaleVideoAccueilOpen}
          />
          <ModaleRenseignerService
            onOpenChange={setIsModaleRenseignerServiceOpen}
            open={!isModaleVideoAccueilOpen && isModaleRenseignerServiceOpen}
          />
          <ModaleInscriptionInfolettre
            onOpenChange={setIsModaleInfolettreOpen}
            open={
              !isModaleVideoAccueilOpen &&
              !isModaleRenseignerServiceOpen &&
              isModaleInfolettreOpen
            }
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/BasePageAccueilLayout.tsx
git commit -m "refactor: creer BasePageAccueilLayout (PIL-1370)"
```

---

### Task 12: Creer PageAccueil (orchestrateur)

**Files:**
- Create: `src/client/components/PageAccueil/PageAccueil.tsx`

- [ ] **Step 1: Creer le fichier**

Creer `src/client/components/PageAccueil/PageAccueil.tsx` :

```tsx
import { FunctionComponent } from "react";
import { InferGetServerSidePropsType } from "next";
import {
  PageAccueilProvider,
  PageAccueilContextValue,
} from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilLayout } from "@/components/PageAccueil/BasePageAccueilLayout";
import { SectionAvancementMoyen } from "@/components/PageAccueil/sections/SectionAvancementMoyen";
import { SectionRepartitionTerritoriale } from "@/components/PageAccueil/sections/SectionRepartitionTerritoriale";
import { SectionRepartitionMeteos } from "@/components/PageAccueil/sections/SectionRepartitionMeteos";
import { SectionCartographie } from "@/components/PageAccueil/sections/SectionCartographie";
import { SectionComparaisonTerritoires } from "@/components/PageAccueil/sections/SectionComparaisonTerritoires";
import { SectionChantiersSignales } from "@/components/PageAccueil/sections/SectionChantiersSignales";
import { SectionTableauChantiers } from "@/components/PageAccueil/sections/SectionTableauChantiers";
import type { getServerSideProps } from "@/pages/accueil/chantier/[territoireCode]/index";

type PageAccueilProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export const PageAccueil: FunctionComponent<PageAccueilProps> = (props) => {
  const contextValue: PageAccueilContextValue = {
    chantiers: props.chantiers,
    chantierIds: props.chantierIds,
    chantierIdsSansFiltrageAlertes: props.chantierIdsSansFiltrageAlertes,
    nombreTotalChantiersAvecAlertes: props.nombreTotalChantiersAvecAlertes,
    ministères: props.ministères,
    territoireCode: props.territoireCode,
    mailleQuery: props.mailleQuery,
    filtresComptesCalculés: props.filtresComptesCalculés,
    avancementsAgrégés: props.avancementsAgrégés,
    avancementsGlobauxTerritoriauxMoyens:
      props.avancementsGlobauxTerritoriauxMoyens,
    repartitionMeteosChantiers: props.repartitionMeteosChantiers,
    jalon: props.jalon,
    jalonParDefaut: props.jalonParDefaut,
    moyenneTerritoire: props.moyenneTerritoire,
  };

  return (
    <PageAccueilProvider value={contextValue}>
      <BasePageAccueilLayout
        axes={props.axes}
        doitAfficherLaFicheTerritoriale={props.doitAfficherLaFicheTerritoriale}
        doitAfficherLaModaleInfolettre={props.doitAfficherLaModaleInfolettre}
        doitAfficherModaleVideoAccueil={props.doitAfficherModaleVideoAccueil}
        jalon={props.jalon}
        mailleQuery={props.mailleQuery}
        mailleSelectionnee={props.mailleSelectionnee}
        ministères={props.ministères}
        nombreTotalChantiersAvecAlertes={props.nombreTotalChantiersAvecAlertes}
        territoireCode={props.territoireCode}
      >
        <main>
          <div className="py-4 px-0 md:px-4">
            <div className="fr-grid-row">
              <div className="fr-col-12 fr-col-lg-7 fr-col-xl-6 flex flex-col">
                <section className="flex flex-1">
                  <div className="fr-container fr-p-0 flex flex-1">
                    <div className="fr-grid-row fr-grid-row--gutters fr-mb-0 fr-mt-0 w-full mr-0 md:mr-4">
                      <div className="fr-col-12 fr-col-xl-6 flex flex-col items-center pr-0 pt-0">
                        <SectionAvancementMoyen />
                      </div>
                      <div className="fr-col-12 fr-col-xl-6 pr-0 pt-0">
                        <SectionRepartitionTerritoriale />
                      </div>
                    </div>
                  </div>
                </section>
                <div className="mr-0 md:mr-4 xl:mr-0">
                  <SectionRepartitionMeteos />
                </div>
              </div>
              <div className="fr-col-12 fr-col-lg-5 fr-col-xl-6 xl:pl-2">
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
};
```

Note : on conserve les classes `fr-grid-row`, `fr-col-*`, `fr-container` dans l'orchestrateur car elles assurent la mise en page grid DSFR identique a l'existant. Les sections elles-memes utilisent Tailwind en interne.

- [ ] **Step 2: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageAccueil/PageAccueil.tsx
git commit -m "feat: creer PageAccueil orchestrateur de sections (PIL-1370)"
```

---

### Task 13: Creer PageAccueilLegacy et brancher le feature flag

**Files:**
- Create: `src/client/components/PageAccueil/PageAccueilLegacy.tsx`
- Modify: `src/pages/accueil/chantier/[territoireCode]/index.tsx`

- [ ] **Step 1: Creer PageAccueilLegacy**

Creer `src/client/components/PageAccueil/PageAccueilLegacy.tsx`. Ce fichier est une copie exacte du composant `ChantierLayout` actuel dans `src/pages/accueil/chantier/[territoireCode]/index.tsx` (lignes 300-501), renomme en `PageAccueilLegacy`. Il inclut les imports necessaires et exporte le composant.

Copier l'integralite du composant `ChantierLayout` (avec ses constantes `PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE`, `PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE`, etc.) dans ce nouveau fichier, en le renommant `PageAccueilLegacy`. Garder les memes imports, le meme code, les memes props — c'est un copier-coller pur.

Le type des props doit etre `InferGetServerSidePropsType<typeof getServerSideProps>` en important `getServerSideProps` depuis le fichier page.

- [ ] **Step 2: Modifier [territoireCode]/index.tsx pour le switch**

Dans `src/pages/accueil/chantier/[territoireCode]/index.tsx` :

1. Ajouter les imports en haut du fichier :
```tsx
import { PageAccueil } from "@/components/PageAccueil/PageAccueil";
import { PageAccueilLegacy } from "@/components/PageAccueil/PageAccueilLegacy";
```

2. Remplacer l'integralite du composant `ChantierLayout` (lignes 300-501) par :
```tsx
const ChantierLayout = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const ffReorganisationPageAccueil = useEnv(
    "NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL",
  );

  return ffReorganisationPageAccueil ? (
    <PageAccueil {...props} />
  ) : (
    <PageAccueilLegacy {...props} />
  );
};
```

3. Supprimer les imports devenus inutiles dans `index.tsx` (tous ceux utilises uniquement par l'ancien `ChantierLayout` inline — la majorite des imports existants). Garder uniquement :
   - Les imports de types Next.js (`GetServerSidePropsContext`, `InferGetServerSidePropsType`)
   - `useEnv`
   - Les imports serveur utilises par `getServerSideProps`
   - `PageAccueil` et `PageAccueilLegacy`

4. Supprimer les constantes `PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE`, `PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE` — elles sont maintenant dans `BasePageAccueilLayout.tsx` et `PageAccueilLegacy.tsx`.

- [ ] **Step 3: Verifier que le lint passe**

Run: `npm run lint`
Expected: Pas d'erreur

- [ ] **Step 4: Commit**

```bash
git add src/client/components/PageAccueil/PageAccueilLegacy.tsx src/pages/accueil/chantier/[territoireCode]/index.tsx
git commit -m "feat: brancher le feature flag REORGANISATION_PAGE_ACCUEIL (PIL-1370)"
```

---

### Task 14: Verification finale et nettoyage

- [ ] **Step 1: Verifier le lint complet**

Run: `npm run lint`
Expected: Pas d'erreur sur aucun fichier

- [ ] **Step 2: Verification visuelle**

Demarrer le serveur de dev (`npm run dev`), activer le feature flag `NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL=true` dans `.env.local`, et verifier que la page d'accueil s'affiche correctement — identique visuellement a la version sans le flag.

Verifier aussi que `NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL=false` affiche bien l'ancienne version (Legacy).

- [ ] **Step 3: Commit final si ajustements necessaires**

Si des ajustements CSS sont necessaires pour le pixel-perfect :

```bash
git add -A
git commit -m "fix: ajustements CSS pour coherence visuelle (PIL-1370)"
```
