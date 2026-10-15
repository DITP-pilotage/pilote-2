# 10. Rationaliser le paramétrage du calcul des VACA/VACG

Date : 2026-10-15

## Statut

Accepté

## Contexte

La valeur d'avancement comparable annuelle (VACA) et globale (VACG) est calculée par dbt (`compute_vaca`, `compute_vacg`) à partir des valeurs d'avancement importées et de trois paramètres par indicateur, saisis dans PILOTE (`raw_data.metadata_parametrage_indicateurs`) :

- `param_vac*_decumul_from` : les valeurs importées sont-elles déjà cumulées, et depuis quand ;
- `param_vac*_partition_date` : sur quelle fenêtre cumuler les valeurs ;
- `param_vac*_op` : quelle opération appliquer.

Ce que PILOTE permettait de saisir ne correspondait pas exactement à ce que dbt calcule :

- les colonnes acceptaient NULL : avec un décumul NULL, dbt décumulait implicitement tout l'historique ; avec un cumul ou une opération NULL, la VAC était NULL ;
- PILOTE proposait la moyenne sous le code `avg`, alors que dbt ne connaissait que `moy` : un indicateur paramétré en moyenne n'avait pas de VAC ;
- `from_custom_date::AAAA-MM-JJ` portait une date que dbt n'utilisait pas (partition sur une constante, donc sur tout l'historique), et une date mal formée faisait échouer tout le run dbt ;
- aucune valeur n'était contrôlée à la saisie, ni dans le formulaire ni à l'import en masse.

Un audit sur une copie de la production a montré qu'aucune ligne n'était NULL, que la moyenne n'avait jamais été utilisée, y compris dans l'historique des modifications, et que `from_custom_date::2019-01-01` était la seule date employée.

## Décision

- Les six colonnes `param_vac*` sont NOT NULL, avec pour valeurs par défaut `_` (décumul, cumul) et `current_value` (opération).
- La moyenne est supprimée : les opérations acceptées sont `current_value` et `sum`.
- `from_custom_date::AAAA-MM-JJ` est remplacé par `from_beginning`, sans date : le décumul ou le cumul porte sur tout l'historique de l'indicateur.
- Les valeurs acceptées sont contrôlées à la saisie par `metadata_indicateur.validation_regex` :
  - décumul : `_`, `from_year_start`, `from_beginning` ;
  - cumul : `_`, `from_year_start`, `from_beginning`, `from_previous_month::12` ;
  - opération : `current_value`, `sum`.
- dbt vérifie les mêmes valeurs sur la source (`not_null`, `accepted_values`) et des tests unitaires couvrent `compute_vaca` et `compute_vacg` pour chaque combinaison.

La migration de données et le changement de dbt sont livrés ensemble : l'app et les datajobs sont déployés en même temps, et les datajobs sont relancés à l'issue du déploiement. dbt ne garde donc pas de compatibilité avec `from_custom_date`.

## Conséquences

- Le calcul des VACA/VACG, et donc des taux d'avancement, est inchangé pour tous les indicateurs existants.
- Une valeur de paramétrage hors de cette liste est refusée par PILOTE et fait échouer les tests dbt, au lieu de produire silencieusement une VAC NULL ou un run dbt en échec.
- Un fichier d'import en masse exporté avant ce changement et contenant `from_custom_date::2019-01-01` est refusé : il faut le réexporter ou remplacer la valeur par `from_beginning`.
- Réintroduire la moyenne demandera de l'ajouter à la fois aux valeurs acceptées, à la regex et à dbt, sous un même code.
- Les fenêtres glissantes de 3, 6 et 48 mois restent calculées par dbt mais ne sont plus saisissables.
