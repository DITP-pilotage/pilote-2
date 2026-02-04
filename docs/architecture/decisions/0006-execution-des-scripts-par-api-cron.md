# 6. Exécution des scripts CRON par API

Date : 2026-02-03

## Statut

Accepté

## Contexte

Avant cette décision, l'exécution des scripts CRON (rapports hebdomadaires PVA et coordinateurs) se faisait via des scripts shell (`run_rapport_pva.sh` et `run_rapport_coordinateurs.sh`). Cette approche présentait plusieurs problèmes :

1. **Gestion des dépendances séparée** : Chaque script devait exécuter `npm ci` pour installer les dépendances, ce qui allongeait le temps d'exécution et consommait des ressources inutilement
2. **Compilation TypeScript séparée** : Les scripts utilisaient `npx tsx` pour compiler et exécuter le TypeScript à la volée, créant un processus de build distinct de celui de Next.js
3. **Configuration d'environnement à part** : La logique de vérification des feature flags et de l'environnement était dupliquée dans les scripts shell
4. **Observabilité limitée** : Les logs des scripts shell étaient moins structurés et plus difficiles à intégrer avec le reste de l'application
5. **Testabilité réduite** : Les scripts shell sont plus difficiles à tester unitairement que du code TypeScript

## Décision

Nous remplaçons l'exécution des scripts CRON par des endpoints API Next.js :

- **Endpoints dédiés** : `/api/admin/cron/rapports-pva` et `/api/admin/cron/rapports-coordinateurs`
- **Protection par middleware** : Création d'un middleware `onlyCron` qui vérifie :
  - La méthode HTTP (POST uniquement)
  - Le header `Authorization` avec un Bearer token
  - La validité du secret partagé via la variable d'environnement `CRON_AUTH_SECRET`
- **Exécution via HTTP** : Les cron jobs utilisent `curl` pour appeler les endpoints au lieu d'exécuter des scripts shell
- **Centralisation** : Toute la logique métier reste dans le code TypeScript de l'application
- **Même processus de build** : Les scripts CRON utilisent le même build Next.js que le reste de l'application
- **Refactoring de la gestion d'erreurs** : Extraction de `errorHandler` et renommage de `errorBoundary` en `endpointProtege` pour une meilleure réutilisation

## Conséquences

### Avantages

- **Performance** : Plus besoin de `npm ci` ni de compilation TypeScript à chaque exécution
- **Cohérence** : Un seul processus de build pour toute l'application
- **Observabilité** : Les logs structurés de Next.js s'appliquent aux scripts CRON, facilitant le monitoring et le debugging
- **Testabilité** : Les endpoints peuvent être testés unitairement avec Jest (voir `onlyCron.unit.test.ts` et `endpoint-protege.unit.test.ts`)
- **Maintenance** : Moins de duplication de code, la logique métier reste centralisée
- **Sécurité** : Authentification par secret partagé pour empêcher l'exécution non autorisée

### Inconvénients et risques

- **Dépendance à l'application** : Les scripts CRON nécessitent que l'application Next.js soit en cours d'exécution. Si l'application est down, les CRON ne peuvent pas s'exécuter
- **Gestion des secrets** : Nécessite de configurer et maintenir la variable `CRON_AUTH_SECRET` dans tous les environnements
- **Changement d'approche** : Passage d'une approche "script autonome" à une approche "endpoint HTTP", ce qui peut nécessiter des ajustements dans l'infrastructure de déploiement
- **Timeout potentiel** : Les endpoints API peuvent avoir des limites de timeout (à surveiller pour les traitements longs)
