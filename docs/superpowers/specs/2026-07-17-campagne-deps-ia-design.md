# Campagne d'upgrade des dépendances assistée par IA — design

**Date :** 2026-07-17
**Périmètre :** apps et packages `kpilote-*`
**Statut :** design validé, plan d'implémentation à écrire

## Problème

Les upgrades de dépendances se font aujourd'hui en « campagnes » manuelles, dont la procédure est décrite dans `DEPENDENCIES.md`. La procédure est bonne ; c'est son exécution qui coince. Trois symptômes :

1. **Les campagnes sont rares** parce qu'elles sont longues. Rien ne les déclenche.
2. **Les « conditions de sortie » des overrides ne sont jamais réévaluées.** `DEPENDENCIES.md` documente pour chaque override ce qui le rendrait inutile — personne ne va vérifier. Le bloc grossit, ne dégrossit pas.
3. **Les « packages à surveiller » ne sont pas surveillés.** Exemple mesuré le 2026-07-17 : le fichier note qu'ESLint 10 devient envisageable dès Node ≥ 20.19. Le projet est sur Node 24.9.0, la condition est levée depuis longtemps, ESLint 9 est toujours en place.

Le travail pénible n'est pas de bumper les versions — `pnpm` le fait. C'est de **lire les changelogs, croiser avec le code, et réévaluer les décisions passées**.

## Ce qu'on ne fait pas, et pourquoi

Ces options ont été étudiées puis écartées. Les raisons sont consignées pour éviter de refaire le tour dans six mois.

### Pas de Renovate

Renovate est le meilleur des deux bots pour ce repo — il parse `pnpm.overrides` avec le vrai parser pnpm (`@pnpm/parse-overrides`, y compris la clé `uuid@>=11.0.0 <11.1.1`), là où Dependabot en est structurellement incapable. Mais son modèle est « un flux de PR, une par dep ou par groupe ». Le besoin ici est **une campagne périodique en une PR**. L'y forcer (`group:all` + `schedule`) reviendrait à l'utiliser à contre-emploi tout en payant ses frictions :

- Il **écrit dans `pnpm-workspace.yaml`** : sur chaque alerte sécu il ajoute `pkg@version` à `minimumReleaseAgeExclude`. Non désactivable ([#43265](https://github.com/renovatebot/renovate/issues/43265)), jamais nettoyé ([#40595](https://github.com/renovatebot/renovate/issues/40595)), parfois à tort ([#42190](https://github.com/renovatebot/renovate/issues/42190)).
- **Double source de vérité** sur la quarantaine : il ne lit pas `minimumReleaseAge: 20160` ([#41661](https://github.com/renovatebot/renovate/issues/41661)), il faut le redéclarer.
- Risque non trié : [#43160](https://github.com/renovatebot/renovate/issues/43160) rapporte que l'étape lockfile strip les `overrides:` du lockfile, annulant les pins CVE.

`pnpm` rend le même service (`outdated`, `update`, `audit`) et **respecte `minimumReleaseAge` nativement, puisque c'est sa propre configuration**. Toute l'acrobatie de Renovate existe parce qu'il se cogne à cette garde depuis l'extérieur.

### Pas de Dependabot version updates

Disqualifié sur le seul critère qui compte ici : **les overrides**.

- Les 9 entrées ne sont **jamais proposées à la hausse** — `DEPENDENCY_TYPES` ne parse que `dependencies`/`devDependencies`/`optionalDependencies`.
- La clé `"uuid@>=11.0.0 <11.1.1"` est **structurellement invisible** (le matcher fait `k == dep.name || k.end_with?("/#{dep.name}")`).
- Pour une CVE transitive corrigeable seulement par un override, Dependabot **refuse par construction** et **no-op en silence** — le code annule explicitement les overrides écrits par `pnpm audit --fix`. Pas de PR, pas d'erreur : on se croit couvert.
- [#5590](https://github.com/dependabot/dependabot-core/issues/5590) est ouverte depuis août 2022.

**On garde en revanche les Dependabot *alerts*** (pas les version updates) : gratuites, déjà actives, elles donnent le signal CVE immédiat entre deux campagnes.

### Pas de GitHub Agentic Workflows / Copilot cloud agent

Envisagé sérieusement, écarté pour une raison structurelle : **le workflow se termine déjà dans Claude Code**. Le flux cible est « la PR s'ouvre → on checkout la branche → on lit le détail → on agit ». Faire produire par Copilot un rapport destiné à être lu par Claude Code ajoute un intermédiaire sans valeur.

Coûts évités au passage : feature en public preview, facturation en AI Credits avec une ambiguïté non levée (plan Pro personnel vs repo d'org `DITP-pilotage` — avec `GITHUB_TOKEN` la conso est métrée à l'organisation, pas au plan personnel), PAT « Copilot Requests » à créer, service containers postgres à répliquer hors CI, et deux systèmes d'IA à maintenir au lieu d'un.

### Pas de cron, pour l'instant

Le seul bénéfice du cron est « ça tourne sans toi ». Le trigger est un détail réversible ; le contenu est l'actif. Le skill fonctionne à l'identique s'il est appelé plus tard par un cron (Claude Code tourne en headless en CI). Investir dans la livraison avant d'avoir validé que l'analyse est utile serait l'ordre inverse du bon.

Si la discipline glisse, deux échappatoires connues : un cron bête qui ouvre une issue « campagne due », ou le skill lancé en CI.

## Architecture

Deux objets, zéro infrastructure.

```
/deps-campagne  (déclenché à la main, ~toutes les 2 semaines)
  │
  ├─ scripts/deps-campagne.sh          [bash, déterministe, zéro IA]
  │    ├─ snapshot        pnpm outdated + pnpm audit
  │    ├─ branche         deps/campagne-YYYY-MM-DD
  │    ├─ commit 1        in-range (pnpm update)         → oracle → JSON
  │    ├─ commit 2        bloc @tiptap/* (pins exacts)   → oracle → JSON
  │    ├─ commit 3..N     un par major (groupes couplés) → oracle → JSON
  │    ├─ bench overrides × 9 : retirer → install → résolution + audit → JSON
  │    └─ report.json
  │
  └─ .claude/skills/deps-campagne/SKILL.md   [l'IA]
       ├─ lit report.json (quelques Ko, pas des logs bruts)
       ├─ 1 subagent par major, en parallèle, contexte propre
       ├─ synthétise
       ├─ met à jour DEPENDENCIES.md
       └─ ouvre la PR
```

**Principe directeur : la mécanique est du bash, le jugement est du LLM.** Tout ce qui est déterministe tourne en script. L'IA n'intervient que là où il y a une décision à prendre.

### Périmètre

- **Deps bumpées : `kpilote-*` uniquement.** `pilote-ppg` est hors périmètre.
- **Banc d'essai des overrides : les 9, donc monorepo-wide.** Les overrides vivent dans le `package.json` racine et s'appliquent partout ; les tester passe par l'arbre complet, ppg compris. Le coût mécanique est le même (c'est le même `install`), et l'information reste gratuite. On teste tout, on rapporte tout, l'humain décide sur quoi agir.
- **Conséquence assumée : le `pnpm-lock.yaml` est partagé.** Une PR « kpilote » modifie le lockfile racine, ce qui déclenche aussi les tests ppg via les filtres de `testAndLint.yml`. C'est un filet de sécurité gratuit, mais une PR kpilote peut être rouge à cause de ppg.

## Le script déterministe

`scripts/deps-campagne.sh`. Aucune IA, testable seul, réutilisable par un cron ultérieur.

### Trois catégories de bumps, pas deux

`pnpm update` ne touche **pas** aux pins exacts (un pin `3.22.3` est un range que seule `3.22.3` satisfait). D'où une troisième catégorie facile à rater :

| Catégorie | Traitement |
|---|---|
| In-range (`^x.y.z`) | `pnpm update` — un seul commit |
| **Pins exacts avec un minor dispo** | Bump explicite, groupé par couplage. Cas actuel : les 7 `@tiptap/*` en `3.22.3` → `3.27.1`, qui **doivent** bouger d'un bloc (sinon instances multiples de `@tiptap/core` au runtime) |
| Majors | Un commit par major, groupes couplés ensemble |

### L'oracle

Une fonction bash rejouée à l'identique après chaque commit. **`tsc --noEmit` en est la pièce maîtresse** : sur un codebase TypeScript, c'est lui qui attrape la majorité des breaking changes d'API (signature modifiée, export retiré, type changé). Les tests ne couvrent que les chemins qu'on a pensé à écrire.

Couverture réelle, mesurée :

| Package | `tsc --noEmit` | eslint | tests |
|---|---|---|---|
| `kpilote-api` | oui | oui | vitest |
| `kpilote-webapp` | oui | oui | vitest |
| `kpilote-admin` | oui | oui | **aucun test** |
| `kpilote-shared` / `kpilote-ui` | non (prettier seul) | non | non |

**Deux vitesses**, pour tenir le temps de run :

- Après chaque commit : `install` + `tsc --noEmit` ×3 (~30 s). Signal discriminant, pas cher.
- Oracle complet (`eslint` + `vitest` ×2 + `audit`) : seulement sur les commits qui passent `tsc`, et sur l'état final. Inutile de payer 3 min de tests pour un major qui ne compile pas.

**Contrainte d'environnement :** le `lint` de `kpilote-api` exige une base vivante — `prisma generate --sql` introspecte les tables pour typer les requêtes TypedSQL. C'est déjà pourquoi `testAndLint.yml` monte un postgres pour son job de *lint*. Le script vérifie que Docker tourne et **demande à l'utilisateur** si ce n'est pas le cas ; il ne touche jamais aux conteneurs.

### Le banc d'essai des overrides

Deux questions distinctes par override, qui peuvent se contredire.

**1. Est-il encore porteur ?** — mécanique, binaire, pas d'IA.

Le bon test n'est pas `pnpm audit`, c'est **la résolution** : on retire l'override, on installe, on regarde à quelle version le paquet se résout seul.

```
hono: ">=4.12.18"
  → sans override, pnpm résout hono à 4.12.27
  → 4.12.27 >= 4.12.18  →  override INERTE  →  supprimable, preuve à l'appui
```

**2. La raison tient-elle encore ?** — c'est le WHY de `DEPENDENCIES.md`, et ça demande du jugement.

Les conditions de sortie sont écrites en français : *« Quand `@prisma/dev` bumpera sa version »*, *« Mise à jour upstream de `speech-rule-engine` en stable 5.x »*, *« Bump effectif de mermaid »*. Les vérifier veut dire regarder l'arbre réel et l'upstream.

**Les deux réponses peuvent diverger, et c'est le cas intéressant** : un override peut être inerte aujourd'hui alors que sa condition de sortie n'est pas remplie — la résolution passe ailleurs par hasard. Le supprimer serait prématuré : il redeviendrait nécessaire au prochain refresh du lockfile. **Le skill signale la divergence, il ne la tranche pas.**

## Le skill

`.claude/skills/deps-campagne/SKILL.md`

### Un subagent par major, en parallèle

La ressource finie n'est pas le coût — c'est le **contexte**. Un agent qui avale 7 changelogs et grep 40 breaking changes dans une seule fenêtre travaille moins bien que 7 analyses focalisées. Donc : un subagent par major, contexte propre (ce changelog, cette sortie `tsc`, le code), verdict structuré en retour.

### L'IA travaille là où l'oracle est aveugle

C'est la règle qui décide de la valeur de l'analyse.

`tsc --noEmit` attrape déjà, gratuitement et avec certitude : signature changée, export retiré, type modifié. **Demander à l'IA de juger ces breaking changes-là, c'est dupliquer une réponse qu'on a déjà, en moins fiable.** C'est le piège documenté : le PM de GitHub déclare publiquement avoir tenté l'analyse IA des PR de deps sans obtenir de résultats satisfaisants ([HN, 2025-10-01](https://news.ycombinator.com/item?id=45439721)), là où Elastic a réussi sur un problème adjacent mais différent — *réparer une CI cassée*, où l'oracle tranche ([Elastic Search Labs, 2025-09-30](https://www.elastic.co/search-labs/blog/ci-pipelines-claude-ai-agent)).

Ce que `tsc` ne verra jamais, et où l'IA a de la valeur :

- **changement de comportement runtime** à signature identique — « `ky` 2 throw sur 404 au lieu de retourner » : compile parfaitement, pète en prod
- **changement de défaut** — un timeout qui passe de 10 s à 0
- **changement de format de config** — typiquement `eslint 9 → 10`
- tout ce qui n'est exercé qu'à l'exécution

Pour chaque breaking change du changelog, le subagent tranche d'abord : *« `tsc` l'aurait-il attrapé ? »*. Si oui, la réponse est déjà dans le rapport. Si non — et seulement alors — il va fouiller le code.

**`kpilote-admin` est le point chaud** : aucun test, donc aucun filet runtime. C'est l'app où l'analyse a le plus de valeur, et celle où elle est la moins vérifiable. Le skill doit le dire.

### Prouvé vs Hypothèse : ne jamais mélanger

La PR sépare les deux, visuellement, sans ambiguïté :

- **Prouvé** — `tsc`/`vitest`/`audit` ont tourné, voici la sortie. C'est un fait.
- **Hypothèse** — le changelog annonce X, j'ai cherché `Y` dans le code, je n'ai rien trouvé, donc *je pense* que tu n'es pas concerné. C'est un avis, avec ses preuves, contestable.

Un « safe » posé sur une hypothèse non vérifiée est exactement le mode d'échec qui fait échouer ce genre d'outil. **La valeur de l'analyse tient entièrement à cette séparation.**

## La PR produite

Branche `deps/campagne-YYYY-MM-DD`, PR ouverte, jamais auto-mergée.

**La PR n'est pas un artefact à merger — c'est un plan de travail.** Elle a le droit d'être rouge, et c'est même le cas intéressant. L'objectif n'est pas de livrer du vert, c'est de livrer **du rouge lisible**. L'humain checkout ensuite, travaille dessus avec Claude Code, découpe si besoin, et merge quand c'est propre.

C'est ce qui justifie de mélanger les lots dans une PR unique, contrairement à la règle de `DEPENDENCIES.md` (« ne pas mélanger bumps mineurs/sécu et majors ») : cette règle protège la reviewabilité et le rollback, or ni l'un ni l'autre n'est en jeu ici puisque personne ne merge la branche telle quelle. **Les commits atomiques par major rendent le découpage trivial** (`git revert <sha>`) et donnent l'attribution des échecs — « le commit 3 casse 12 tests, les commits 1, 2 et 4 sont verts ».

Structure du corps :

1. **Résumé** — n deps montées, n majors testés, n overrides tombés
2. **Lot in-range** — ce qui a bougé, résultat de l'oracle
3. **Un bloc par major** — verdict, breaking changes classés Prouvé/Hypothèse, ce qui casse et où
4. **Overrides** — pour chacun : porteur ou inerte (preuve de résolution), condition de sortie remplie ou non, divergence éventuelle
5. **Reste à faire** — la liste de courses

Le skill met aussi à jour **`DEPENDENCIES.md`** : overrides tombés, pins réévalués, packages à surveiller dont la condition est levée.

## Garde-fous

Ce que le skill n'a **pas** le droit de faire :

1. **Ne jamais modifier le code applicatif.** Il bump des deps et écrit `DEPENDENCIES.md`, point. Il ne « répare » rien pour verdir la CI.
2. **Ne jamais retirer ou baisser un bump pour faire passer les tests.** C'est le mode d'échec qu'Elastic a dû interdire explicitement à son agent. Un commit rouge reste rouge : c'est une information, pas un échec.
3. **Ne jamais toucher aux conteneurs Docker de la base.** Vérifier que Docker tourne, et demander sinon.
4. **Ne pas prétendre à une couverture qui n'existe pas.** « kpilote-admin : vert » est un mensonge par omission. La vérité est « `tsc` vert, aucun test à faire tourner ».
5. **Ne jamais pousser sur `dev` ni auto-merger.**

## État des lieux mesuré (2026-07-17)

Snapshot de départ, à titre de référence pour la première exécution.

**Périmètre kpilote :** 5 packages, 83 deps directes uniques, 12 pins exacts, seulement 3 divergences internes (`ky`, `react-hook-form`, `vitest` — dérive mineure, aucun écart de major). Le reste des divergences du monorepo oppose `ppg` à `kpilote` et sort du périmètre.

**47 deps périmées — 40 minor/patch, 7 majors :**

| Major | De → vers | Remarque |
|---|---|---|
| `eslint` + `@eslint/js` | 9.39.4 → 10 | **couplés**, un seul commit. `DEPENDENCIES.md` le note en « à surveiller » : condition (Node ≥ 20.19) remplie depuis longtemps |
| `typescript` | 5.9.3 → 6.0.3 | pinné exact. **Casse l'oracle lui-même** : si `tsc` échoue après ce commit, est-ce le code ou TS 6 plus strict ? Cas typique où l'IA vaut mieux qu'un bot |
| `@types/node` | 22.19.17 → 26.1.0 | 4 majors d'écart |
| `@hono/node-server` | 1.19.14 → 2.0.8 | croise l'override `>=1.19.13`, dont la condition de sortie est « quand `@prisma/dev` bumpera » |
| `ky` | 1.14.3 → 2.0.2 | divergent : `admin`/`webapp` en `^1.7.5`, `api` en `^1.14.3` |
| `dotenv` | 16.4.5 → 17.4.2 | pinné exact |

**Pins exacts avec minor en attente :** les 7 `@tiptap/*` en `3.22.3` → `3.27.1`. Invisibles à `pnpm update`.

**Overrides : 9, dont un non documenté.**

`terser: "<5.47.0"` n'apparaît nulle part dans `DEPENDENCIES.md` — ni CVE, ni raison, ni condition de sortie — alors que le fichier pose lui-même la règle (« Documenter la raison ici », « Définir une condition de sortie »). C'est aussi **le seul plafond** : les 8 autres sont des planchers `>=X` (« au moins cette version, pour la CVE ») ; celui-ci dit « jamais au-dessus de 5.47.0 ». Ce n'est pas un correctif de sécurité mais un « cette version casse quelque chose », et la raison est perdue. Il bloque activement un upgrade, en silence, sans condition de levée. **À traiter en priorité au premier run.**

## Faits vérifiés sur l'outillage pnpm (2026-07-17)

Mesurés, pas supposés. Ils contraignent l'implémentation du script.

**`pnpm outdated --format json` est exploitable.** Structure par paquet : `current`, `wanted`, `latest`, `isDeprecated`, `dependencyType`, `dependentPackages[]`. **Attention : exit code 1** quand des deps sont périmées — un `set -e` naïf tue le script.

**`latest` respecte déjà `minimumReleaseAge`, et c'est structurant.** Vérifié sur `lucide-react` : pnpm annonce `latest: 1.23.0` (publiée il y a 15 j) alors que npm en est à `1.25.0` (0 j) ; les 1.24.0 (7 j) et 1.25.0 sont filtrées.

**Conséquence : pnpm ne propose jamais une version qu'il refuserait ensuite d'installer.** Le problème qui oblige Renovate à muter `pnpm-workspace.yaml` — proposer un bump que la quarantaine bloque à l'install — **n'existe pas** quand on passe par l'outillage de pnpm. Rien à configurer, rien à dupliquer, aucune seconde source de vérité. C'est la validation la plus nette du choix d'architecture.

**`wanted` est inutilisable — ne pas s'en servir.** Il rapporte `current` même quand le range autorise mieux et que la version cible est mûre. Vérifié : `react` déclaré `^19.2.5`, la 19.2.7 est publiée depuis 45 jours (donc dans le range *et* hors quarantaine), et pnpm annonce quand même `wanted: 19.2.5`.

**Conséquence sur le design du script : on ne prédit pas, on fait et on observe.**

1. `pnpm update` (filtré) → diff `package.json` + lockfile → **c'est ça**, l'ensemble in-range réel.
2. `pnpm outdated` de nouveau → ce qui reste est soit un pin, soit un major.
3. Catégoriser le reste par comparaison de major entre `current` et `latest` (fiable : c'est la méthode qui a sorti les 7 majors).

Plus robuste que toute prédiction, et ça contourne entièrement le champ `wanted`.

## Ce qui reste ouvert

À lever pendant l'implémentation, pas à supposer :

1. **Temps de run réel.** Estimation ~40-60 min non surveillées (17 cycles install+oracle). À mesurer au premier passage ; si c'est trop, réduire l'oracle rapide ou paralléliser les essais d'overrides dans des worktrees.
2. ~~`pnpm outdated --format json` n'a rien rendu d'exploitable~~ — **levé le 2026-07-17.** L'échec venait de `timeout`, absent sur macOS ; la commande n'avait jamais tourné. Le JSON est exploitable. Voir « Faits vérifiés sur l'outillage pnpm » ci-dessous.
3. **Divergence `ky`** : `admin`/`webapp` en `^1.7.5` mais résolus en 1.14.3. Le major `ky` 2 doit-il aussi converger les ranges ? À trancher au premier run.
4. **`terser`** : identifier pourquoi le plafond existe (archéologie git) avant de décider quoi que ce soit. Décision : **on ne le fait pas en amont — c'est le premier cas de test du skill.** C'est le meilleur banc d'essai disponible, parce que c'est une vraie inconnue avec une réponse vérifiable, et qu'il exerce la chaîne complète : le test de résolution (est-il porteur ?), la recherche de la raison (archéologie git), et la mise à jour de `DEPENDENCIES.md`. Si le skill sort le bon verdict sur `terser`, il fonctionne.
