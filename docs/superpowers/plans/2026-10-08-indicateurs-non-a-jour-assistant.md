# Indicateurs non à jour dans l'assistant IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre `est_a_jour` territorial dans dbt et exposer un outil `get_indicateurs_non_a_jour` à l'assistant Albert de pilote-ppg.

**Architecture:** Le modèle dbt `get_date_pro_maj_indic` passe de la granularité (indicateur, maille) à (indicateur, zone) ; `indicateur_territoire` le joint sur `zone_id`. Côté app, une query Prisma `RecupererIndicateursNonAJourQuery` (module `chantiers`) lit `indicateur_territoire`, et un outil Albert l'expose avec filtrage par habilitations, règle de volume (compteurs vs détail) et consignes de restitution.

**Tech Stack:** dbt (PostgreSQL, unit tests dbt ≥ 1.8, `uv`), Next.js / TypeScript, Prisma, Awilix (`defineModule`), Vercel AI SDK (`tool`), Zod, Vitest, evalite.

**Spec:** `docs/superpowers/specs/2026-10-08-indicateurs-non-a-jour-assistant-design.md`

## Global Constraints

- Ne jamais commiter sans demande explicite de l'utilisateur : chaque étape « Commit » consiste à **proposer** le commit (message fourni) et attendre son accord.
- Définition « non à jour » identique au mail : chantier `PUBLIE`, indicateur `PUBLIE`, `est_applicable = true`, `est_a_jour` false **ou NULL**. Pas de filtre sur la pondération.
- Un territoire applicable sans aucune valeur actuelle est « non à jour ».
- Le code du mail (`recupererIndicateursNonAJourParChantierId`, `CreerLesRapportsPropositionsUseCase`) n'est pas modifié.
- Aucun changement de schéma Prisma, aucune migration.
- Tests : `expect(result).toEqual([{...}])` plutôt que `toHaveLength` + index ; pas de commentaires hors given/when/then (sauf pour souligner une donnée de setup) ; pas de variables d'un ou deux caractères ; utiliser `$Enums` de `@prisma/client` pour les mailles.
- Pas d'adresse e-mail (responsables de données) dans la sortie de l'outil.
- Le mode détaillé (`territoires_en_retard`) n'est actif que si `indicateur_ids` ou `territoire_code` est fourni.

## Review Focus

- Utilisateur départemental sans `territoire_code` : `nb_territoires_applicables` et la liste ne doivent porter que sur ses territoires accessibles, jamais sur les 101 départements — test dans Task 4 (bornage) et Task 3 (territoire hors périmètre exclu du compte).
- Ligne applicable avec `est_a_jour` NULL (aucune ligne correspondante dans `get_date_pro_maj_indic`) : comptée comme en retard, comme dans le mail — test dans Task 3.
- Indicateur demandé non applicable sur le périmètre (N7) : doit ressortir dans `indicateurs_non_suivis`, pas comme « à jour » — tests dans Task 3 (`indicateursApplicablesIds`) et Task 4.
- `chantier_ids` mêlant chantiers accessibles et non accessibles : seuls les accessibles sont interrogés, sans divulgation des autres — test dans Task 4.
- Utilisateur sans aucun chantier accessible : réponse explicite, pas « tout est à jour » — test dans Task 4.

---

## File Structure

| Fichier | Action | Responsabilité |
|---|---|---|
| `apps/pilote-ppg-data-management/models/df3/4_compute/get_date_pro_maj_indic.sql` | Modify | Calcul de fraîcheur par (indicateur, zone) |
| `apps/pilote-ppg-data-management/models/df3/4_compute/get_last_vaca_maille.sql` | Delete | Plus utilisé |
| `apps/pilote-ppg-data-management/models/df3/4_compute/unit_tests.yml` | Create | Unit test dbt du calcul par zone |
| `apps/pilote-ppg-data-management/models/df3/schema.yml` | Modify | Documentation de la nouvelle granularité |
| `apps/pilote-ppg-data-management/models/exposition/indicateur/indicateur_territoire.sql` | Modify | Jointure sur `zone_id` |
| `apps/pilote-ppg/src/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery.ts` | Create | Lecture Prisma + regroupement chantier → indicateur → maille |
| `apps/pilote-ppg/src/server/chantiers/__tests__/infrastructure/queries/RecupererIndicateursNonAJourQuery.integration.test.ts` | Create | Tests d'intégration de la query |
| `apps/pilote-ppg/src/server/chantiers/module.ts` | Modify | Enregistrement + export de la query |
| `apps/pilote-ppg/src/server/albert/tools/getIndicateursNonAJour.ts` | Create | Outil Albert (habilitations, volume, instructions) |
| `apps/pilote-ppg/src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts` | Create | Tests unitaires de l'outil |
| `apps/pilote-ppg/src/server/albert/module.ts` | Modify | Enregistrement de la fabrique d'outil |
| `apps/pilote-ppg/src/server/albert/AssistantIA.ts` | Modify | Exposition de l'outil |
| `apps/pilote-ppg/src/server/albert/systemPrompt.ts` | Modify | Section « Indicateurs non à jour » + routage |
| `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.unit.test.ts` | Modify | Présence de la section |
| `apps/pilote-ppg/evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts` | Create | Suite d'eval de l'outil |
| `apps/pilote-ppg/evals/2-tools/2.2-donnees/getChantiers.eval.ts` | Modify | Négatifs « retard de mise à jour » |
| `apps/pilote-ppg/evals/2-tools/2.2-donnees/getIndicateurs.eval.ts` | Modify | Négatif fraîcheur |
| `apps/pilote-ppg/evals/2-tools/2.2-donnees/getChantiersSignales.eval.ts` | Modify | Négatif fraîcheur |

---

### Task 1: dbt — calcul de fraîcheur par zone

**Files:**
- Modify: `apps/pilote-ppg-data-management/models/df3/4_compute/get_date_pro_maj_indic.sql`
- Delete: `apps/pilote-ppg-data-management/models/df3/4_compute/get_last_vaca_maille.sql`
- Create: `apps/pilote-ppg-data-management/models/df3/4_compute/unit_tests.yml`
- Modify: `apps/pilote-ppg-data-management/models/df3/schema.yml:211-224`

**Interfaces:**
- Consumes: `ref('stg_ppg_metadata__zones')` (colonnes `id`, `maille` ∈ {NAT, REG, DEPT}), `ref('get_last_vaca')` (`indic_id`, `zone_id`, `date_valeur_actuelle`), `ref('stg_ppg_metadata__indicateurs')`, `ref('stg_ppg_metadata__chantiers')`, `source('ppg_metadata', 'metadata_indicateurs_complementaire')`.
- Produces: `get_date_pro_maj_indic` à la granularité (indic_id, zone_id) avec les colonnes `indic_id`, `chantier_id`, `zone_id`, `maille`, `last_va_date`, `periodicite`, `delai_disponibilite`, `prochaine_date_va`, `prochaine_date_maj_debut_mois`, `prochaine_date_maj`, `est_a_jour`, `prochaine_date_maj_jours`. Consommé par Task 2.

Toutes les commandes de cette tâche s'exécutent depuis `apps/pilote-ppg-data-management` et nécessitent un `.env` pointant vers une base de dev (voir `Makefile`, cible `docker-up`).

- [ ] **Step 1: Écrire le unit test dbt (en échec)**

Créer `models/df3/4_compute/unit_tests.yml`. `CURRENT_DATE` n'est pas mockable : les dates sont en 2001 (périmé) ou 2099 (à jour), et les VA sont au 1er du mois comme les `metric_date` réelles.

```yaml
version: 2

unit_tests:
  - name: test_get_date_pro_maj_indic_par_zone
    description: |
      Vérifie que la fraîcheur est calculée par {indic_id, zone_id} et non plus par maille :
      - deux départements d'un même indicateur ont chacun leur statut (D29 à jour, D35 périmé) ;
      - un département applicable sans aucune VA est non à jour (D22) ;
      - prochaine_date_maj = dernière VA + périodicité + délai, ramenée au dernier jour du mois ;
      - un indicateur non territorialisé n'a de ligne qu'au national.
    model: get_date_pro_maj_indic
    given:
      - input: ref('stg_ppg_metadata__zones')
        rows:
          - {id: D29, maille: DEPT}
          - {id: D35, maille: DEPT}
          - {id: D22, maille: DEPT}
          - {id: R53, maille: REG}
          - {id: FRANCE, maille: NAT}
      - input: ref('stg_ppg_metadata__indicateurs')
        rows:
          - {id: IND-001, chantier_id: CH-001}
          - {id: IND-002, chantier_id: CH-001}
      - input: ref('stg_ppg_metadata__chantiers')
        rows:
          - {id: CH-001, est_territorialise: true, maille_pilotage: DEPT}
      - input: source('ppg_metadata', 'metadata_indicateurs_complementaire')
        rows:
          - {indic_id: IND-001, indic_territorialise: true, periodicite: Mensuelle, delai_disponibilite: 1}
          # IND-002 non territorialisé : seule la maille NAT doit ressortir
          - {indic_id: IND-002, indic_territorialise: false, periodicite: Annuelle, delai_disponibilite: 0}
      - input: ref('get_last_vaca')
        rows:
          - {indic_id: IND-001, zone_id: D29, date_valeur_actuelle: 2099-01-01}
          - {indic_id: IND-001, zone_id: D35, date_valeur_actuelle: 2001-01-01}
          - {indic_id: IND-002, zone_id: FRANCE, date_valeur_actuelle: 2099-01-01}
    expect:
      rows:
        - {indic_id: IND-001, zone_id: D29, maille: DEPT, prochaine_date_maj: 2099-03-31, est_a_jour: true}
        - {indic_id: IND-001, zone_id: D35, maille: DEPT, prochaine_date_maj: 2001-03-31, est_a_jour: false}
        - {indic_id: IND-001, zone_id: D22, maille: DEPT, prochaine_date_maj: null, est_a_jour: false}
        - {indic_id: IND-001, zone_id: R53, maille: REG, prochaine_date_maj: null, est_a_jour: false}
        - {indic_id: IND-001, zone_id: FRANCE, maille: NAT, prochaine_date_maj: null, est_a_jour: false}
        - {indic_id: IND-002, zone_id: FRANCE, maille: NAT, prochaine_date_maj: 2100-01-31, est_a_jour: true}
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Les unit tests dbt lisent les types des relations amont : les créer à vide d'abord.

Run:
```bash
UV_ENV_FILE=.env uv run dbt run --select "+get_date_pro_maj_indic" --empty
UV_ENV_FILE=.env uv run dbt test --select "get_date_pro_maj_indic,test_type:unit"
```
Expected: FAIL — la colonne `zone_id` n'existe pas dans le modèle actuel (erreur de compilation ou d'exécution sur `zone_id`).

- [ ] **Step 3: Réécrire `get_date_pro_maj_indic.sql`**

Remplacer intégralement le contenu du fichier par :

```sql
{{ config(materialized = 'table') }}

-- Cette table indique la prochaine date théorique de mise à jour des données
--	en fonction de la dernière date de màj + périodicité déclarée
--	pour chaque {indic, zone}

WITH
-- Liste des indicateurs territo
src_indic_territo AS (
    SELECT
        indic_id,
        indic_territorialise AS indic_territo
    FROM
        {{ source('ppg_metadata', 'metadata_indicateurs_complementaire') }} -- noqa: LT05
    WHERE indic_territorialise
),

-- Base des indicateurs à étudier, pour chaque zone
-- 	+ date de la VA dispo la + récente sur cette zone
src_indicateurs AS (
    SELECT
        indic.id AS indic_id,
        indic.chantier_id,
        zones.id AS zone_id,
        zones.maille,
        last_vaca.date_valeur_actuelle AS last_va_date
    FROM {{ ref('stg_ppg_metadata__zones') }} AS zones
    CROSS JOIN {{ ref('stg_ppg_metadata__indicateurs') }} AS indic
    LEFT JOIN {{ ref('get_last_vaca') }} AS last_vaca
        ON
            last_vaca.indic_id = indic.id
            AND last_vaca.zone_id = zones.id
    LEFT JOIN
        {{ ref('stg_ppg_metadata__chantiers') }} AS chantier
        ON indic.chantier_id = chantier.id
    LEFT JOIN src_indic_territo
        ON indic.id = src_indic_territo.indic_id
    WHERE
        -- Pour DEPT: les indics territo des chantiers territo + pilotés au DEPT
        (
            zones.maille = 'DEPT'
            AND chantier.est_territorialise
            AND src_indic_territo.indic_territo
            AND chantier.maille_pilotage = 'DEPT'
        )
        -- Pour REG: les indics territo des chantiers territo + 
        OR (
            zones.maille = 'REG'
            AND chantier.est_territorialise
            AND src_indic_territo.indic_territo
            AND chantier.maille_pilotage IN ('REG', 'DEPT')
        )
        -- Pour NAT: Tous les indics
        OR (zones.maille = 'NAT')
),

-- Récupération de la configuration temporelle
src_config_tempo AS (
    SELECT
        indic_id,
        periodicite,
        delai_disponibilite
    FROM
        {{ source('ppg_metadata', 'metadata_indicateurs_complementaire') }} -- noqa: LT05
    ORDER BY indic_id
),

-- Calcul de la prochaine date de VA
get_prochaine_date_va AS (
    SELECT
        src_indicateurs.indic_id,
        src_indicateurs.chantier_id,
        src_indicateurs.zone_id,
        src_indicateurs.maille,
        src_indicateurs.last_va_date,
        config_tempo.periodicite,
        config_tempo.delai_disponibilite,
        -- 	On ajouter X mois suivant la valeur de periodicite renseignée
        CASE config_tempo.periodicite
            WHEN 'Mensuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '1 month'
            WHEN 'Bimestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '2 months'
            WHEN 'Trimestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '3 months'
            WHEN 'Semestrielle'
                THEN src_indicateurs.last_va_date + INTERVAL '6 months'
            WHEN 'Annuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '1 year'
            WHEN 'Bi-annuelle'
                THEN src_indicateurs.last_va_date + INTERVAL '2 year'
            WHEN '3 ans'
                THEN src_indicateurs.last_va_date + INTERVAL '3 year'
            WHEN '6 ans'
                THEN src_indicateurs.last_va_date + INTERVAL '6 year'
        END AS prochaine_date_va
    FROM src_indicateurs
    LEFT JOIN src_config_tempo AS config_tempo
        ON src_indicateurs.indic_id = config_tempo.indic_id
),

-- Calcul de la prochaine date de màj
--	prochaine_date_maj= prochaine_date_va+delai_disponibilite
get_prochaine_date_maj_debut_mois AS (
    SELECT
        *,
        (prochaine_date_va + delai_disponibilite * INTERVAL '1 month')
            AS prochaine_date_maj_debut_mois
    FROM get_prochaine_date_va
),

-- On arrondit la date à la FIN du mois
get_prochaine_date_maj AS (
    SELECT
        *,
        (
            prochaine_date_maj_debut_mois::DATE
            + INTERVAL '1 month'
            - INTERVAL '1 day'
        ) AS prochaine_date_maj
    FROM get_prochaine_date_maj_debut_mois
),

-- Calcule si données à jour + distance à la prochaine màj (en jours)
get_est_a_jour_et_date_maj_jours AS (
    SELECT
        *,
        COALESCE(prochaine_date_maj > CURRENT_DATE, FALSE) AS est_a_jour,
        EXTRACT(DAY FROM prochaine_date_maj - CURRENT_DATE)
            AS prochaine_date_maj_jours
    FROM get_prochaine_date_maj
)

SELECT * FROM get_est_a_jour_et_date_maj_jours
```

Avant d'écrire, comparer avec la version actuelle (`git diff` après écriture) : seuls `base_mailles` (supprimé), `src_indicateurs` (zones + `get_last_vaca`), l'ajout de `zone_id` dans `get_prochaine_date_va` et l'en-tête doivent différer. Si une CTE intermédiaire du fichier actuel n'apparaît pas ci-dessus, la conserver telle quelle.

- [ ] **Step 4: Supprimer `get_last_vaca_maille`**

```bash
grep -rn "get_last_vaca_maille" models macros analyses tests
```
Expected: aucune occurrence (le seul `ref` vient d'être retiré). Puis :
```bash
git rm models/df3/4_compute/get_last_vaca_maille.sql
```

- [ ] **Step 5: Mettre à jour `models/df3/schema.yml`**

Remplacer :
```yaml
      Pour chaque {indic_id, maille}, on va calculer si le TA est à jour par rapport à la périodicité déclarée de mise à jour des données.
```
par :
```yaml
      Pour chaque {indic_id, zone_id}, on va calculer si le TA est à jour par rapport à la périodicité déclarée de mise à jour des données.
```
et la description de `last_va_date` :
```yaml
        description: "Date de la VA la plus récente pour cette zone et cet indicateur."
```
Ajouter sous `columns:` :
```yaml
      - name: zone_id
        description: "Zone (territoire) pour laquelle la fraîcheur est calculée."
```

- [ ] **Step 6: Relancer le test et vérifier qu'il passe**

Run:
```bash
UV_ENV_FILE=.env uv run dbt run --select "+get_date_pro_maj_indic" --empty
UV_ENV_FILE=.env uv run dbt test --select "get_date_pro_maj_indic,test_type:unit"
```
Expected: PASS (1 unit test).

- [ ] **Step 7: Lint SQL**

Run: `UV_ENV_FILE=.env uv run sqlfluff lint models/df3/4_compute/get_date_pro_maj_indic.sql`
Expected: aucune violation introduite par le changement (comparer avec `git stash && uv run sqlfluff lint … && git stash pop` si le fichier en avait déjà).

- [ ] **Step 8: Commit (sur accord de l'utilisateur)**

Proposer :
```bash
git add models/df3/4_compute/get_date_pro_maj_indic.sql models/df3/4_compute/unit_tests.yml models/df3/schema.yml
git commit -m "feat(dbt): calcul de la fraîcheur des indicateurs par territoire"
```

---

### Task 2: dbt — exposition `indicateur_territoire` jointe par zone

**Files:**
- Modify: `apps/pilote-ppg-data-management/models/exposition/indicateur/indicateur_territoire.sql` (jointure `date_pro_maj`, vers la ligne 108)

**Interfaces:**
- Consumes: `get_date_pro_maj_indic` (Task 1), colonne `zone_id`.
- Produces: `public.indicateur_territoire.est_a_jour`, `prochaine_date_maj`, `prochaine_date_maj_jours`, `prochaine_date_valeur_actuelle` désormais propres à chaque territoire. Consommé par Task 3 (via Prisma).

- [ ] **Step 1: Mesure « avant » (base de dev alimentée)**

Exécuter et noter le résultat (même requête que la définition du mail) :
```sql
SELECT count(DISTINCT (it.id, it.maille)) AS couples_indicateur_maille_non_a_jour,
       count(*) AS lignes_territoire_non_a_jour
FROM public.indicateur_territoire it
JOIN public.indicateur_identite ii ON ii.id = it.id
JOIN public.chantier_identite ci ON ci.id = ii.chantier_id
WHERE ii.statut = 'PUBLIE'
  AND ci.statut = 'PUBLIE'
  AND it.est_applicable
  AND it.est_a_jour IS NOT TRUE;
```

- [ ] **Step 2: Modifier la jointure**

Remplacer :
```sql
LEFT JOIN {{ ref('get_date_pro_maj_indic') }} AS date_pro_maj
    ON
        meta_indic.id = date_pro_maj.indic_id
        AND meta_zone.maille = date_pro_maj.maille
```
par :
```sql
LEFT JOIN {{ ref('get_date_pro_maj_indic') }} AS date_pro_maj
    ON
        meta_indic.id = date_pro_maj.indic_id
        AND territoire.zone_id = date_pro_maj.zone_id
```

Vérifier que `meta_zone` est encore utilisé ailleurs dans le fichier (`grep -n "meta_zone" models/exposition/indicateur/indicateur_territoire.sql`) ; s'il ne l'est plus, supprimer son `LEFT JOIN {{ ref('stg_ppg_metadata__zones') }} AS meta_zone`.

- [ ] **Step 3: Construire et vérifier**

Run:
```bash
UV_ENV_FILE=.env uv run dbt build --select "get_date_pro_maj_indic+ indicateur_territoire"
```
Expected: PASS (modèles construits, tests existants verts). Le modèle est `incremental`/`merge` sans filtre `is_incremental()` : toutes les lignes sont réécrites, pas de `--full-refresh`.

Vérification de la granularité (doit renvoyer au moins une ligne si des données réelles existent : une maille où des territoires ont des statuts différents) :
```sql
SELECT id, maille, count(DISTINCT est_a_jour) AS statuts_distincts
FROM public.indicateur_territoire
WHERE est_applicable AND maille IN ('dept', 'reg')
GROUP BY id, maille
HAVING count(DISTINCT est_a_jour) > 1
LIMIT 5;
```

- [ ] **Step 4: Mesure « après »**

Rejouer la requête du Step 1 et reporter avant/après dans la description de la PR (impact sur le mail hebdomadaire, cf. spec « Points d'attention »). Le nombre de couples ne peut qu'augmenter ou rester stable ; une baisse signale une erreur de jointure.

- [ ] **Step 5: Commit (sur accord de l'utilisateur)**

```bash
git add models/exposition/indicateur/indicateur_territoire.sql
git commit -m "feat(dbt): est_a_jour d'indicateur_territoire calculé par territoire"
```

---

### Task 3: Query `RecupererIndicateursNonAJourQuery`

**Files:**
- Create: `apps/pilote-ppg/src/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery.ts`
- Create: `apps/pilote-ppg/src/server/chantiers/__tests__/infrastructure/queries/RecupererIndicateursNonAJourQuery.integration.test.ts`
- Modify: `apps/pilote-ppg/src/server/chantiers/module.ts` (imports ~l.73, `ChantierExports` ~l.108, `exports` ~l.195, `register` ~l.336)

**Interfaces:**
- Consumes: `Inject<"prisma">` du module chantiers (`this.deps.prisma.getInstance()`), table `indicateur_territoire` (colonnes existantes).
- Produces (utilisé par Task 4) :

```ts
export type TerritoireEnRetard = {
  code: string;
  nom: string | null;
  dateDerniereValeur: string | null; // YYYY-MM-DD
  miseAJourAttendueDepuis: string | null; // YYYY-MM-DD
};
export type MailleIndicateurNonAJour = {
  maille: $Enums.Maille;
  nbTerritoiresApplicables: number;
  territoiresEnRetard: TerritoireEnRetard[];
};
export type IndicateurNonAJour = {
  id: string;
  nom: string;
  periodicite: string | null;
  delaiDisponibiliteMois: number | null;
  mailles: MailleIndicateurNonAJour[];
};
export type ChantierIndicateursNonAJour = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurNonAJour[];
};
export type RecupererIndicateursNonAJourResult = {
  chantiers: ChantierIndicateursNonAJour[];
  indicateursApplicablesIds: string[];
};
class RecupererIndicateursNonAJourQuery {
  execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
  }): Promise<RecupererIndicateursNonAJourResult>;
}
```
Clé DI exportée : `recupererIndicateursNonAJourQuery`.

- [ ] **Step 1: Écrire les tests d'intégration (en échec)**

```ts
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RecupererIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

const FINISTERE = {
  territoire_code: "DEPT-29",
  code_insee: "29",
  maille: "DEPT" as const,
  zone_id: "D29",
  territoire_nom: "Finistère",
};
const ILLE_ET_VILAINE = {
  territoire_code: "DEPT-35",
  code_insee: "35",
  maille: "DEPT" as const,
  zone_id: "D35",
  territoire_nom: "Ille-et-Vilaine",
};
const COTES_D_ARMOR = {
  territoire_code: "DEPT-22",
  code_insee: "22",
  maille: "DEPT" as const,
  zone_id: "D22",
  territoire_nom: "Côtes-d'Armor",
};

type TerritoireTest = typeof FINISTERE;

async function seedChantier(
  chantierId: string,
  territoires: TerritoireTest[],
  statut: "PUBLIE" | "BROUILLON" = "PUBLIE",
) {
  await fixtures.chantierIdentite({ id: chantierId, statut });
  for (const territoire of territoires) {
    const { territoire_nom: _nom, ...territoireChantier } = territoire;
    await fixtures.chantierTerritoire({ id: chantierId, ...territoireChantier });
  }
}

describe("RecupererIndicateursNonAJourQuery", () => {
  const query = new RecupererIndicateursNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  it(
    "regroupe les territoires en retard par chantier, indicateur et maille",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR]);
      await fixtures.indicateurIdentite({
        id: "IND-001",
        chantier_id: "CH-001",
        nom: "Nombre de bornes",
        periodicite: "Trimestrielle",
        delai_disponibilite: 1,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
        date_valeur_actuelle_mandat: new Date("2026-01-01"),
        prochaine_date_maj: new Date("2026-05-31"),
      });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: true,
        date_valeur_actuelle_mandat: new Date("2026-07-01"),
        prochaine_date_maj: new Date("2026-11-30"),
      });
      // Aucune valeur jamais remontée et est_a_jour NULL : compté en retard comme dans le mail
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...COTES_D_ARMOR,
        est_applicable: true,
        est_a_jour: null,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
      });

      // then
      expect(result).toEqual({
        chantiers: [
          {
            chantier: { id: "CH-001", nom: "Chantier CH-001" },
            indicateurs: [
              {
                id: "IND-001",
                nom: "Nombre de bornes",
                periodicite: "Trimestrielle",
                delaiDisponibiliteMois: 1,
                mailles: [
                  {
                    maille: "DEPT",
                    nbTerritoiresApplicables: 3,
                    territoiresEnRetard: [
                      {
                        code: "DEPT-22",
                        nom: "Côtes-d'Armor",
                        dateDerniereValeur: null,
                        miseAJourAttendueDepuis: null,
                      },
                      {
                        code: "DEPT-29",
                        nom: "Finistère",
                        dateDerniereValeur: "2026-01-01",
                        miseAJourAttendueDepuis: "2026-05-31",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        indicateursApplicablesIds: ["IND-001"],
      });
    }),
  );

  it(
    "exclut les territoires non applicables, hors périmètre, et les chantiers ou indicateurs non publiés",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE]);
      await seedChantier("CH-002", [FINISTERE], "BROUILLON");
      await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
      await fixtures.indicateurIdentite({
        id: "IND-003",
        chantier_id: "CH-001",
        statut: "SUPPRIME",
      });
      await fixtures.indicateurIdentite({ id: "IND-002", chantier_id: "CH-002" });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: false,
        est_a_jour: false,
      });
      // Hors des territoires demandés : ni listé ni compté
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...ILLE_ET_VILAINE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-003",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });
      await fixtures.indicateurTerritoire({
        id: "IND-002",
        chantier_id: "CH-002",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: false,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["DEPT-29"],
      });

      // then
      expect(result).toEqual({ chantiers: [], indicateursApplicablesIds: [] });
    }),
  );

  it(
    "renvoie un indicateur entièrement à jour dans indicateursApplicablesIds mais pas dans chantiers",
    createIntegrationTest(async () => {
      // given
      await seedChantier("CH-001", [FINISTERE]);
      await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
      await fixtures.indicateurTerritoire({
        id: "IND-001",
        chantier_id: "CH-001",
        ...FINISTERE,
        est_applicable: true,
        est_a_jour: true,
      });

      // when
      const result = await query.execute({
        chantierIds: ["CH-001"],
        territoireCodes: ["DEPT-29"],
        indicateurIds: ["IND-001", "IND-404"],
      });

      // then
      expect(result).toEqual({
        chantiers: [],
        indicateursApplicablesIds: ["IND-001"],
      });
    }),
  );
});
```

Note : si `chantierTerritoire` n'accepte pas `territoire_nom` (colonne absente de `chantier_territoire`), la déstructuration `territoire_nom: _nom` ci-dessus l'écarte. Si ESLint refuse la variable `_nom` inutilisée, utiliser un objet `territoireChantier` explicite (`{ territoire_code, code_insee, maille, zone_id }`).

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run (depuis `apps/pilote-ppg`): `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/RecupererIndicateursNonAJourQuery.integration.test.ts`
Expected: FAIL — module `RecupererIndicateursNonAJourQuery` introuvable.

- [ ] **Step 3: Implémenter la query**

```ts
import type { $Enums, Prisma } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";

export type TerritoireEnRetard = {
  code: string;
  nom: string | null;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

export type MailleIndicateurNonAJour = {
  maille: $Enums.Maille;
  nbTerritoiresApplicables: number;
  territoiresEnRetard: TerritoireEnRetard[];
};

export type IndicateurNonAJour = {
  id: string;
  nom: string;
  periodicite: string | null;
  delaiDisponibiliteMois: number | null;
  mailles: MailleIndicateurNonAJour[];
};

export type ChantierIndicateursNonAJour = {
  chantier: { id: string; nom: string };
  indicateurs: IndicateurNonAJour[];
};

export type RecupererIndicateursNonAJourResult = {
  chantiers: ChantierIndicateursNonAJour[];
  indicateursApplicablesIds: string[];
};

const ORDRE_MAILLES: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

const formaterDate = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : null;

const cleIndicateurMaille = (indicateurId: string, maille: $Enums.Maille) =>
  `${indicateurId}|${maille}`;

export class RecupererIndicateursNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCodes: string[];
    indicateurIds?: string[];
  }): Promise<RecupererIndicateursNonAJourResult> {
    const prisma = this.deps.prisma.getInstance();

    const perimetre: Prisma.indicateur_territoireWhereInput = {
      territoire_code: { in: params.territoireCodes },
      ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
      est_applicable: true,
      indicateur_identite: {
        chantier_id: { in: params.chantierIds },
        statut: "PUBLIE",
        chantier_identite: { statut: "PUBLIE" },
      },
    };

    const [comptesApplicables, lignesEnRetard] = await Promise.all([
      prisma.indicateur_territoire.groupBy({
        by: ["id", "maille"],
        where: perimetre,
        _count: { _all: true },
      }),
      prisma.indicateur_territoire.findMany({
        where: {
          ...perimetre,
          OR: [{ est_a_jour: false }, { est_a_jour: null }],
        },
        select: {
          maille: true,
          territoire_code: true,
          territoire_nom: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
          indicateur_identite: {
            select: {
              id: true,
              nom: true,
              periodicite: true,
              delai_disponibilite: true,
              chantier_identite: { select: { id: true, nom: true } },
            },
          },
        },
        orderBy: [{ chantier_id: "asc" }, { id: "asc" }, { territoire_code: "asc" }],
      }),
    ]);

    const nbApplicablesParIndicateurMaille = new Map(
      comptesApplicables.map((compte) => [
        cleIndicateurMaille(compte.id, compte.maille),
        compte._count._all,
      ]),
    );

    const chantiers = new Map<string, ChantierIndicateursNonAJour>();

    for (const ligne of lignesEnRetard) {
      const indicateurIdentite = ligne.indicateur_identite;
      const chantierIdentite = indicateurIdentite.chantier_identite;

      if (!chantiers.has(chantierIdentite.id)) {
        chantiers.set(chantierIdentite.id, {
          chantier: { id: chantierIdentite.id, nom: chantierIdentite.nom },
          indicateurs: [],
        });
      }
      const chantier = chantiers.get(chantierIdentite.id)!;

      let indicateur = chantier.indicateurs.find(
        (existant) => existant.id === indicateurIdentite.id,
      );
      if (!indicateur) {
        indicateur = {
          id: indicateurIdentite.id,
          nom: indicateurIdentite.nom,
          periodicite: indicateurIdentite.periodicite,
          delaiDisponibiliteMois: indicateurIdentite.delai_disponibilite,
          mailles: [],
        };
        chantier.indicateurs.push(indicateur);
      }

      let maille = indicateur.mailles.find(
        (existante) => existante.maille === ligne.maille,
      );
      if (!maille) {
        maille = {
          maille: ligne.maille,
          nbTerritoiresApplicables:
            nbApplicablesParIndicateurMaille.get(
              cleIndicateurMaille(indicateurIdentite.id, ligne.maille),
            ) ?? 0,
          territoiresEnRetard: [],
        };
        indicateur.mailles.push(maille);
      }

      maille.territoiresEnRetard.push({
        code: ligne.territoire_code,
        nom: ligne.territoire_nom,
        dateDerniereValeur: formaterDate(ligne.date_valeur_actuelle_mandat),
        miseAJourAttendueDepuis: formaterDate(ligne.prochaine_date_maj),
      });
    }

    for (const chantier of chantiers.values()) {
      for (const indicateur of chantier.indicateurs) {
        indicateur.mailles.sort(
          (gauche, droite) =>
            ORDRE_MAILLES.indexOf(gauche.maille) -
            ORDRE_MAILLES.indexOf(droite.maille),
        );
      }
    }

    return {
      chantiers: [...chantiers.values()],
      indicateursApplicablesIds: [
        ...new Set(comptesApplicables.map((compte) => compte.id)),
      ].sort(),
    };
  }
}
```

- [ ] **Step 4: Enregistrer et exporter la query dans le module chantiers**

Dans `src/server/chantiers/module.ts` :
- import, à côté de `GetChantiersSignalesDetailQuery` :
```ts
import { RecupererIndicateursNonAJourQuery } from "./infrastructure/queries/RecupererIndicateursNonAJourQuery";
```
- dans `type ChantierExports`, après `getChantiersSignalesDetailQuery` :
```ts
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
```
- dans le tableau `exports`, après `"getChantiersSignalesDetailQuery",` :
```ts
    "recupererIndicateursNonAJourQuery",
```
- dans `container.register({...})`, après `getChantiersSignalesDetailQuery: asModuleClass(...)` :
```ts
      recupererIndicateursNonAJourQuery: asModuleClass(
        RecupererIndicateursNonAJourQuery,
      ),
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Run: `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/RecupererIndicateursNonAJourQuery.integration.test.ts`
Expected: PASS (3 tests).

Si `groupBy` refuse le filtre relationnel `indicateur_identite` dans `where` (erreur Prisma à l'exécution), remplacer le `groupBy` par un `findMany` sur le même `perimetre` avec `select: { id: true, maille: true }` puis compter en mémoire par `cleIndicateurMaille` — le test reste inchangé.

- [ ] **Step 6: Typecheck et lint**

Run: `pnpm lint`
Expected: aucune erreur.

- [ ] **Step 7: Commit (sur accord de l'utilisateur)**

```bash
git add src/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery.ts src/server/chantiers/__tests__/infrastructure/queries/RecupererIndicateursNonAJourQuery.integration.test.ts src/server/chantiers/module.ts
git commit -m "feat(chantiers): query des indicateurs non à jour par territoire"
```

---

### Task 4: Outil Albert `get_indicateurs_non_a_jour`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/tools/getIndicateursNonAJour.ts`
- Create: `apps/pilote-ppg/src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`

**Interfaces:**
- Consumes: `RecupererIndicateursNonAJourQuery.execute({ chantierIds, territoireCodes, indicateurIds? })` et ses types (Task 3).
- Produces (utilisé par Task 5) :
  - `createGetIndicateursNonAJourTool({ recupererIndicateursNonAJourQuery })` → `({ chantiersAccessibles, territoiresAccessibles }: { chantiersAccessibles: string[]; territoiresAccessibles: string[] }) => Tool`
  - `type GetIndicateursNonAJourOutput`

- [ ] **Step 1: Écrire les tests unitaires (en échec)**

```ts
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursNonAJourTool,
  type GetIndicateursNonAJourOutput,
} from "@/server/albert/tools/getIndicateursNonAJour";
import type {
  RecupererIndicateursNonAJourQuery,
  RecupererIndicateursNonAJourResult,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

const RESULTAT_QUERY: RecupererIndicateursNonAJourResult = {
  chantiers: [
    {
      chantier: { id: "CH-001", nom: "Chantier bornes" },
      indicateurs: [
        {
          id: "IND-001",
          nom: "Nombre de bornes",
          periodicite: "Trimestrielle",
          delaiDisponibiliteMois: 1,
          mailles: [
            {
              maille: "DEPT",
              nbTerritoiresApplicables: 3,
              territoiresEnRetard: [
                {
                  code: "DEPT-29",
                  nom: "Finistère",
                  dateDerniereValeur: "2026-01-01",
                  miseAJourAttendueDepuis: "2026-05-31",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  indicateursApplicablesIds: ["IND-001"],
};

const buildTool = ({
  queryResult = RESULTAT_QUERY,
  territoiresAccessibles = ["NAT-FR", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
}: {
  queryResult?: RecupererIndicateursNonAJourResult;
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
} = {}) => {
  const query = mock<RecupererIndicateursNonAJourQuery>();
  query.execute.mockResolvedValue(queryResult);
  const tool = createGetIndicateursNonAJourTool({
    recupererIndicateursNonAJourQuery: query,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, query };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetIndicateursNonAJourTool>>,
  input: {
    chantier_ids?: string[];
    indicateur_ids?: string[];
    territoire_code?: string;
  },
): Promise<GetIndicateursNonAJourOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetIndicateursNonAJourOutput>;

describe("createGetIndicateursNonAJourTool execute", () => {
  test("refuse l'accès à un territoire non accessible sans appeler la query", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { territoire_code: "REG-11" });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
      _output_instructions: expect.any(String),
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("répond explicitement quand aucun chantier demandé n'est accessible", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { chantier_ids: ["CH-999"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("répond explicitement quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const { tool, query } = buildTool({ chantiersAccessibles: [] });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("sans argument, borne la query aux chantiers et territoires accessibles et ne renvoie que les compteurs", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
    });
    expect(result).toEqual({
      resultats: [
        {
          chantier: { id: "CH-001", nom: "Chantier bornes" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delai_disponibilite_mois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nb_territoires_en_retard: 1,
                  nb_territoires_applicables: 3,
                },
              ],
            },
          ],
        },
      ],
      _output_instructions: expect.stringContaining(
        "Le détail par territoire n'est pas inclus",
      ),
    });
  });

  test("ne transmet que les chantiers demandés accessibles", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    await executeTool(tool, { chantier_ids: ["CH-001", "CH-999"] });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
    });
  });

  test("avec indicateur_ids, renvoie le détail des territoires en retard", async () => {
    // Given
    const { tool } = buildTool();

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-001"] });

    // Then
    expect(result).toEqual({
      resultats: [
        {
          chantier: { id: "CH-001", nom: "Chantier bornes" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delai_disponibilite_mois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nb_territoires_en_retard: 1,
                  nb_territoires_applicables: 3,
                  territoires_en_retard: [
                    {
                      code: "DEPT-29",
                      nom: "Finistère",
                      date_derniere_valeur: "2026-01-01",
                      mise_a_jour_attendue_depuis: "2026-05-31",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      _output_instructions: expect.stringContaining(
        "Liste les territoires en retard",
      ),
    });
  });

  test("avec territoire_code, interroge ce seul territoire en mode détaillé", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { territoire_code: "DEPT-29" });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["DEPT-29"],
      indicateurIds: undefined,
    });
    expect(result._output_instructions).toContain(
      "Liste les territoires en retard",
    );
  });

  test("signale les indicateurs demandés qui ne sont suivis sur aucun territoire du périmètre", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: { chantiers: [], indicateursApplicablesIds: ["IND-001"] },
    });

    // When
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-002"],
      territoire_code: "DEPT-29",
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      indicateurs_non_suivis: ["IND-002"],
      _output_instructions: expect.stringContaining("IND-002"),
    });
  });
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`
Expected: FAIL — module `getIndicateursNonAJour` introuvable.

- [ ] **Step 3: Implémenter l'outil**

```ts
import { tool } from "ai";
import { z } from "zod";
import type { $Enums } from "@prisma/client";
import type {
  RecupererIndicateursNonAJourQuery,
  RecupererIndicateursNonAJourResult,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

export const getIndicateursNonAJourInputSchema = z.object({
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-042']). Absent = tous les chantiers accessibles à l'utilisateur (« mes chantiers »).",
    ),
  indicateur_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants d'indicateurs (ex: ['IND-894']). Si l'indicateur est décrit sans identifiant, résous-le d'abord avec search_indicateurs.",
    ),
  territoire_code: z
    .string()
    .optional()
    .describe(
      "Code d'un territoire (ex: NAT-FR, REG-53, DEPT-29) pour restreindre la recherche à ce seul territoire.",
    ),
});

type GetIndicateursNonAJourInput = z.infer<
  typeof getIndicateursNonAJourInputSchema
>;

type TerritoireEnRetardOutput = {
  code: string;
  nom: string | null;
  date_derniere_valeur: string | null;
  mise_a_jour_attendue_depuis: string | null;
};

type MailleOutput = {
  maille: $Enums.Maille;
  nb_territoires_en_retard: number;
  nb_territoires_applicables: number;
  territoires_en_retard?: TerritoireEnRetardOutput[];
};

type ResultatChantierOutput = {
  chantier: { id: string; nom: string };
  indicateurs: {
    id: string;
    nom: string;
    periodicite: string | null;
    delai_disponibilite_mois: number | null;
    mailles: MailleOutput[];
  }[];
};

export type GetIndicateursNonAJourOutput = {
  resultats: ResultatChantierOutput[];
  indicateurs_non_suivis?: string[];
  acces_refuse?: boolean;
  _output_instructions: string;
};

function versSortie(
  chantiers: RecupererIndicateursNonAJourResult["chantiers"],
  modeDetaille: boolean,
): ResultatChantierOutput[] {
  return chantiers.map(({ chantier, indicateurs }) => ({
    chantier,
    indicateurs: indicateurs.map((indicateur) => ({
      id: indicateur.id,
      nom: indicateur.nom,
      periodicite: indicateur.periodicite,
      delai_disponibilite_mois: indicateur.delaiDisponibiliteMois,
      mailles: indicateur.mailles.map((maille) => ({
        maille: maille.maille,
        nb_territoires_en_retard: maille.territoiresEnRetard.length,
        nb_territoires_applicables: maille.nbTerritoiresApplicables,
        ...(modeDetaille
          ? {
              territoires_en_retard: maille.territoiresEnRetard.map(
                (territoire) => ({
                  code: territoire.code,
                  nom: territoire.nom,
                  date_derniere_valeur: territoire.dateDerniereValeur,
                  mise_a_jour_attendue_depuis:
                    territoire.miseAJourAttendueDepuis,
                }),
              ),
            }
          : {}),
      })),
    })),
  }));
}

function buildOutputInstructions({
  modeDetaille,
  indicateursNonSuivis,
}: {
  modeDetaille: boolean;
  indicateursNonSuivis: string[];
}): string {
  const instructions = [
    'Présente chaque chantier au format "CH-XXX — Nom du chantier" et chaque indicateur au format "IND-XXX — Nom de l\'indicateur".',
    "Si la question porte sur les chantiers (« sur quels chantiers… »), liste les chantiers avec leur nombre d'indicateurs non à jour, sans détailler les indicateurs, puis propose le détail d'un chantier.",
    "Sinon, regroupe par chantier puis par indicateur, avec une ligne par maille au format « Départements : 12 / 101 territoires en retard » (« Régions » pour REG, « National » pour NAT).",
    "Si l'utilisateur demande pourquoi une donnée n'est pas à jour, explique que la date théorique de mise à jour (date de la dernière valeur + periodicite + delai_disponibilite_mois déclarés pour l'indicateur) est dépassée.",
  ];

  if (modeDetaille) {
    instructions.push(
      "Liste les territoires en retard avec la date à laquelle la mise à jour était attendue (mise_a_jour_attendue_depuis). Un territoire dont date_derniere_valeur est null n'a jamais eu de valeur renseignée : présente-le comme « aucune valeur renseignée ».",
    );
  } else {
    instructions.push(
      "Le détail par territoire n'est pas inclus. Propose à l'utilisateur de cibler un indicateur ou un territoire pour obtenir la liste des territoires en retard. Ne classe pas les territoires entre eux : cette information n'est pas disponible.",
    );
  }

  if (indicateursNonSuivis.length > 0) {
    instructions.push(
      `Ces indicateurs ne sont suivis sur aucun territoire du périmètre interrogé : ${indicateursNonSuivis.join(", ")}. Dis-le explicitement, ne les présente jamais comme à jour.`,
    );
  }

  instructions.push(
    "Si resultats est vide (hors indicateurs non suivis), dis explicitement que toutes les données du périmètre interrogé sont à jour.",
  );

  return instructions.join("\n\n");
}

export function createGetIndicateursNonAJourTool({
  recupererIndicateursNonAJourQuery,
}: {
  recupererIndicateursNonAJourQuery: RecupererIndicateursNonAJourQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Liste les indicateurs dont les données ne sont pas à jour (retard de mise à jour), par chantier, indicateur et maille, avec le nombre de territoires en retard.

Une donnée est non à jour quand sa date théorique de mise à jour (dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou quand aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur est applicable.

Utilise cet outil pour : « indicateurs non à jour », « retard de mise à jour », « données pas à jour », « données périmées », « mise à jour attendue », « territoires qui n'ont pas mis à jour l'indicateur X ».

⚠️ N'utilise PAS cet outil pour les chantiers « en retard » au sens de l'avancement (écart à la médiane) : c'est get_chantiers(view='en_retard').

Le détail nominatif des territoires en retard n'est renvoyé que si indicateur_ids ou territoire_code est fourni ; sinon seuls les compteurs par maille sont renvoyés.`,
      inputSchema: getIndicateursNonAJourInputSchema,
      execute: async (
        input: GetIndicateursNonAJourInput,
      ): Promise<GetIndicateursNonAJourOutput> => {
        if (
          input.territoire_code &&
          !territoiresAccessibles.includes(input.territoire_code)
        ) {
          return {
            resultats: [],
            acces_refuse: true,
            _output_instructions:
              "L'utilisateur n'a pas accès à ce territoire. Explique-le poliment sans donner de détail sur les données du territoire.",
          };
        }

        const chantierIdsDemandes =
          input.chantier_ids && input.chantier_ids.length > 0
            ? input.chantier_ids
            : undefined;

        if (chantierIdsDemandes) {
          const chantierIdsAccessibles = chantierIdsDemandes.filter(
            (chantierId) => chantiersAccessibles.includes(chantierId),
          );
          if (chantierIdsAccessibles.length === 0) {
            return {
              resultats: [],
              _output_instructions:
                "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
            };
          }
        } else if (chantiersAccessibles.length === 0) {
          return {
            resultats: [],
            _output_instructions:
              "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
          };
        }

        const chantierIds = chantierIdsDemandes
          ? chantierIdsDemandes.filter((chantierId) =>
              chantiersAccessibles.includes(chantierId),
            )
          : chantiersAccessibles;

        const indicateurIds =
          input.indicateur_ids && input.indicateur_ids.length > 0
            ? input.indicateur_ids
            : undefined;

        const modeDetaille = Boolean(indicateurIds || input.territoire_code);

        const resultat = await recupererIndicateursNonAJourQuery.execute({
          chantierIds,
          territoireCodes: input.territoire_code
            ? [input.territoire_code]
            : territoiresAccessibles,
          indicateurIds,
        });

        const indicateursNonSuivis = (indicateurIds ?? []).filter(
          (indicateurId) =>
            !resultat.indicateursApplicablesIds.includes(indicateurId),
        );

        return {
          resultats: versSortie(resultat.chantiers, modeDetaille),
          ...(indicateursNonSuivis.length > 0
            ? { indicateurs_non_suivis: indicateursNonSuivis }
            : {}),
          _output_instructions: buildOutputInstructions({
            modeDetaille,
            indicateursNonSuivis,
          }),
        };
      },
    });
  };
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit (sur accord de l'utilisateur)**

```bash
git add src/server/albert/tools/getIndicateursNonAJour.ts src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts
git commit -m "feat(albert): outil get_indicateurs_non_a_jour"
```

---

### Task 5: Câblage de l'outil et prompt système

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`
- Modify: `apps/pilote-ppg/src/server/albert/AssistantIA.ts:48-100` (`construireTools`)
- Modify: `apps/pilote-ppg/src/server/albert/systemPrompt.ts` (table « Comprendre les demandes utilisateur » ~l.420, nouveau pattern de workflow après « d. Chantiers signalés » ~l.483, section `search_indicateurs` ~l.517)
- Modify: `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.unit.test.ts`

**Interfaces:**
- Consumes: `createGetIndicateursNonAJourTool` (Task 4), `recupererIndicateursNonAJourQuery` exporté par le module chantiers (Task 3).
- Produces: outil `get_indicateurs_non_a_jour` dans `AssistantIA.outilsCharges(...)` et dans les tours d'agent (utilisé par Task 6).

- [ ] **Step 1: Écrire le test du prompt (en échec)**

Ajouter à `src/server/albert/__tests__/systemPrompt.unit.test.ts` :

```ts
describe("buildChatSystemPrompt — indicateurs non à jour", () => {
  it("décrit le routage vers get_indicateurs_non_a_jour et ses limites", () => {
    // when
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: false,
      },
    });

    // then
    expect(prompt).toContain("### e. Indicateurs non à jour");
    expect(prompt).toContain("get_indicateurs_non_a_jour");
    expect(prompt).toContain("pas d'historique");
  });
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `pnpm vitest run --project server-unit src/server/albert/__tests__/systemPrompt.unit.test.ts`
Expected: FAIL — `### e. Indicateurs non à jour` absent.

- [ ] **Step 3: Compléter le prompt système**

Dans `systemPrompt.ts` (le prompt est un template literal : échapper les backticks en `` \` ``) :

1. Ajouter deux lignes à la fin du tableau « Comprendre les demandes utilisateur », après la ligne « Plusieurs catégories de signalement… » :
```
| "indicateurs non à jour", "retard de mise à jour", "données pas à jour", "données périmées", "pas mis à jour" | get_indicateurs_non_a_jour — fraîcheur des données, à ne pas confondre avec view='en_retard' (avancement) |
| "sur quels chantiers y a-t-il des indicateurs non à jour" | get_indicateurs_non_a_jour() sans argument, restitution par chantier |
```

2. Ajouter après le bloc « ### d. Chantiers signalés » (avant « ## search_chantiers / search_indicateurs / search_territoires ») :
```
### e. Indicateurs non à jour
**Déclencheur** : l'utilisateur parle de fraîcheur des données — indicateurs non à jour, retard de mise à jour, données pas à jour ou périmées, territoires qui n'ont pas mis à jour un indicateur.

**Règle de routage** : « chantiers en retard » sans mention de mise à jour ou de données → \`get_chantiers(view='en_retard')\` (avancement). Dès qu'il est question de mise à jour des données → \`get_indicateurs_non_a_jour\`, **jamais** \`get_chantiers\` ni \`get_chantiers_signales\`.

**Protocole** :
1. Sur « mes chantiers » ou sans chantier précisé → appelle \`get_indicateurs_non_a_jour\` sans \`chantier_ids\`. Chantier précisé → \`chantier_ids\`. Territoire précisé → \`territoire_code\`.
2. Indicateur cité par son identifiant → \`indicateur_ids\`. Indicateur décrit par un libellé → \`search_indicateurs\` d'abord, puis \`indicateur_ids\`.
3. Si le résultat contient \`acces_refuse: true\`, explique poliment que l'utilisateur n'a pas accès à ce territoire.
4. Si \`indicateurs_non_suivis\` est présent, dis que ces indicateurs ne sont pas suivis sur ce périmètre — jamais qu'ils sont à jour.
5. Présente le résultat selon les \`_output_instructions\`.

**Définition** (à donner si l'utilisateur la demande) : une donnée est non à jour lorsque la date théorique de mise à jour (dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée, ou lorsqu'aucune valeur n'a jamais été renseignée sur un territoire où l'indicateur est applicable.

**Limites à annoncer explicitement** (ne jamais improviser une réponse) : pas de classement des territoires entre eux sans indicateur ou territoire ciblé ; pas d'échéances futures (seules les données déjà en retard sont consultables) ; pas d'historique (seul l'état actuel est disponible) ; pas de responsables de données (renvoyer vers la fiche indicateur) ; pas de contenu du mail hebdomadaire.
```

3. Dans la section « ## search_indicateurs », ajouter à la liste « choisis l'outil de données selon la demande » :
```
- fraîcheur des données de l'indicateur (à jour, en retard de mise à jour, territoires en retard) → \`get_indicateurs_non_a_jour\` avec l'\`indicateur_id\` résolu (\`id\`)
```

- [ ] **Step 4: Enregistrer la fabrique dans le module albert**

Dans `src/server/albert/module.ts` :
- import :
```ts
import { createGetIndicateursNonAJourTool } from "@/server/albert/tools/getIndicateursNonAJour";
```
- dans `AlbertOwnCradle`, après `createGetChantiersSignalesTool` :
```ts
  createGetIndicateursNonAJourTool: ReturnType<
    typeof createGetIndicateursNonAJourTool
  >;
```
- dans `container.register({...})`, après `createGetChantiersSignalesTool` :
```ts
      createGetIndicateursNonAJourTool: asModuleFunction(
        createGetIndicateursNonAJourTool,
      ),
```

- [ ] **Step 5: Exposer l'outil dans `AssistantIA.construireTools`**

Après l'entrée `get_chantiers_signales` :
```ts
      get_indicateurs_non_a_jour: container.resolve(
        "createGetIndicateursNonAJourTool",
      )({ territoiresAccessibles, chantiersAccessibles }),
```

- [ ] **Step 6: Lancer les tests et vérifier qu'ils passent**

Run:
```bash
pnpm vitest run --project server-unit src/server/albert
pnpm lint
```
Expected: PASS, aucune erreur de lint ni de typecheck (le `satisfies VerifyCradle<AlbertOwnCradle>` valide l'enregistrement).

- [ ] **Step 7: Commit (sur accord de l'utilisateur)**

```bash
git add src/server/albert/module.ts src/server/albert/AssistantIA.ts src/server/albert/systemPrompt.ts src/server/albert/__tests__/systemPrompt.unit.test.ts
git commit -m "feat(albert): exposition de get_indicateurs_non_a_jour et routage dans le prompt"
```

---

### Task 6: Evals de sélection d'outil

**Files:**
- Create: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts`
- Modify: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getChantiers.eval.ts` (tableau `CASES`)
- Modify: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getIndicateurs.eval.ts` (tableau `CASES`)
- Modify: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getChantiersSignales.eval.ts` (tableau `CASES`)

**Interfaces:**
- Consumes: `toolSelectionEval({ famille, tool, cases })`, `ToolCase` (`question`, `reason`, `expected?`, `forbidden?`), monde d'eval (`CH-018` porte `IND-018` et `IND-894` « Part des élèves lisant couramment en fin de CE1 » ; `IND-019` « Part des locaux raccordables à la fibre »). Les lignes `indicateur_territoire` semées n'ont pas de `est_a_jour` (NULL) : l'outil renvoie donc des résultats non vides, ce qui évite que l'agent enchaîne d'autres appels.
- Produces: suite « 2.2 · Données · get_indicateurs_non_a_jour ».

- [ ] **Step 1: Créer la suite de l'outil**

```ts
import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";

/**
 * Niveau 2 — `get_indicateurs_non_a_jour`.
 *
 * Une question par ligne « Répondable » du bilan de la spec
 * (docs/superpowers/specs/2026-10-08-indicateurs-non-a-jour-assistant-design.md).
 * R9 n'a pas de cas : la date de la dernière valeur relève aussi de
 * `get_evolution_indicateur`, les deux chemins sont légitimes.
 *
 * Les arguments vérifiés portent l'intention : `chantier_ids`,
 * `indicateur_ids`, et `territoire_code` uniquement pour NAT-FR (résoudre
 * « la Bretagne » relève du niveau 3).
 *
 * Les négatifs portent sur le mot « retard », qui désigne aussi l'avancement
 * (`get_chantiers`), et sur les valeurs des indicateurs (`get_indicateurs`).
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les indicateurs avec un retard de mise à jour sur mes chantiers ?",
    reason: "R1 — « mes chantiers » : appel sans argument",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Combien d'indicateurs ne sont pas à jour sur mes chantiers ?",
    reason: "R2 — total dérivé de R1",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Sur quels chantiers y a-t-il des indicateurs non à jour ?",
    reason: "R13 — restitution par chantier",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Quels sont les indicateurs non mis à jour sur le chantier CH-018 ?",
    reason: "R3 — chantier explicite",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question:
      "Sur quels territoires les données de l'indicateur IND-894 ne sont pas à jour ?",
    reason: "R4 — indicateur explicite : mode détaillé",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Où les données de l'indicateur 894 ne sont-elles pas à jour ?",
    reason: "R4 — numéro seul complété en IND-894",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "La part des locaux raccordables à la fibre est-elle à jour partout ?",
    reason: "R5 — libellé : search_indicateurs puis l'outil",
    expected: [
      { toolName: "search_indicateurs" },
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-019"] },
      },
    ],
  },
  {
    question: "Quels indicateurs ne sont pas à jour en Bretagne ?",
    reason: "R6 — territoire précisé",
    expected: [{ toolName: "get_indicateurs_non_a_jour" }],
  },
  {
    question: "Les données du CH-018 sont-elles à jour en Bretagne ?",
    reason: "R7 — chantier et territoire",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { chantier_ids: ["CH-018"] },
      },
    ],
  },
  {
    question: "Depuis quand l'IND-894 n'est-il pas à jour en Bretagne ?",
    reason: "R8 — date attendue de mise à jour",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Quels territoires n'ont jamais renseigné l'IND-894 ?",
    reason: "R10 — territoires sans valeur",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "Pourquoi l'IND-894 est-il considéré comme pas à jour ?",
    reason: "R11 — explication par périodicité et délai",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"] },
      },
    ],
  },
  {
    question: "L'IND-894 est-il à jour au niveau national ?",
    reason: "R12 — national explicite",
    expected: [
      {
        toolName: "get_indicateurs_non_a_jour",
        input: { indicateur_ids: ["IND-894"], territoire_code: "NAT-FR" },
      },
    ],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason: "CAS NÉGATIF : retard d'avancement → get_chantiers(view='en_retard')",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
  {
    question: "Quelles sont les valeurs des indicateurs du CH-004 au national ?",
    reason: "CAS NÉGATIF : valeurs des indicateurs → get_indicateurs",
    forbidden: ["get_indicateurs_non_a_jour"],
  },
];

toolSelectionEval({
  famille: "donnees",
  tool: "get_indicateurs_non_a_jour",
  cases: CASES,
});
```

- [ ] **Step 2: Ajouter les négatifs dans les suites voisines**

`getChantiers.eval.ts`, à la fin de `CASES` :
```ts
  {
    question: "Quels indicateurs ont un retard de mise à jour en Bretagne ?",
    reason:
      "CAS NÉGATIF : « retard de mise à jour » = fraîcheur → get_indicateurs_non_a_jour, pas view en_retard",
    forbidden: ["get_chantiers"],
  },
  {
    question: "Quels chantiers ont des données pas à jour en Corse ?",
    reason:
      "CAS NÉGATIF : données pas à jour = fraîcheur → get_indicateurs_non_a_jour",
    forbidden: ["get_chantiers"],
  },
```
et compléter le commentaire d'en-tête (« Les négatifs portent sur… ») par : « , et le retard de mise à jour des données, que le prompt système réserve à `get_indicateurs_non_a_jour`. »

`getIndicateurs.eval.ts`, à la fin de `CASES` :
```ts
  {
    question: "Les indicateurs du CH-004 sont-ils à jour au national ?",
    reason:
      "CAS NÉGATIF : fraîcheur des données → get_indicateurs_non_a_jour",
    forbidden: ["get_indicateurs"],
  },
```

`getChantiersSignales.eval.ts`, à la fin de `CASES` :
```ts
  {
    question: "Quels chantiers ont des indicateurs non mis à jour en Bretagne ?",
    reason:
      "CAS NÉGATIF : pas une catégorie de signalement → get_indicateurs_non_a_jour",
    forbidden: ["get_chantiers_signales"],
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm lint`
Expected: aucune erreur.

- [ ] **Step 4: Lancer les evals (sur accord de l'utilisateur — appels LLM facturés)**

Demander à l'utilisateur avant de lancer, puis :
```bash
DOTENV_CONFIG_PATH=.env.test pnpm exec evalite run evals/2-tools/2.2-donnees
```
Expected: la suite `get_indicateurs_non_a_jour` et les suites voisines s'exécutent. Reporter les scores à l'utilisateur ; un cas sous 100 % se corrige d'abord dans la description de l'outil ou la section « e. Indicateurs non à jour » du prompt, puis on relance la suite concernée. Ne pas affaiblir un cas pour le faire passer.

- [ ] **Step 5: Commit (sur accord de l'utilisateur)**

```bash
git add evals/2-tools/2.2-donnees
git commit -m "test(albert): evals de sélection pour get_indicateurs_non_a_jour"
```

---

### Task 7: Vérification finale

- [ ] **Step 1: Suites de tests**

Run (depuis `apps/pilote-ppg`):
```bash
pnpm test:unit
pnpm vitest run --project server-integration src/server/chantiers
```
Expected: PASS. Rappel : l'échec préexistant de `MinistèreSQLRepository` n'est pas lié à ce travail — le signaler sans le corriger.

- [ ] **Step 2: E2E**

Demander à l'utilisateur s'il souhaite lancer `pnpm test:e2e` (changement transverse : dbt + assistant).

- [ ] **Step 3: Description de PR**

Inclure : mesures avant/après de la Task 2 (impact mail), rappel de l'ordre de déploiement (dbt puis app, non bloquant), scores des evals de la Task 6.
