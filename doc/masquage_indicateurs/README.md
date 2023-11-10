# Masquage des indicateurs

Pour masquer les indicateurs, on crée viA *dbt* une table [`metadata_indicateurs_hidden`](../../data_management/data_factory/models/raw/ppg_metadata/metadata_indicateurs_hidden.py) qui contiendra tous les indicateurs, masqués et non masqués.

On crée également une seconde [`metadata_indicateurs`](../../data_management/data_factory/models/raw/ppg_metadata/metadata_indicateurs.sql) qui aura la même structure que `metadata_indicateurs_hidden` mais uniquement avec les indicateurs **non masqués**. Tout le reste de l'application est basé sur cette table, sauf l'interface de gestion des utilisateurs qui doit être en mesure de réactiver des indicateurs masqués.
Comme `metadata_indicateurs` est une table, elle ne sera mise à jour uniquement lors de l'exécution des datajobs. Ainsi, un indicateur désactivé continuera à apparaitre dans l'appli. Ce chois a été fait pour consever le cohérence entre ce que l'on *voit* et le *résultat des calculs* (TA chantier) qui eux ne sont pas calculés en temps réel.

![](./masquage_indicateurs.png)

Ce grahique décrit la logique avant et après cette implémentation. 
