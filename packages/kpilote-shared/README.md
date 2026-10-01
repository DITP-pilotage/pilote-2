# @pilote/kpilote-shared

Code TypeScript pur partagé entre [kpilote-api](../../apps/kpilote-api), [kpilote-webapp](../../apps/kpilote-webapp), [kpilote-admin](../../apps/kpilote-admin) et [`@pilote/kpilote-ui`](../kpilote-ui) : schémas Zod des contrats d'API, types dérivés et utilitaires sans dépendance à React ni au serveur.

Le package n'est ni buildé ni publié : les consommateurs importent directement les sources via le workspace pnpm. `zod` est une `peerDependency`.

## Utilisation

```json
"@pilote/kpilote-shared": "workspace:*"
```

Chaque module est exposé par un point d'entrée dédié :

```ts
import {
  indicateurApiModelSchema,
  type FonctionAgregation,
} from '@pilote/kpilote-shared/indicateur'
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { errorApiModelSchema } from '@pilote/kpilote-shared/error'
```

Côté API, ces schémas servent à la validation des routes et à la génération de la spec OpenAPI (`.openapi(...)`). Côté front, ils typent les réponses et alimentent les formulaires (React Hook Form + `zodResolver`). Un contrat modifié ici s'applique donc aux deux côtés à la fois.

## Contenu

| Catégorie                | Modules                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Entités                  | `indicateur`, `referentiel`, `individu`, `relation`, `collection`, `collectionContactUtile`, `utilisateur`, `responsable`, `widget` |
| Valeurs et calculs       | `valeurAvancement`, `valeurImport`, `objectifIndicateurIndividu`, `tauxProgression`, `collectionTauxProgression`, `niveauConfiance` |
| Commentaires et contenus | `commentaire`, `auteur`, `centreAide`                                                                                               |
| Accès                    | `apiKey`, `permission`, `me`, `mePermissions`, `feature`, `meFeature`                                                               |
| Transverse               | `error`, `pagination`, `publicIds`, `dates`, `formatDate`, `texte`, `url`, `console`                                                |
| Analytics                | `analytics/schema`, `analytics/events`, `analytics/buckets`, `analytics/buildRequest`, `analytics/browser`                          |

`console` décrit le contrat de la console API de kpilote-admin (enveloppe de requête relayée par le BFF).

## Conventions

- **Logique pure uniquement** : pas de React, pas d'accès base, pas d'I/O. Les composants vont dans `@pilote/kpilote-ui`.
- Noms génériques, sans référence à une app en particulier.
- Verbes et termes techniques en anglais, noms d'entités en français (`indicateurApiModelSchema`, `listIndicateursQuerySchema`).
- Descriptions Zod (`.describe(...)`) en français : elles alimentent la documentation OpenAPI.

## Ajouter un module

1. Créer `src/monModule.ts`.
2. Déclarer l'entrée dans `package.json` :
   ```json
   "./monModule": {
     "types": "./src/monModule.ts",
     "default": "./src/monModule.ts"
   }
   ```

## Commandes

```bash
pnpm -F @pilote/kpilote-shared test     # Vitest
pnpm -F @pilote/kpilote-shared lint     # oxlint + tsc + prettier
pnpm -F @pilote/kpilote-shared format
```

En CI, une modification de ce package déclenche aussi les tests de kpilote-api.
