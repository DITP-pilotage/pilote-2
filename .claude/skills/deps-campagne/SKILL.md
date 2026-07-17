---
name: deps-campagne
description: Lance une campagne d'upgrade des dépendances kpilote — bumps, oracle, banc d'essai des overrides, analyse IA des breaking changes, et ouverture d'une PR détaillée. À utiliser environ toutes les deux semaines, ou quand l'utilisateur demande une campagne de deps.
disable-model-invocation: false
argument-hint: []
---

# Campagne d'upgrade des dépendances

Produit une branche + une PR qui sert de **plan de travail**. La PR a le droit d'être rouge —
l'objectif est de livrer du **rouge lisible**, pas du vert. L'humain checkout ensuite, travaille
dessus avec Claude Code, découpe, et merge quand c'est propre.

Design : `docs/superpowers/specs/2026-07-17-campagne-deps-ia-design.md`

## 1. Préalables

Vérifier que la working tree est propre. Le moteur refuse de démarrer sinon.

Le moteur sonde lui-même la base de dev (5434) et s'arrête avec un message clair si elle ne
répond pas. **Si elle est absente : demander à l'utilisateur de la lever. Ne jamais démarrer,
arrêter ou modifier un conteneur Docker.**

Pourquoi la base est indispensable même sans lancer les apps : `prisma generate --sql`
introspecte les tables réelles pour typer les requêtes TypedSQL — donc **même le lint de
`kpilote-api` en dépend**. C'est déjà pour ça que `testAndLint.yml` monte un postgres sur son
job de lint.

Les serveurs de dev, eux, ne servent à rien ici : ni `tsc`, ni le lint, ni les tests n'en ont besoin.

## 2. Lancer le moteur

```bash
pnpm deps:campagne
```

Compter ~40-60 min. Le moteur crée `deps/campagne-YYYY-MM-DD`, empile les commits atomiques,
joue l'oracle après chacun, passe les 9 overrides au banc d'essai, et écrit
`.deps-campagne/report.json`.

Ne pas commenter la sortie brute : tout est dans le rapport.

## 3. Analyser les majors — un subagent par major, en parallèle

Lire `.deps-campagne/report.json`. Pour **chaque** commit de catégorie `major`, dispatcher
**un subagent** avec un contexte propre. Les lancer **en parallèle** — un seul message,
plusieurs appels.

La ressource finie n'est pas le coût, c'est le **contexte** : un agent qui avale sept
changelogs travaille moins bien que sept agents qui en lisent un chacun.

Prompt de chaque subagent :

> Le paquet `<nom>` passe de `<de>` à `<vers>` dans le monorepo kpilote.
> Résultat de l'oracle sur ce commit : `<oracle du rapport>`.
>
> 1. Récupère le changelog / les release notes entre ces deux versions.
> 2. Pour **chaque** breaking change annoncé, tranche d'abord : **est-ce que `tsc --noEmit`
>    l'aurait attrapé ?** (signature changée, export retiré, type modifié → oui).
>    - Si oui : la réponse est déjà dans l'oracle. Ne cherche pas dans le code, dis-le.
>    - Si non (comportement runtime à signature identique, changement de défaut, format de
>      config) : **c'est là que tu as de la valeur**. Cherche dans `apps/kpilote-*` et
>      `packages/kpilote-*` si le projet est concerné, et rapporte les fichiers et lignes.
> 3. Rends un verdict structuré, en séparant STRICTEMENT :
>    - **PROUVÉ** : l'oracle a tourné, voici le résultat. C'est un fait.
>    - **HYPOTHÈSE** : le changelog annonce X, j'ai cherché Y, voici ce que j'en déduis.
>      C'est un avis, avec ses preuves.
>
> Ne modifie aucun fichier. Tu analyses, tu ne répares pas.

Points d'attention à transmettre au subagent concerné :

- **`typescript 5 → 6` casse l'oracle lui-même.** Si `tsc` échoue sur ce commit, la question
  est : le code est-il cassé, ou TS 6 est-il plus strict ? À trancher, pas à esquiver.
- **`kpilote-admin` n'a aucun test.** Aucun filet runtime — c'est l'app où l'analyse a le plus
  de valeur et où elle est la moins vérifiable. Le dire.
- **`eslint 9 → 10`** est un changement de format de config : invisible pour `tsc`, donc
  exactement le terrain où l'IA sert.
- **`@hono/node-server 1 → 2`** croise l'override `>=1.19.13`, dont `DEPENDENCIES.md` dit que
  la condition de sortie est « quand `@prisma/dev` bumpera ». Croiser avec le verdict du banc d'essai.

## 4. Croiser les overrides avec leur WHY

Pour chaque verdict de `report.overrides`, il y a **deux questions distinctes** :

1. **Est-il porteur ?** — déjà répondu, mécaniquement, par le banc d'essai (`porteur` + `preuve`).
   C'est un fait, pas un avis.
2. **Sa raison tient-elle encore ?** — c'est la colonne « Condition de sortie » de
   `DEPENDENCIES.md`, écrite en français. Aller vérifier dans l'arbre réel et en amont.

**Les deux peuvent diverger, et c'est le cas intéressant** : un override inerte aujourd'hui
dont la condition de sortie n'est pas remplie redeviendrait nécessaire au prochain refresh du
lockfile — la résolution passe ailleurs par hasard, pas par correction upstream. **Signaler la
divergence, ne pas la trancher.**

`terser: "<5.47.0"` est un cas à part : **non documenté** dans `DEPENDENCIES.md`, et le seul
**plafond** des neuf (les 8 autres sont des planchers `>=X` pour des CVE). Ce n'est donc pas un
correctif de sécurité mais un « cette version casse quelque chose », et la raison est perdue.
Chercher pourquoi et le documenter :

```bash
git log -S '"terser"' --oneline -- package.json
```

## 5. Mettre à jour `DEPENDENCIES.md`

- Override inerte **et** condition de sortie remplie → proposer la suppression, preuve à l'appui.
- Override inerte **mais** condition non remplie → le signaler comme tel, ne pas supprimer.
- Override porteur → laisser, mettre à jour la raison si l'arbre a changé.
- Pin dont la raison est tombée → le signaler.
- « Packages à surveiller » dont la condition est levée → le dire. Exemple connu : le fichier
  note qu'ESLint 10 devient envisageable dès Node ≥ 20.19 ; le projet est sur 24.9.0 depuis
  longtemps, la condition est levée.
- Override non documenté → l'ajouter au tableau avec ce qu'on a trouvé.

## 6. Ouvrir la PR

```bash
git push -u origin deps/campagne-<date>
gh pr create --base dev --title "chore(deps): campagne du <date>" --body-file <corps>
```

Structure du corps :

1. **Résumé** — n deps montées, n majors testés, n overrides tombés
2. **Lot in-range** — ce qui a bougé, résultat de l'oracle
3. **Un bloc par major** — verdict, breaking changes classés PROUVÉ / HYPOTHÈSE, ce qui casse et où
4. **Overrides** — porteur ou inerte (avec la preuve de résolution), condition de sortie remplie
   ou non, divergences
5. **Reste à faire** — la liste de courses, par commit

Préciser dans le corps que **les E2E n'ont pas tourné** (`e2e.yml` est en cron, 30 min, stack
complète) et qu'ils sont à déclencher à la main sur la branche via `workflow_dispatch`.

Préciser aussi que **le `pnpm-lock.yaml` est partagé avec ppg** : une PR kpilote déclenche les
tests ppg via les filtres de `testAndLint.yml`, et peut donc être rouge à cause de ppg.

## Interdits

1. **Ne jamais modifier le code applicatif.** Le skill bump des deps et écrit `DEPENDENCIES.md`.
   Point.
2. **Ne jamais retirer ou baisser un bump pour faire passer les tests.** Un commit rouge reste
   rouge : c'est une information, pas un échec.
3. **Ne jamais toucher aux conteneurs Docker.**
4. **Ne pas prétendre à une couverture qui n'existe pas.** « kpilote-admin : vert » est un
   mensonge par omission — la vérité est « `tsc` vert, aucun test à faire tourner ».
5. **Ne jamais pousser sur `dev`, ne jamais auto-merger.**
6. **Ne jamais poser un ✅ sur une hypothèse non vérifiée.** Toute la valeur de l'analyse tient
   à la séparation PROUVÉ / HYPOTHÈSE. Un « safe » posé sur une supposition est précisément le
   mode d'échec qui discrédite ce genre d'outil.
