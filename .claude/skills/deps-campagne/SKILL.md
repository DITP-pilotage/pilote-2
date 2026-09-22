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

Le moteur vit dans `scripts/deps-campagne/` et est commenté ; `.deps-campagne/report.json` est le
**seul contrat** entre lui et ce skill. Ce fichier-ci décrit une méthode, jamais l'état du monde :
les versions, les paquets et les compteurs se lisent au run.

## 1. Préalables

Vérifier que la working tree est propre. Le moteur refuse de démarrer sinon.

Le moteur sonde lui-même la base de dev (5434) et la base de test de ppg (7433), et s'arrête avec
un message clair si l'une ne répond pas. **Si elle est absente : demander à l'utilisateur de la
lever. Ne jamais démarrer, arrêter ou modifier un conteneur Docker.**

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
joue l'oracle après chacun, passe tous les overrides au banc d'essai, et écrit
`.deps-campagne/report.json`.

Ne pas commenter la sortie brute : tout est dans le rapport.

**Le moteur ne joue l'oracle complet que si l'oracle rapide passe.** Conséquence : _une seule_
régression précoce rend aveugles tous les commits suivants — ni lint ni tests n'auront tourné
de toute la campagne. Quand ça arrive, ce n'est pas un détail d'outillage, **c'est le fait le
plus important du run** : le dire en tête de PR, et chiffrer ce que la campagne n'a donc pas su.

**Piège de mesure.** Pour recompter des erreurs à la main, toujours `tsc --noEmit --pretty false`.
Avec `--pretty` (le défaut), `tsc` insère des codes couleur **à l'intérieur** de la chaîne
`error TS` : un `grep "error TS"` compte alors zéro et rend un vert parfaitement faux.

## 3. Récupérer la campagne précédente

La campagne est un rituel de quinzaine : sans mémoire, on relit tous les quinze jours les mêmes
changelogs pour re-dériver les mêmes hypothèses. **La PR de la campagne précédente est la mémoire.**

```bash
gh pr list --state all --search 'campagne in:title' --limit 1 --json number,title,body,url
```

Ne pas mettre de parenthèses ni de `:` dans le `--search` : la syntaxe de recherche GitHub les
interprète et la requête rend `[]` en silence. Si la commande ne trouve rien, **le vérifier**
plutôt que de conclure qu'il n'y a pas de campagne précédente.

En extraire, par paquet : le verdict rendu, les hypothèses qui avaient tenu, et celles qui avaient
été **écartées** (§6). Ces éléments descendent ensuite dans le prompt du subagent concerné.

**Et d'abord : le « Reste à faire » de la campagne précédente a-t-il été appliqué ?** Le vérifier
dans le code, pas dans la PR. Une campagne dont les verdicts ne sont jamais suivis d'effet
reproduit les mêmes majors tous les quinze jours, et son plafond « à restaurer » n'a jamais
existé. Si des actions sont restées lettre morte, c'est un constat à écrire dans la PR — sur le
suivi, pas sur les paquets. Noter aussi qu'une recommandation peut être devenue **inapplicable** :
une cible conseillée il y a deux semaines peut être repassée sous la quarantaine (§5).

La règle pour le subagent n'est pas « ne regarde pas », c'est **« ne le refais pas à l'aveugle »** :

- même paquet, mêmes versions → répondre « inchangé depuis la campagne du `<date>` », et s'arrêter là ;
- même paquet, version montée → revalider, le verdict antérieur ne vaut que pour son intervalle ;
- hypothèse déjà écartée avec preuve → ne pas la re-produire, sauf si la preuve ne tient plus.

S'il n'y a pas de campagne précédente exploitable, le dire dans la PR plutôt que de faire silence.

## 4. Poser les unités avant de dispatcher

Lire `.deps-campagne/report.json` et **écrire la liste des unités** avant tout dispatch :
une unité par commit de catégorie `major`, une unité par override, **et une unité pour tout
commit à échec propre, quelle que soit sa catégorie** — un `pin-minor` ou un lot `in-range`
qui casse quelque chose mérite un analyste autant qu'un major.

**« Échec propre » se calcule, il ne s'apprécie pas** : la signature d'échec du commit
(l'ensemble de ses `oracle.echecs`) diffère-t-elle de celle de son prédécesseur ? Si elle est
identique, le rouge est **hérité** et ce commit n'a rien cassé. C'est mécanique, donc c'est un
PROUVÉ.

Cette liste est un engagement. À la fin, **chaque unité a une disposition** : un verdict, ou une
ligne « non couvert » avec sa raison (subagent en échec, retour illisible, hypothèse non
réfutable dans le temps imparti). Une unité qui ne revient pas ne disparaît pas en silence : elle
apparaît dans la PR sous **Non couvert** (§9). Un trou connu est une information ; un trou invisible
est un mensonge par omission.

## 5. Analyser les majors — un subagent par unité, en parallèle

Dispatcher **un subagent** par unité `major`, avec un contexte propre, **en parallèle** — un seul
message, plusieurs appels.

La ressource finie n'est pas le coût, c'est le **contexte** : un agent qui avale sept changelogs
travaille moins bien que sept agents qui en lisent un chacun.

### Ce que le parent rassemble pour chaque unité

Ne pas chercher ici une liste de paquets à surveiller : elle serait fausse dès la campagne
suivante. Elle se **dérive au run**, en croisant pour chaque paquet :

- le verdict de l'oracle sur son commit (`report.json`) ;
- sa ligne dans `DEPENDENCIES.md` s'il en a une — raison du pin/override, condition de sortie ;
- le verdict de la campagne précédente (§3) ;
- le filet réel des apps concernées : **lequel est constaté, pas récité** (une app peut n'avoir
  aucun test — le vérifier avant de dispatcher, c'est ce qui décide de la valeur de l'analyse).

### Vérification obligatoire avant tout dispatch : le manifeste dit-il la vérité ?

Le dépôt impose `minimumReleaseAge` (quarantaine, voir `pnpm-workspace.yaml`). **`pnpm outdated`
la respecte** — vérifié en pnpm 10.28.2 : un paquet dont seules des versions trop fraîches
existent n'apparaît pas dans sa sortie, et réapparaît avec `--config.minimumReleaseAge=0`. Le
moteur ne peut donc pas viser une version sous quarantaine ; il atterrit sur **la plus haute
version mûre**, et c'est pour ça qu'une cible peut légitimement différer de la `latest` du
registre. Ne pas lire cet écart comme un bug.

Le manifeste peut mentir quand même, par un **autre** mécanisme : un **override** qui plafonne
le paquet. Le `package.json` déclare alors une version que le lockfile n'a pas, et l'oracle a
validé du code tournant sur l'ancienne — son vert ne vaut rien. C'est le mode d'échec constaté
sur `@hono/node-server` lors d'une campagne précédente.

Pour chaque unité, comparer la version du `package.json` à celle réellement résolue
(`pnpm why <paquet> -r`, ou le lockfile). **Une divergence est un PROUVÉ majeur** qui annule le
verdict de l'oracle sur ce commit. Le signaler avant tout le reste.

### Garde-fou : chaque subagent vérifie le sol sur lequel il marche

Le parent peut se tromper de terrain. Un worktree ouvert pour autre chose, un `cd` oublié, et
les subagents analysent un checkout **sans les bumps** — c'est-à-dire exactement l'inverse de ce
qu'on leur demande de vérifier, sans qu'aucun message d'erreur ne le signale.

Donc : **donner à chaque subagent le chemin absolu du checkout et le nom de la branche**, et lui
demander de **confirmer la version réellement résolue avant de conclure quoi que ce soit**. Cette
vérification n'est pas une politesse, c'est la première étape de son analyse : un agent qui
conclut sans l'avoir faite rend un verdict sur un paquet qu'il n'a peut-être jamais vu.

Un écart entre la version attendue et celle trouvée n'est pas un détail à contourner : l'agent
s'arrête et le remonte. C'est ce qui permet au parent de corriger le tir avant que la moitié des
unités ne soient à refaire.

Sept questions, elles, ne se périment pas — les poser à l'unité concernée :

- **Un major qui casse l'oracle lui-même** (le compilateur, la toolchain de lint). Si l'oracle
  échoue sur ce commit, la question est : le code est-il cassé, ou l'outil est-il devenu plus
  strict ? **À trancher, pas à esquiver.**
- **Un major dont le breaking change est un format de configuration** (linters, bundlers, runners
  de test) : invisible pour `tsc`, donc exactement le terrain où l'IA sert.
- **Un major qui croise un override ou un pin** : croiser le verdict du banc d'essai avec la
  condition de sortie écrite dans `DEPENDENCIES.md`.
- **Une app sans filet de test** : c'est là que l'analyse a le plus de valeur et le moins de
  vérifiabilité. Le dire explicitement.
- **Un numéro de version qui raconte une histoire.** Un major peut n'en être pas un : une RC
  peut porter le dist-tag `latest`, un `X.Y.0-dev.N` peut être l'ancienne version sous un
  numéro trompeur, et des numéros sentinelles (`1000.0.0`) existent. Vérifier au registre
  (`npm view <paquet> dist-tags versions time`) ce qu'est réellement la cible.
- **Un pin de préversion gèle le paquet pour toujours.** Une préversion étant supérieure à la
  future version stable au sens semver, une fois ce pin posé `pnpm outdated` **ne signalera plus
  jamais ce paquet** — pas même à sa GA. Le dépôt se croit à jour en étant figé. Chercher aussi
  les paquets DÉJÀ dans cet état, invisibles par construction.
- **Un `@types/X` peut être un stub vide.** Quand X livre ses propres types, le paquet `@types/X`
  devient une coquille dépréciée (le lockfile porte la mention `deprecated: This is a stub types
definition`). La bonne action n'est alors pas de le bumper mais de le **supprimer** — et il ne
  doit jamais être bumpé isolément de X, sous peine de produire un commit non compilable.

### Prompt de chaque subagent

> Le paquet `<nom>` passe de `<de>` à `<vers>` dans le monorepo kpilote.
> Résultat de l'oracle sur ce commit : `<oracle du rapport>`.
> Contexte à charge : `<ligne DEPENDENCIES.md, verdict de la campagne précédente, filet de test réel, question durable applicable>`.
>
> 1. Récupère le changelog / les release notes entre ces deux versions.
> 2. Pour **chaque** breaking change annoncé, tranche d'abord : **est-ce que `tsc --noEmit`
>    l'aurait attrapé ?** (signature changée, export retiré, type modifié → oui).
>    - Si oui : la réponse est déjà dans l'oracle. Ne cherche pas dans le code, classe-le `sans_objet`.
>    - Si non (comportement runtime à signature identique, changement de défaut, format de
>      config) : **c'est là que tu as de la valeur**. Cherche dans `apps/kpilote-*` et
>      `packages/kpilote-*` si le projet est concerné, et rapporte les fichiers et lignes.
> 3. Rends **exactement un objet JSON**, sans prose autour :
>
> ```json
> {
>   "paquet": "<nom>",
>   "de": "<de>",
>   "vers": "<vers>",
>   "prouve": [{ "fait": "ce que l'oracle établit", "source": "oracle" }],
>   "hypotheses": [
>     {
>       "affirmation": "ce que le changelog annonce",
>       "changelog": "url ou section",
>       "recherche": "ce que j'ai cherché dans le code, et comment",
>       "fichiers": ["chemin:ligne"],
>       "reste_a_verifier": "le fait précis qui trancherait"
>     }
>   ],
>   "sans_objet": [
>     { "breaking": "...", "raison": "tsc l'aurait attrapé | API non utilisée" }
>   ],
>   "non_couvert": "raison, ou null"
> }
> ```
>
> Règles dures sur ce format :
>
> - une entrée de `hypotheses` **ne porte pas de verdict** : ni ✅, ni « safe », ni « sans risque ».
>   Une hypothèse qui conclut est un `prouve` qui n'a pas été prouvé — c'est le mode d'échec
>   qui discrédite l'outil. Si tu peux conclure, c'est que le fait était accessible : prouve-le.
> - `prouve` ne contient que ce que l'oracle a effectivement établi. Pas une lecture de changelog.
> - `fichiers` est vide si tu n'as rien trouvé, et c'est un résultat, pas un échec.
>
> Ne modifie aucun fichier. Tu analyses, tu ne répares pas.

Un retour en prose, tronqué ou hors format est **jeté sans réparation** : l'unité passe en
« non couvert » et sera relancée si le temps le permet. Un retour qu'on ne peut ni compter ni
vérifier n'est pas une analyse.

## 6. Réfuter les hypothèses

Une passe de réfutation, **par hypothèse et non par major**, confiée à un subagent **frais** —
celui qui a produit l'hypothèse ne la vérifie jamais.

**Les `prouve` ne passent pas par là.** L'oracle a déjà tourné : la vérification ne se dépense que
sur la moitié incertaine. C'est tout l'intérêt d'avoir un oracle — les audits qui n'en ont pas
doivent tout revérifier.

> Un autre agent a produit cette hypothèse sur le paquet `<nom>` : `<hypothese complète>`.
> Tu ne l'as pas écrite. **Essaie de la démonter**, depuis le code et le changelog.
> Rends exactement :
> `{"issue": "refutee|tient|deja-repondue-par-oracle", "preuve": "...", "fichiers": ["chemin:ligne"]}`
>
> - `refutee` : le code ne fait pas ce que l'hypothèse suppose, ou l'API n'est pas utilisée.
> - `deja-repondue-par-oracle` : le fait était compilable/testable — l'oracle l'a déjà tranché.
> - `tient` : l'hypothèse survit, et le fait qui trancherait reste hors de portée statique.
>   Ne modifie aucun fichier.

Une hypothèse **réfutée ne disparaît pas** : elle va dans la PR sous **Écarté**, avec sa preuve.
C'est précisément ce qui évite de la re-produire à la campagne suivante (§3).

## 7. Croiser les overrides avec leur WHY

Pour chaque verdict de `report.overrides`, il y a **deux questions distinctes** :

1. **Est-il porteur ?** — déjà répondu, mécaniquement, par le banc d'essai (`porteur` + `preuve`).
   C'est un fait, pas un avis.
2. **Sa raison tient-elle encore ?** — c'est la colonne « Condition de sortie » de
   `DEPENDENCIES.md`, écrite en français. Aller vérifier dans l'arbre réel et en amont.

**Les deux peuvent diverger, et c'est le cas intéressant** : un override inerte aujourd'hui
dont la condition de sortie n'est pas remplie redeviendrait nécessaire au prochain refresh du
lockfile — la résolution passe ailleurs par hasard, pas par correction upstream. **Signaler la
divergence, ne pas la trancher.**

Distinguer aussi **plancher et plafond**, parce que la question n'est pas la même :

- un **plancher** (`>=X`) est presque toujours un correctif de CVE : sa condition de sortie est
  « l'amont a corrigé » ;
- un **plafond** (`<X`) dit « cette version casse quelque chose », et c'est la raison la plus
  facile à perdre. Un plafond **non documenté** dans `DEPENDENCIES.md` est à traiter comme une
  anomalie : retrouver pourquoi, et l'écrire.

```bash
git log -S '"<paquet>"' --oneline -- package.json
```

## 8. Mettre à jour `DEPENDENCIES.md`

- Override inerte **et** condition de sortie remplie → proposer la suppression, preuve à l'appui.
- Override inerte **mais** condition non remplie → le signaler comme tel, ne pas supprimer.
- Override porteur → laisser, mettre à jour la raison si l'arbre a changé.
- Pin dont la raison est tombée → le signaler.
- « Packages à surveiller » dont la condition est levée → le dire, en citant le fait qui la lève
  (version de Node du projet, major déjà passé, correctif publié en amont).
- Override non documenté → l'ajouter au tableau avec ce qu'on a trouvé.
- **`minimumReleaseAgeExclude` porte des conditions de sortie au même titre que les overrides.**
  Chaque exclusion est un trou volontaire dans la mitigation supply-chain ; les temporaires ont
  une date de retrait écrite en commentaire. Vérifier chacune : la version qu'elle protégeait
  a-t-elle franchi la quarantaine ? (`npm view <paquet>@<version> time`, à comparer aux 14 jours).
  Condition remplie → proposer le retrait, preuve à l'appui. Une exclusion dont l'échéance est
  passée est une régression de sécurité silencieuse, pas une ligne de config oubliée.

## 9. Ouvrir la PR

```bash
git push -u origin deps/campagne-<date>
gh pr create --base dev --title "chore(deps): campagne du <date>" --body-file <corps>
```

Chaque major reçoit un **niveau**, qui se dérive mécaniquement — pas au ressenti :

| Niveau         | Condition                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| **bloquant**   | l'oracle est rouge **du fait de ce commit** — sa signature d'échec diffère de celle du précédent (§4) |
| **à arbitrer** | pas d'échec propre, mais au moins une hypothèse a tenu la passe de réfutation                         |
| **cosmétique** | pas d'échec propre, aucune hypothèse survivante                                                       |

Le critère est « rouge **du fait de ce commit** », jamais « rouge ». Quand une régression
précoce aveugle la campagne (§2), l'oracle est rouge sur 100 % des commits : un critère qui
lit le rouge brut les classerait tous bloquants et ne trierait rien.

Structure du corps :

1. **Résumé** — n deps montées, n majors testés, n overrides tombés, campagne précédente utilisée (ou non)
2. **Lot in-range** — ce qui a bougé, résultat de l'oracle
3. **Un bloc par major** — niveau, puis **PROUVÉ** / **HYPOTHÈSE** (celles qui ont tenu) / **ÉCARTÉ**
   (les réfutées, avec la preuve)
4. **Overrides** — porteur ou inerte (avec la preuve de résolution), plancher ou plafond, condition
   de sortie remplie ou non, divergences
5. **Non couvert** — chaque unité de §4 sans verdict, avec sa raison. Section présente même vide,
   et alors marquée « aucune ». Y faire figurer aussi ce que le moteur ne peut **pas** voir :
   une app sans `package.json` est hors pnpm, donc hors campagne par construction — ses
   dépendances (Python, dbt, autre écosystème) ne sont ni bumpées ni auditées. C'est une limite
   de l'outil, pas un oubli du run, et elle se dit.
6. **Reste à faire** — la liste de courses, triée par niveau puis par commit

Préciser dans le corps que **les E2E n'ont pas tourné** (`e2e.yml` est en cron, 30 min, stack
complète) et qu'ils sont à déclencher à la main sur la branche via `workflow_dispatch`.

Préciser aussi que **le `pnpm-lock.yaml` est partagé avec ppg** : une PR kpilote déclenche les
tests ppg via les filtres de `testAndLint.yml`, et peut donc être rouge à cause de ppg.

## Interdits

1. **Ne jamais modifier le code applicatif.** Le skill bump des deps et écrit `DEPENDENCIES.md`.
   Point.
2. **Ne jamais retirer ou baisser un bump pour faire passer les tests.** Un commit rouge reste
   rouge : c'est une information, pas un échec. _Seule exception : une instruction explicite de
   l'utilisateur._ Elle prime — mais l'écart doit alors être écrit dans la PR, avec sa raison et
   ce qui a été mesuré après coup.
3. **Ne jamais toucher aux conteneurs Docker.**
4. **Ne pas prétendre à une couverture qui n'existe pas.** « app X : vert » est un mensonge par
   omission quand l'app n'a pas de tests — la vérité est « `tsc` vert, aucun test à faire tourner ».
5. **Ne jamais pousser sur `dev`, ne jamais auto-merger.**
6. **Ne jamais poser un ✅ sur une hypothèse non vérifiée.** Toute la valeur de l'analyse tient
   à la séparation PROUVÉ / HYPOTHÈSE. Un « safe » posé sur une supposition est précisément le
   mode d'échec qui discrédite ce genre d'outil.
7. **Ne jamais laisser une unité disparaître en silence.** Un subagent en échec produit une ligne
   « non couvert », pas un blanc dans la PR.
8. **Ne jamais inscrire l'état du monde dans ce fichier.** Compteurs d'overrides, versions en
   cours, majors du moment : tout ça se lit dans `report.json` et `DEPENDENCIES.md` au run. Figé
   ici, ça devient en deux campagnes un mensonge qui se lit comme une autorité.
