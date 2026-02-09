# Breaking Changes - Mise à jour des dépendances

Date : 2026-02-02

Ce document liste les breaking changes à prendre en compte lors de la montée de version des dépendances du projet.

---

## Checklist de migration

### Étape 1 : Préparation
- [ ] Créer une branche dédiée : `git checkout -b feat/upgrade-dependencies`
- [ ] Sauvegarder le `package-lock.json` actuel
- [ ] S'assurer que tous les tests passent avant de commencer

### Étape 2 : TypeScript (5.2 → 5.9)
- [ ] Installer la nouvelle version : `npm install typescript@5.9.3 -D`
- [ ] Exécuter `npx tsc --noEmit` et corriger les erreurs
- [ ] Vérifier le `tsconfig.json`

### Étape 3 : React (18 → 19)
- [ ] Exécuter le codemod : `npx types-react-codemod@latest preset-19 ./src`
- [ ] Mettre à jour les packages : `npm install react@^19.2.3 react-dom@^19.2.3`
- [ ] Mettre à jour les types : `npm install @types/react@^19.2.8 @types/react-dom@^19.2.3 -D`
- [ ] Rechercher `useRef<` sans valeur initiale et corriger
- [ ] Rechercher `forwardRef` et évaluer si encore nécessaire
- [ ] Exécuter les tests client

### Étape 4 : Next.js (14 → 16)
- [ ] Mettre à jour : `npm install next@^16.1.2 @next/env@16.1.2`
- [ ] Vérifier `next.config.js` pour les options dépréciées
- [ ] Tester le build : `npm run build`
- [ ] Tester le dev : `npm run dev`
- [ ] Auditer les usages de cache

### Étape 5 : TanStack Query (v4 → v5)
- [ ] Mettre à jour : `npm install @tanstack/react-query@^5.90.19 @tanstack/react-query-devtools@^5.91.2`
- [ ] Rechercher et migrer les signatures `useQuery(['key'], fn)` → `useQuery({ queryKey, queryFn })`
- [ ] Rechercher et migrer les signatures `useMutation(fn)` → `useMutation({ mutationFn })`
- [ ] Rechercher `onSuccess`/`onError` dans useQuery et migrer vers useEffect
- [ ] Rechercher `isLoading` et évaluer si doit devenir `isPending`
- [ ] Rechercher `cacheTime` et remplacer par `gcTime`
- [ ] Exécuter les tests

### Étape 6 : tRPC (v10 → v11)
- [ ] Mettre à jour : `npm install @trpc/client@^11.6.0 @trpc/server@^11.6.0 @trpc/next@^11.6.0 @trpc/react-query@^11.6.0`
- [ ] Vérifier la configuration du client tRPC
- [ ] Vérifier les imports et adapters
- [ ] Exécuter les tests

### Étape 7 : NextAuth (v4 → v5)
- [ ] Installer : `npm install next-auth@5.0.0-beta.30`
- [ ] Installer le nouvel adapter : `npm install @auth/prisma-adapter`
- [ ] Créer le fichier `auth.ts` à la racine
- [ ] Migrer `pages/api/auth/[...nextauth].ts` vers `app/api/auth/[...nextauth]/route.ts`
- [ ] Migrer `getServerSession` vers `auth()`
- [ ] Mettre à jour les callbacks
- [ ] Tester login/logout/refresh
- [ ] Supprimer l'ancien adapter `@next-auth/prisma-adapter` si présent

### Étape 8 : ESLint (8 → 9 + Flat Config)
- [ ] Supprimer node_modules et package-lock.json
- [ ] Exécuter `npm install`
- [ ] Tester le lint : `npm run lint:eslint`
- [ ] Corriger les règles manquantes ou conflits
- [ ] Supprimer `.eslintrc.json.backup` une fois la migration validée

### Étape 9 : Validation finale
- [ ] Exécuter tous les tests : `npm run test`
- [ ] Exécuter les tests E2E : `npm run test:e2e`
- [ ] Tester manuellement l'application
- [ ] Review du code et merge

---

## Table des matières détaillée

1. [Next.js 14 → 16](#nextjs-14--16)
2. [React 18 → 19](#react-18--19)
3. [tRPC v10 → v11](#trpc-v10--v11)
4. [TanStack Query v4 → v5](#tanstack-query-v4--v5)
5. [NextAuth v4 → v5](#nextauth-v4--v5)
6. [TypeScript 5.2 → 5.9](#typescript-52--59)
7. [@typescript-eslint v5 → v8](#typescript-eslint-v5--v8)

---

## Next.js 14 → 16

### Sources
- [Next.js 16 Blog](https://nextjs.org/blog/next-16)
- [Guide de mise à jour vers v16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16.1 Blog](https://nextjs.org/blog/next-16-1)

### Breaking Changes majeurs

#### 1. Turbopack par défaut
- Turbopack est maintenant stable et utilisé par défaut pour `next dev` et `next build`
- Vérifier que les configurations webpack personnalisées sont compatibles ou migrer vers les équivalents Turbopack

#### 2. React 19.2 requis
- L'App Router utilise React 19.2 par défaut
- Inclut View Transitions, `useEffectEvent()`, et Activity components

#### 3. React Compiler intégré
- Le React Compiler est maintenant stable et intégré
- Memoization automatique des composants
- Peut impacter les composants qui dépendaient d'un comportement spécifique de re-render

#### 4. Cache Components et "use cache"
- Nouveau système de cache opt-in avec la directive "use cache"
- Le caching implicite des versions précédentes n'existe plus
- **Action requise**: Auditer les usages de cache existants et migrer vers les nouvelles APIs

#### 5. Changements de configuration
- Certaines options de `next.config.js` peuvent avoir changé
- Vérifier la compatibilité des middlewares et API routes

### Actions recommandées

1. Lire le guide de migration complet : https://nextjs.org/docs/app/guides/upgrading/version-16
2. Tester le build avec Turbopack : `next build --turbopack`
3. Auditer les usages de cache
4. Vérifier les middlewares et API routes

---

## React 18 → 19

### Sources
- [React 19 Blog](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19.2 Blog](https://react.dev/blog/2025/10/01/react-19-2)

### Breaking Changes majeurs

#### 1. Suppression des APIs dépréciées
- `ReactDOM.render` supprimé → utiliser `createRoot`
- `ReactDOM.hydrate` supprimé → utiliser `hydrateRoot`
- `react-test-renderer` déprécié → utiliser `@testing-library/react`

#### 2. Changements de typage (TypeScript)
- `ReactElement` a des génériques différents
- `useRef` requiert un argument initial (pas de `useRef<T>()` sans argument)
- `ReactNode` n'inclut plus `{}`
- Utiliser le codemod : `npx types-react-codemod@latest preset-19 ./src`

#### 3. Strict Mode plus strict
- Détection améliorée des effets de bord dans les composants
- Double-invocation des fonctions en développement

#### 4. Nouvelles fonctionnalités
- `use` hook pour lire des ressources (Promises, Context)
- Actions et `useActionState` pour les formulaires
- `useOptimistic` pour les mises à jour optimistes
- Server Components support natif

#### 5. Ref comme prop
- Les refs peuvent maintenant être passées directement comme props (pas besoin de `forwardRef` dans tous les cas)

### Actions recommandées

1. Exécuter le codemod pour les types : `npx types-react-codemod@latest preset-19 ./src`
2. Remplacer les usages de `ReactDOM.render` et `ReactDOM.hydrate`
3. Auditer les composants qui utilisent `forwardRef`
4. Vérifier les usages de `useRef` sans valeur initiale

---

## tRPC v10 → v11

### Sources
- [tRPC v11 Documentation](https://trpc.io/docs/client/nextjs)
- [Guide de migration tRPC](https://trpc.io/docs/migrate-from-v10-to-v11)

### Breaking Changes majeurs

#### 1. Nouvelle architecture client
- Nouveau package `@trpc/tanstack-react-query` remplace une partie de `@trpc/react-query`
- Configuration du client modifiée

#### 2. Support React Server Components
- Intégration native avec les RSC de Next.js
- Nouveau pattern "Query-native" pour l'App Router

#### 3. Changements d'API
- `createTRPCNext` peut avoir des options différentes
- Les hooks peuvent avoir de légères différences de signature
- Vérifier les imports et adapters

#### 4. Dépendance TanStack Query v5
- tRPC v11 requiert TanStack Query v5
- Voir la section TanStack Query pour les breaking changes associés

### Actions recommandées

1. Lire le guide de migration officiel
2. Mettre à jour la configuration du client tRPC
3. Vérifier tous les usages des hooks tRPC
4. Tester l'intégration avec les Server Components si utilisés

---

## TanStack Query v4 → v5

### Sources
- [Guide de migration v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

### Breaking Changes majeurs

#### 1. `useQuery` signature modifiée
```typescript
// Avant (v4)
useQuery(['todos'], fetchTodos, { staleTime: 5000 })

// Après (v5)
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, staleTime: 5000 })
```
- Toutes les options passent par un objet unique

#### 2. `useMutation` signature modifiée
```typescript
// Avant (v4)
useMutation(postTodo, { onSuccess: ... })

// Après (v5)
useMutation({ mutationFn: postTodo, onSuccess: ... })
```

#### 3. Callbacks supprimés de `useQuery`
- `onSuccess`, `onError`, `onSettled` supprimés de `useQuery`
- Utiliser `useEffect` ou gérer dans le `queryFn`

#### 4. `status: 'loading'` → `status: 'pending'`
- Le status `loading` est renommé en `pending`
- `isLoading` → `isPending` pour les queries sans données en cache
- `isInitialLoading` → `isLoading` (nouveau comportement)

#### 5. React 18+ requis
- React 18 minimum pour le hook `useSyncExternalStore`

#### 6. QueryClient configuration
- Certaines options par défaut ont changé
- `cacheTime` renommé en `gcTime`

### Actions recommandées

1. Utiliser le codemod officiel si disponible
2. Rechercher et remplacer les signatures de hooks
3. Migrer les callbacks `onSuccess`/`onError` vers `useEffect`
4. Remplacer `isLoading` par `isPending` où approprié
5. Vérifier les configurations de QueryClient

---

## NextAuth v4 → v5

### Sources
- [Guide de migration v5](https://authjs.dev/getting-started/migrating-to-v5)
- [Auth.js Documentation](https://authjs.dev/)

### Breaking Changes majeurs

#### 1. Renommage et restructuration
- NextAuth devient Auth.js
- Imports depuis `next-auth` vers `@auth/nextjs` (selon configuration)
- Configuration centralisée dans un fichier `auth.ts`

#### 2. Nouvelle structure de configuration
```typescript
// Avant (v4) - pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'

export default NextAuth({
  providers: [...],
})

// Après (v5) - auth.ts à la racine
import NextAuth from 'next-auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [...],
})
```

#### 3. Route Handlers
- Migration des API routes vers Route Handlers
- Nouveau fichier `app/api/auth/[...nextauth]/route.ts`

#### 4. Session et Auth dans les Server Components
```typescript
// Nouveau pattern v5
import { auth } from '@/auth'

export default async function Page() {
  const session = await auth()
  // ...
}
```

#### 5. Adapters
- Les adapters doivent être installés depuis `@auth/*-adapter`
- Exemple: `@auth/prisma-adapter` au lieu de `@next-auth/prisma-adapter`

#### 6. Callbacks et Events
- Certaines signatures de callbacks ont changé
- Vérifier `jwt`, `session`, et `signIn` callbacks

#### 7. Variables d'environnement
- `NEXTAUTH_URL` peut être optionnel dans certains cas
- Nouvelles variables pour la configuration

### Actions recommandées

1. Créer le nouveau fichier `auth.ts` à la racine
2. Migrer les API routes vers Route Handlers
3. Mettre à jour l'adapter Prisma vers `@auth/prisma-adapter`
4. Migrer les usages de `getServerSession` vers `auth()`
5. Mettre à jour les callbacks
6. Tester tous les flows d'authentification (login, logout, refresh)

---

## TypeScript 5.2 → 5.9

### Sources
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/)

### Breaking Changes majeurs

#### 1. Vérifications plus strictes
- Meilleures inférences de types peuvent révéler des erreurs cachées
- Vérifications `noUncheckedIndexedAccess` plus précises

#### 2. Décorateurs
- Les décorateurs Stage 3 sont maintenant la norme
- Les anciens décorateurs expérimentaux (`experimentalDecorators`) restent supportés

#### 3. Nouveautés syntaxiques
- `using` et `await using` pour le resource management
- Peut nécessiter des mises à jour de la configuration ESLint/Prettier

#### 4. Configuration
- Certaines options de `tsconfig.json` peuvent avoir de nouveaux comportements
- Vérifier les options `moduleResolution` et `module`

### Actions recommandées

1. Exécuter `tsc --noEmit` pour identifier les nouvelles erreurs
2. Mettre à jour le `tsconfig.json` si nécessaire
3. Vérifier la compatibilité avec les plugins ESLint

---

## @typescript-eslint v5 → v8

### Sources
- [typescript-eslint Releases](https://typescript-eslint.io/users/releases/)
- [typescript-eslint Documentation](https://typescript-eslint.io/)

### Breaking Changes majeurs

#### 1. Node.js minimum
- Node.js 18.18+ requis

#### 2. Changements de règles
- Certaines règles ont été renommées ou déplacées
- Nouvelles règles activées par défaut dans les presets

#### 3. Configuration
- Support amélioré du flat config ESLint 9
- Peut fonctionner avec ESLint 8.57+ (notre cas)

#### 4. Options de règles
- Certaines options de règles ont changé
- Vérifier les règles personnalisées dans `.eslintrc`

### Actions recommandées

1. Exécuter `npm run lint` après mise à jour
2. Mettre à jour les règles dépréciées
3. Vérifier les configurations personnalisées

---

## Notes importantes

### ESLint 9 et Flat Config
Le projet a été migré vers **ESLint 9** avec le nouveau format **flat config** (`eslint.config.js`).

#### Changements effectués:
- `.eslintrc.json` remplacé par `eslint.config.js`
- `eslint-config-airbnb` et `eslint-config-airbnb-typescript` supprimés (archivés et non compatibles ESLint 9)
- `@typescript-eslint/eslint-plugin` et `@typescript-eslint/parser` remplacés par `typescript-eslint`
- Tous les plugins mis à jour vers leurs versions compatibles ESLint 9

#### Plugins mis à jour:
| Plugin | Ancienne version | Nouvelle version |
|--------|-----------------|------------------|
| eslint | ^8.36.0 | ^9.39.0 |
| eslint-plugin-react | ^7.32.2 | ^7.37.5 |
| eslint-plugin-react-hooks | ^4.6.0 | ^5.1.0 |
| eslint-plugin-sonarjs | ^0.19.0 | ^3.0.2 |
| eslint-plugin-jest | ^27.2.1 | ^29.12.1 |
| eslint-plugin-testing-library | ^5.10.2 | ^7.15.4 |
| eslint-plugin-import | ^2.27.5 | ^2.32.0 |
| eslint-plugin-jsx-a11y | ^6.7.1 | ^6.10.2 |
| eslint-plugin-simple-import-sort | ^10.0.0 | ^12.1.1 |

#### Packages ajoutés:
- `@eslint/compat` - utilitaires de compatibilité pour plugins legacy
- `@eslint/js` - configuration de base ESLint
- `typescript-eslint` - package unifié pour TypeScript

#### Packages supprimés:
- `eslint-config-airbnb`
- `eslint-config-airbnb-typescript`
- `eslint-plugin-jest-formatting` (non compatible ESLint 9)

### Prisma
La version actuelle (6.2.1) est conservée. Une mise à jour vers Prisma 7 est possible mais constitue un changement majeur séparé qui nécessite sa propre analyse.

### Ordre de migration recommandé

1. **TypeScript** - Base pour tous les autres packages
2. **React et @types/react** - Dépendance de Next.js et autres
3. **Next.js** - Framework principal
4. **TanStack Query** - Dépendance de tRPC
5. **tRPC** - Après TanStack Query
6. **NextAuth** - Peut être fait en parallèle avec tRPC
7. **ESLint et plugins** - En dernier, pour valider le code migré

---

## Commandes utiles pour la migration

### Recherche de patterns à migrer

```bash
# React 19 - useRef sans valeur initiale
grep -rn "useRef<.*>()" src/

# React 19 - forwardRef
grep -rn "forwardRef" src/

# TanStack Query v5 - ancienne signature useQuery
grep -rn "useQuery(\[" src/
grep -rn "useQuery('\|useQuery(\"" src/

# TanStack Query v5 - callbacks dans useQuery
grep -rn "onSuccess:" src/ | grep -i query
grep -rn "onError:" src/ | grep -i query

# TanStack Query v5 - isLoading (peut nécessiter isPending)
grep -rn "isLoading" src/

# TanStack Query v5 - cacheTime → gcTime
grep -rn "cacheTime" src/

# NextAuth v4 - getServerSession
grep -rn "getServerSession" src/

# NextAuth v4 - anciens imports
grep -rn "from 'next-auth'" src/
grep -rn "@next-auth/prisma-adapter" src/
```

### Vérification TypeScript

```bash
# Vérifier les erreurs TypeScript sans build
npx tsc --noEmit

# Vérifier avec plus de détails
npx tsc --noEmit --pretty
```

### Tests

```bash
# Tests unitaires client
npm run test:client

# Tests unitaires server
npm run test:server

# Tous les tests
npm run test

# Tests E2E
npm run test:e2e
```
