# Assistant kpilote — lot 4 : composition visuelle (dashboards)

Date : 2026-11-04 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-composition` (empilée sur le lot 3)
Référence PPG : `create_dashboard` (`tools/createDashboard.ts`, `composeDashboard.ts`, `composeDashboardLayout.ts`,
`subagents/dashboardSystemPrompt.ts`), rendu `ChatUI/DashboardRender.tsx` + `DashboardWidgets/`, « Copier l'image » (PIL-1859, PIL-1900).

## Intention

« Trace la courbe de IND-42 dans le Nord et le Pas-de-Calais », « un tableau de bord de la collection emploi
pour la Bretagne » : l'assistant compose un **dashboard** affiché dans la discussion, dont les widgets lisent
eux-mêmes leurs données. L'utilisateur peut le copier en image.

## Décisions

- **Comme PPG** : un seul outil exposé, `create_dashboard({ task, indicateurIds?, collectionIds?, individuIds,
  referentielIds? })`. Il délègue la mise en page à un sous-agent (`generateStructured`, un seul résultat, pas de
  streaming) qui ne voit que la tâche et un contexte JSON résolu par le code (noms et identifiants lisibles).
- **Aucun chiffre dans la sortie** : un widget ne porte que des références (identifiants). Les valeurs sont lues
  au rendu par les requêtes existantes de la webapp, donc avec les droits de l'utilisateur, et à jour à la
  réouverture. Seuls textes libres : `titre_section` (sans chiffre, contrôlé) et `paragraph`.
- **Validation a posteriori** (PPG `validateDashboardIdentifiers`) : tout identifiant d'un widget doit venir du
  contexte, sinon erreur corrigeable par le modèle principal. Entités illisibles → `notFound` avant le sous-agent.
- **Schéma** : `titre` (≤ 120), `containers` (1..10) de `widgets` (1..8) sur une grille de 4 colonnes, largeur par
  défaut et largeurs permises par type ; discriminant `z.enum` (pas `z.literal`, gpt-oss ignore `const`).
- **Catalogue kpilote** — *ma proposition, à valider* :
  | Widget | Références | Rendu (réutilisé si possible) |
  |---|---|---|
  | `kpi_indicateur` | indicateur, individu | dernière valeur, objectif, taux (StatCard + ProgressBar) |
  | `kpi_collection` | collection, individu | taux pondéré de la collection |
  | `evolution_indicateur` | indicateur, 1..5 individus | courbe ECharts (dérivée d'`IndicateurValeursChart`, multi-séries) |
  | `tableau_individus` | indicateur, 2..20 individus | DataTable : valeur, objectif, taux, écart à la médiane |
  | `contributions_collection` | collection, individu | DataTable des indicateurs : pondération, taux |
  | `valeurs_remarquables` | indicateur, référentiel | min, médiane, max (StatGrid) |
  | `carte_indicateur` | indicateur, référentiel avec widget carte | `CarteFranceWidget` existant |
  | `titre_section`, `paragraph` | — | texte (paragraphe copié du contexte) |
- **Prompt principal** (règles PPG) : « courbe », « graphique », « carte », « tableau de bord », « visualise » →
  dashboard ; « comment évolue » → données, sans dashboard ; une demande hors catalogue (camembert, histogramme…)
  → `clarify_with_choices` avec ce qui est faisable ; après un dashboard, une phrase, sans répéter de chiffre.
- **Front** : `DashboardRender` (titre, containers en grille 4 colonnes, `Suspense` + chargement « Composition du
  tableau de bord… », erreur par widget isolée), état « compose le tableau de bord », sortie en erreur → rien.
  **« Copier l'image »** à côté de « Copier le texte » quand la réponse a un dashboard (`html-to-image`, PNG
  `pixelRatio` 2, promesse construite pendant le clic pour Safari).
- **Hors lot** : dashboards sauvegardés hors conversation, tracking (lot 7), évals (lot 8).

## Tests

Schéma (types, `.strict`, bornes, discriminant sans `const`) ; validation des identifiants (chaque famille) ;
outil (entité illisible → `notFound` sans sous-agent ; id inventé → erreur ; succès → sortie validée, sous-appel
tracé) ; titre de section chiffré refusé ; prompt principal ; front : état, présence de « Copier l'image ».
