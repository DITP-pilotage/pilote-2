# 1. Analytics Matomo pour KPilote : noyau partagé et moteur navigateur

Date : 2026-08-24

## Statut

Accepté. Périmètre volontairement réduit au moteur navigateur — voir « Périmètre retenu ».

## Contexte

L'epic **PIL-1711 « Plan de taggage Matomo KPILOTE »** demande de mesurer les usages produit de
KPilote : adoption, chemins d'accès aux indicateurs et collections depuis le tableau de bord,
consultation des pages de détail, contribution des utilisateurs habilités. Il se découpe en cinq
lots (PIL-1712 à PIL-1716) : un socle technique puis quatre lots d'instrumentation représentant
environ trente événements sur huit catégories.

Contraintes déjà arbitrées par l'epic, non rediscutées ici : tracking cookieless, aucun e-mail,
aucun nom, aucun texte saisi, aucun contenu importé, **aucun identifiant utilisateur en v1**.
L'absence de `setUserId` maintient KPilote sous l'exemption de consentement de la CNIL
(délibération 2020-091) : pas de bandeau cookies.

Au-delà du cadrage, quatre contraintes ont été relevées dans le code et dans l'environnement :

1. **CSP stricte.** `apps/kpilote-webapp/src/server/app.ts` verrouille `scriptSrc: ['self']`,
   `imgSrc: ['self','data:']` et `connectSrc: ['self', apiOrigin]`. Charger `matomo.js` depuis un
   domaine tiers demanderait de percer la CSP à trois endroits.
2. **Un seul site Matomo.** `stats.beta.gouv.fr` n'expose qu'un site « KPilote ». Impossible de
   séparer les sources de mesure par site ID.
3. **Quota de dimensions custom inconnu.** Le plan de taggage liste neuf dimensions, alors que
   Matomo en propose cinq en scope visite et cinq en scope action par défaut, et que les slots
   doivent être créés côté administration d'une instance mutualisée sur laquelle nous n'avons
   pas la main.
4. **Instance mutualisée.** Le volume envoyé à `stats.beta.gouv.fr` doit rester sobre.

Enfin, une demande hors ticket a été formulée en séance : pouvoir marquer qu'un endpoint de
`kpilote-api` a été atteint, en particulier lorsque l'API est consommée directement par clé
`pilote_live_*`, hors navigateur. D'où l'idée d'un double moteur — un navigateur, un serveur.

## Décision

### 1. Un noyau pur partagé, des émetteurs séparés

Le vocabulaire de mesure et la traduction vers le protocole Matomo vivent dans un noyau **pur**,
dans `packages/kpilote-shared/src/analytics/` : schéma typé (catégories, actions, dimensions),
catalogue des événements du plan de taggage, et `buildTrackingRequest` qui transforme un
événement en query string Matomo.

Le noyau ne référence ni `window`, ni `navigator`, ni `document`, et reçoit sa configuration en
argument plutôt que de lire `import.meta.env`. C'est la seule propriété nécessaire pour qu'un
moteur Node puisse être ajouté plus tard sans rouvrir un seul fichier existant.

Les émetteurs sont des consommateurs du noyau, pas des variantes d'une abstraction : leur contrat
tient en une ligne, `track(event): void` — synchrone, sans retour, qui ne jette jamais et
n'attend jamais.

### 2. Pas de `matomo.js`, un émetteur maison

Le tracker officiel pèse 22 à 46 Ko gzip et constitue une signature connue de tous les
bloqueurs. On émet nos propres requêtes vers l'API de tracking HTTP de Matomo, en `sendBeacon`
avec repli `fetch(keepalive)` — les deux survivent à la fermeture d'onglet.

Aucune écriture dans le terminal : ni cookie, ni `localStorage`, ni `sessionStorage`, donc pas de
`_id` client. C'est Matomo qui regroupe les actions en visites via son heuristique serveur.
Contrepartie assumée : les visites se fragmentent si l'IP change en cours de session.

**Conséquence à ne pas oublier :** `apps/kpilote-webapp/src/routes/donnees-personnelles.tsx`
promet que « Matomo respectera » le Do Not Track du navigateur. C'est normalement `matomo.js` qui
l'implémente. En ne le chargeant pas, nous héritons de cette responsabilité.

### 3. Quatre conditions d'extinction, décidées au démarrage

`createBrowserAnalytics()` retourne soit un émetteur réel, soit un **émetteur mort** dont le
`track()` ne fait rien. Le choix est fait une fois au boot ; aucun code appelant ne teste jamais
si l'analytics est branché. On fabrique l'émetteur mort si l'une de ces conditions tient :

| Condition | Ce qu'elle protège |
| --- | --- |
| `VITE_ANALYTICS_ENABLED` n'est pas `true` | L'intention. Sépare « configuré » de « voulu » : on coupe l'analytics sans perdre la configuration Matomo, et l'état est lisible d'un coup d'œil dans les variables de l'environnement. |
| `VITE_MATOMO_URL` ou `VITE_MATOMO_SITE_ID` est absent | La cible. Critère de validation du Lot 1 : « sans configuration Matomo, aucun appel externe n'est émis ». |
| Le build n'est pas un build de production | Le poste de développement. Répond à « ne pas envoyer d'événements en local / test », y compris si quelqu'un copie un `.env` de recette en local. À ne pas confondre avec l'environnement de déploiement : un déploiement de recette est un build de production, donc il émet. |
| `navigator.doNotTrack` est actif | L'utilisateur. Voir la responsabilité héritée au point 2. |

Une cinquième barrière existe hors de ce code : la CSP n'autorise l'origine Matomo sur
`connect-src` que si `VITE_MATOMO_URL` est présent côté serveur. `sendBeacon` et le `fetch` de
repli étant tous deux gouvernés par `connect-src`, le navigateur bloquerait une requête émise par
un bundle configuré face à un serveur qui ne l'est pas.

**Limite connue :** toute variable `VITE_*` est inlinée au build. Passer
`VITE_ANALYTICS_ENABLED` à `false` demande donc un redéploiement, pas un redémarrage. Ce n'est pas
un coupe-circuit d'urgence.

### 4. Le contexte des événements dégrade au lieu d'échouer

Matomo n'offre que quatre champs (`e_c`, `e_a`, `e_n`, `e_v`) et un quota de dimensions incertain.
Le builder reçoit donc une **table de correspondance clé de contexte → slot de dimension**,
fournie par la configuration :

- une clé qui a un slot part en `dimensionN` ;
- une clé sans slot est repliée dans `e_n`, sous forme déterministe et triée :
  `indicateur.open?entity_id=IND-506&source=dashboard`.

On démarre avec zéro slot, tout dans `e_n` — c'est lisible et exploitable. Quand le quota réel
sera connu, remplir la table suffit : **aucun site d'appel ne bouge**.

Deux règles portées par les types pour contenir la cardinalité : les valeurs numériques non
bornées vont dans `e_v` ou passent par un bucket ; les identifiants métier (`IND-506`) restent en
clair, leur cardinalité étant précisément le rapport recherché.

### 5. Le catalogue est la seule source de vérité

Les événements sont des fabriques typées, une entrée par ligne du plan de taggage :

```ts
analyticsEvents.dashboard.search({ has_query: true, results_count: 42 })
analyticsEvents.indicateur.open({ entity_id: 'IND-506', source: 'dashboard' })
```

L'appelant ne choisit ni la catégorie, ni l'action, ni le nom. Un événement absent du catalogue
n'est pas émettable.

### 6. Pas de Provider React — un singleton de module

Le Lot 1 demande « brancher un `AnalyticsProvider` au router ». Nous n'en faisons pas.
L'émetteur n'a aucun état réactif, donc un contexte n'apporterait rien — et surtout, la moitié du
taggage se déclenche **hors de React** : souscription du router, `MutationCache`, handler
d'erreur global. Un contexte y deviendrait une contorsion. Un simple
`import { analytics } from '@/analytics'` fonctionne partout.

### 7. L'instrumentation est automatique là où elle peut l'être

Deux branchements couvrent la majorité des trente événements sans modifier un seul composant :

- **Page views** : souscription à la résolution de navigation du router, dans
  `apps/kpilote-webapp/src/main.tsx`. On envoie le **pattern de route**
  (`/indicateurs/$id`), jamais le pathname réel — ce qui satisfait directement
  « URLs normalisées, sans paramètre sensible » et donne un rapport *Pages* où chaque route est
  une ligne. Le `defaultPreload: 'intent'` ne déclenche pas de résolution : pas de faux page view
  au survol.
- **Mutations** : un `MutationCache` avec `onSuccess`/`onError` passé au `QueryClient`. Chaque
  mutation déclare son événement dans son `meta`, une ligne dans le fichier de mutation. Les
  mutations étant déjà centralisées dans trois fichiers (`mutations/commentaires.ts`,
  `niveauConfiance.ts`, `valeursImport.ts`), une ligne par mutation suffira. Ce lot ne câble que
  le mécanisme et les `kpilote.error` ; les `success` métier appartiennent aux Lots 2 à 5 et
  n'auront plus qu'à déclarer leur `meta`.

Le reste — `switch`, `filter`, `search` — passe par un `track()` explicite : ce sont des
changements d'état, sans point d'accroche automatique honnête.

**Écarté :** une délégation d'événements par attributs `data-*`. Elle ne servirait qu'à porter la
dimension `source` sur `indicateur.open` / `collection.open`, ce qu'un `track()` sur le `Link`
fait aussi bien sans mécanisme global. À réévaluer si le Lot 2 montre de la répétition.

### 8. L'analytics ne peut pas casser l'app

`track()` est enveloppé dans un `try/catch` qui avale tout. Si `sendBeacon` échoue, repli sur
`fetch(keepalive)` ; si celui-ci échoue aussi, l'événement est perdu définitivement. Pas de file
persistante, pas de retry : un événement perdu ne vaut pas le risque d'en réémettre un daté de la
veille. Le handler du `MutationCache` est protégé de la même façon — une exception à cet endroit
ferait tomber des mutations métier.

### 9. `kpilote-shared` obtient sa propre configuration de test et son propre job CI

Constat vérifié : les fichiers `*.test.ts` de `packages/kpilote-shared/src/` **ne sont exécutés
par personne**. Les deux configurations vitest (`apps/kpilote-webapp/vite.config.ts` et
`apps/kpilote-api/vitest.config.ts`) globent chacune dans leur propre dossier d'app, et il
n'existe pas de `vitest.workspace`. Le CI (`.github/workflows/testAndLint.yml`) déclenche bien les
jobs quand `packages/kpilote-shared/**` change, mais ces jobs ne ramassent rien. Conséquence :
`packages/kpilote-shared/src/error.test.ts` existe et n'a jamais tourné.

Poser le noyau à cet endroit sans rien faire rendrait ses tests décoratifs. `kpilote-shared`
reçoit donc sa propre `vitest.config.ts`, son script `test`, et un job dédié dans
`testAndLint.yml`. Le filtre `kpilote-shared` existe déjà dans le workflow, il suffit de lui
brancher un job. Cela récupère `error.test.ts` au passage.

## Périmètre retenu

**Dans ce lot** : le noyau pur, l'émetteur navigateur, le branchement router et `MutationCache`,
les variables d'environnement webapp et admin, l'outillage de test de `kpilote-shared`.

**Explicitement pas construit** — pour éviter la généralité spéculative :

- pas de `analytics/node.ts`, pas de moteur Node ;
- pas de middleware dans `kpilote-api`, pas de variable `ANALYTICS_API_TRACKING` ;
- pas d'interface `AnalyticsTransport` abstraite — une seule implémentation n'a pas besoin d'une
  interface ;
- pas de catégorie `kpilote.api` dans le schéma ;
- pas de helper de hash `_id`, pas de batching. Le batching est un besoin Node ; le navigateur
  envoie au fil de l'eau.

## Conséquences

**Avantages**

- Charge navigateur d'environ 1 Ko au lieu de 22-46 Ko, sans aucune écriture dans le terminal.
- CSP inchangée hors une entrée `connect-src`.
- Le plan de taggage a une source de vérité unique en TypeScript, vérifiée par le compilateur.
- Trente événements instrumentés en ne modifiant quasiment aucun composant.
- Le quota de dimensions Matomo peut rester inconnu sans bloquer le développement, et se remplir
  plus tard sans refactor.
- Une panne Matomo, une CSP bloquante ou un réseau coupé sont invisibles pour l'application.

**Inconvénients et dettes assumées**

- Le respect du Do Not Track est désormais notre code, pas celui de `matomo.js`. Une régression
  ici rend fausse la page données personnelles.
- Sans identifiant de visiteur côté client, les visites se fragmentent si l'IP change.
- Les fonctions offertes gratuitement par `matomo.js` (heartbeat, outlinks, mesure de
  performance) n'existent pas et devraient être écrites si le besoin apparaît.
- Tant que la table de dimensions est vide, le rapport *Événements* affiche le contexte replié
  dans `e_n`, moins confortable à segmenter que de vraies dimensions.

## Prochaines étapes

### Étapes d'implémentation

1. **Noyau.** `packages/kpilote-shared/src/analytics/` : schéma, catalogue, builder, tests, plus
   la `vitest.config.ts` du package, son script `test` et le job CI dédié. Rien ne l'appelle
   encore. Mergeable seul.
2. **Émetteur et page views.** Émetteur navigateur, variables d'environnement webapp et admin,
   souscription au router dans `main.tsx`. À la fin de cette étape le critère de validation du
   Lot 1 est atteint : page views visibles dans Matomo, URLs normalisées, aucun appel sans
   configuration.
3. **`MutationCache` et `kpilote.error`.** Le branchement qui rendra les Lots 2 à 5 quasi
   gratuits. Les événements métier de ces lots ne sont pas dans ce ticket.

### À vérifier côté administration Matomo

Ces deux points ne sont pas tranchables depuis le code et conditionnent la qualité des rapports,
pas la faisabilité :

- combien de slots de dimensions custom sont disponibles sur le site KPilote, et qui peut en
  créer. Priorisation proposée si le quota est serré : `app_area`, `environment`, `auth_state` en
  scope visite ; `entity_type`, `source` en scope action — soit exactement le quota par défaut.
  Attention, `environment` et `auth_state` ne sont **pas** émises aujourd'hui : `environment`
  vaudrait `production` sur recette comme en prod, faute d'une notion d'environnement dans
  l'application, et `auth_state` vaudrait `authenticated` y compris sur `/login`. Elles demandent
  chacune une décision avant d'exister ;
- si l'anonymisation d'IP exigée par la CNIL (au moins deux octets masqués) est bien active sur
  ce site.

### Point à trancher plus tard : `entity_id` et `referentiel_id`

Le Lot 1 les marque « à valider privacy ». Position proposée : un `IND-506` ou un identifiant de
référentiel désignent des objets métier, pas des personnes, et ne sortent pas de l'exemption CNIL
tant qu'aucun `uid` ne les relie à un individu. Le point de vigilance réel serait un `entity_id`
de commentaire, rattachable à un auteur.

### Le moteur Node, quand il reviendra

Le besoin est réel mais reporté. Les décisions déjà prises pour l'accueillir sans rouvrir
l'existant :

- il émettra des **événements** (`e_c=kpilote.api`), jamais des page views — le rapport *Pages*
  reste ainsi à 100 % le parcours webapp, ce qui remplace la séparation par site ID dont nous ne
  disposons pas ;
- il vivra dans `apps/kpilote-api/src/framework/analytics/`, en suivant le pattern de `logger/`
  et `auth/` ;
- le middleware dérivera le pattern de route de Hono (`c.req.routePath`), sans ligne à ajouter
  dans les dix-huit routers, et lira l'appelant depuis l'`AsyncLocalStorage` déjà en place dans
  `framework/auth/userContext.ts` ;
- le périmètre des appelants tracés ne sera pas figé dans le code mais piloté par une variable
  d'environnement (`off` / `api_key` / `all`), pour pouvoir mesurer le volume réel sur un
  environnement de recette avant de trancher. Attention : en `all`, chaque page de la SPA génère
  plusieurs appels API — le volume sera d'un autre ordre de grandeur ;
- un identifiant de visiteur déterministe dérivé de l'identifiant de clé API regroupera les
  appels d'un même intégrateur en visites cohérentes. C'est une organisation, pas une personne :
  aucun conflit avec « pas d'identifiant utilisateur en v1 ».

### Ticket séparé à ouvrir : identifiant de corrélation

Sans rapport avec l'analytics, mais relevé pendant la conception. `hono/request-id` est
disponible dans la version de Hono déjà installée (4.12.27) : couplé aux loggers pino des deux
côtés et à un en-tête propagé par le client `ky` (`apps/kpilote-webapp/src/api/client.ts`), il
donnerait une traçabilité webapp → API pour une vingtaine de lignes. À ne pas confondre avec
l'identifiant de visiteur Matomo : un identifiant de corrélation est unique par requête, un
identifiant de visiteur est stable sur des milliers de requêtes.

## Références

- Epic PIL-1711 et lots PIL-1712 à PIL-1716
- Plan de taggage KPILOTE (Confluence, page 422477825)
- API de tracking HTTP Matomo : https://developer.matomo.org/api-reference/tracking-api
- Exemption de consentement CNIL :
  https://matomo.org/faq/how-to/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/
