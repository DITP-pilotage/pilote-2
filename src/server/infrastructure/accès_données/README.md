Le répertoire `accès_données` contient les implémentations des accès à toutes les sources de données dont on dépend, en lecture ou en écriture. À ce jour la seule source de données dont dépend la Webapp est Postgres.

Note : les implémentations des accès aux données sont ici, côté `infrastructure`, mais les interfaces dont le code métier peut dépendre (eg. les interfaces des repositories) sont définies dans le répertoire `src/server/domain` (ce qui fait que le code métier ne dépend pas du code d'infrastructure).
