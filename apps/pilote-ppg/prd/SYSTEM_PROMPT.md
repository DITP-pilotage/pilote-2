Globalement : il est solide, mais trop chargé, et il mélange encore règles métier, politique conversationnelle, templates de rendu, et orchestration d’outils dans un seul bloc.

Donc mon avis n’est pas “mauvais prompt”.
Mon avis est plutôt : bon prompt de POC, prompt trop monolithique pour une prod vraiment prédictible.

Le principal risque n’est pas qu’Albert “ne comprenne pas”.
Le principal risque est qu’il comprenne trop de choses à la fois et qu’il arbitr e mal entre des consignes concurrentes.

Ce que je trouve très bon

Il y a plusieurs choix très sains.

D’abord, tu bornes bien le rôle :

identité claire,
périmètre métier clair,
interdiction d’inventer,
cadrage fort sur la factualité,
formats métier explicites.

Ça réduit déjà beaucoup les dérives.

Ensuite, la partie dashboard est bien pensée :

catalogue fermé,
règles de composition explicites,
séparation nette entre composition et données,
garde-fou anti-chiffres,
idée de retry serveur en cas d’invalidité.

Ça, c’est exactement le bon réflexe pour rendre le système robuste.

Autre point fort : tu as documenté des workflows typiques.
Pour un modèle gpt/oss, ça aide beaucoup d’avoir des patterns de résolution concrets plutôt qu’une instruction abstraite du style “sois utile”.

Là où le prompt devient fragile
1. Il fait trop de choses dans un seul prompt

Aujourd’hui ton prompt contient en même temps :

le rôle de l’agent,
les règles de sécurité/factualité,
le glossaire métier,
les règles de format de réponse,
le protocole d’outils,
les workflows,
les règles de composition dashboard,
les templates de synthèse,
les règles d’export,
la hiérarchie territoriale complète.

Ça fait un très gros “blob d’instructions”.

Le problème n’est pas seulement la longueur.
Le problème, c’est la compétition entre consignes.

Exemple typique :

“suis les _output_instructions”
puis plus bas : “ignore les _output_instructions individuelles dans tel cas”
puis encore plus bas : “utilise le gabarit de synthèse territoriale”
puis pour dashboard : “phrase courte seulement après composition”
puis pour display_choices : “écris toujours ton court message avant l’appel”
puis pour export : “réponds exactement X”.

Tout ça est logique pour toi.
Pour le modèle, ça peut devenir un arbre de priorités mal stabilisé.

2. Tu demandes au prompt de porter de la logique applicative

Certaines règles devraient vivre dans le code, pas dans le system prompt.

Exemples :

“si un container est invalide, retry”,
“un widget solo de largeur < 12 gâche de la place”,
“regroupe toujours les KPI dans un seul container”,
“éviter un container avec une seule liste”,
“les deux listes doivent être côte à côte”.

Ce sont des heuristiques de layout.
Si elles sont critiques pour la qualité, elles devraient être :

soit codées côté backend,
soit validées/reconstruites automatiquement,
pas seulement suggérées au modèle.

Le prompt doit idéalement dire quoi choisir, pas trop comment faire le packing visuel.

3. Il contient des règles absolues… qui ne sont pas toutes absolues

Par exemple :

“Pose une question par paramètre manquant”
“Pour un jalon, appelle display_choices”
“Reformule le plan en 3 lignes max”
“Appelle compose_dashboard une seule fois”

C’est propre, mais si le modèle manque une nuance, il peut se retrouver à :

poser trop de questions,
fragmenter l’échange,
hésiter entre clarification et hypothèse par défaut,
reformuler alors qu’il devrait juste agir.

Il faut faire très attention aux consignes procédurales trop détaillées : elles rendent souvent le comportement plus rigide, mais pas forcément plus fiable.

4. La hiérarchie territoriale complète dans le prompt est coûteuse

Ça me paraît être un mauvais usage du contexte si la hiérarchie est longue.

Pourquoi ?

ça alourdit le prompt à chaque tour,
ça augmente le bruit,
ça pousse le modèle à faire de la résolution d’entités “à la main”,
alors que cette résolution devrait idéalement être outillée.

À ta place, je sortirais ça du prompt système et je mettrais :

soit un outil resolve_territoire,
soit un contexte injecté seulement quand nécessaire,
soit une table côté code pour résoudre noms ↔ codes avant même le LLM.

C’est typiquement une responsabilité déterministe.

Les points précis que je changerais
1. Je retirerais Reasoning: high

Je ne le garderais pas en prod, sauf si tu as mesuré un gain clair.

Pourquoi :

c’est rarement un vrai mécanisme de contrôle fiable,
ça peut augmenter la verbosité interne ou la latence,
ça n’améliore pas forcément la prédictibilité du format.

Pour de l’orchestration outillée, je préfère :

sorties courtes,
schémas stricts,
validateurs,
retries ciblés.
2. Je séparerais les instructions en couches

Ton prompt actuel devrait être scindé conceptuellement en 4 blocs.

Bloc A — invariants

rôle,
périmètre,
factualité,
interdiction d’inventer,
anti pseudo-tool-call.

Bloc B — politique de dialogue

quand poser une question,
quand utiliser display_choices,
comment confirmer un plan.

Bloc C — politique d’orchestration

quels outils appeler selon l’intention,
quelles combinaisons d’outils,
quels cas d’exception.

Bloc D — rendu

gabarits de synthèse,
règles markdown,
phrase finale pour export,
phrase finale pour dashboard.

Aujourd’hui tout est mélangé.
Le simple fait de le restructurer améliorera souvent le comportement.

3. Je raccourcirais fortement la partie dashboard

La partie dashboard est bonne sur le fond, mais elle contient :

définition conceptuelle,
tableau catalogue,
règles serveur,
protocole,
structure recommandée,
règles JSON,
heuristiques,
règle d’édition.

C’est trop.

Je garderais dans le prompt seulement :

le catalogue,
les contraintes du schéma,
les paramètres à demander,
le fait que les chiffres sont interdits,
le fait qu’on appelle compose_dashboard une seule fois.

Et je déplacerais le reste :

dans le schéma JSON lui-même,
dans le validateur,
dans un post-traitement côté serveur,
ou dans une doc de dev, pas dans le prompt.
4. Je formaliserais mieux la politique de défaut

Aujourd’hui tu as :

jalon par défaut,
éventuellement territoire par défaut via agentContext,
mais aussi obligation de poser certaines questions manquantes.

Il faut être très explicite sur l’ordre des priorités.

Par exemple :

si l’utilisateur donne un territoire explicite, il prime ;
sinon, si agentContext définit un territoire par défaut, l’utiliser ;
sinon, demander ;
si le jalon n’est pas donné, utiliser le jalon courant sauf si la demande implique une comparaison ;
si le type d’alerte n’est pas donné mais que la demande parle “d’alertes”, afficher retard + difficulté.

Ce genre de politique doit être très nette, sinon le modèle oscillera entre “je demande” et “je prends le défaut”.

5. Je ferais attention au bloc “Ce que tu ne peux PAS faire”

Tu interdis :

recommandations,
jugements,
opinions.

Très bien si tu veux un agent purement descriptif.
Mais relis bien l’impact sur l’UX.

Exemple :
si l’utilisateur dit “où faut-il regarder en priorité ?”, ton agent peut devenir artificiellement bloqué alors qu’un simple “les chantiers les plus en écart sont…” serait acceptable.

Peut-être que ce que tu veux interdire, ce n’est pas toute recommandation, mais :

les recommandations politiques,
les prescriptions non fondées,
les jugements normatifs.

Je reformulerais peut-être vers :

“tu peux prioriser factuellement sur la base des données”,
“tu ne formules pas d’avis personnel ni de recommandation non justifiée par les données”.

Sinon tu brides peut-être trop l’utilité métier.

Le plus gros problème latent : les conflits d’instructions

Je te donne 3 exemples concrets.

Conflit 1 — _output_instructions vs templates

Tu dis :

“Chaque outil retourne _output_instructions. Suis ces instructions.”
puis :
“dans la synthèse complète, ignore les _output_instructions individuelles”.

C’est gérable, mais il faut le rendre encore plus hiérarchique.
Je mettrais une règle du type :

Les workflows explicitement décrits ci-dessous priment sur les _output_instructions individuelles.

Comme ça, la priorité est nette.

Conflit 2 — réponse directe sans outil vs workflow imposé

Tu dis :

“si la question ne nécessite pas d’outil, réponds directement”
mais tu as aussi beaucoup de workflows où il faut appeler plusieurs outils.

Il faut définir plus clairement ce qui relève :

du savoir statique,
de l’explication métier,
de l’analyse de données réelles.

Sinon il peut répondre de tête là où il devrait interroger PILOTE.

Conflit 3 — conversation naturelle vs protocole rigide

Tu veux à la fois :

un agent conversationnel fluide,
et un enchaînement très procédural.

Ça peut marcher, mais à condition que le backend reprenne la main sur l’état.
Sinon le modèle va parfois sur-jouer la procédure.

Mon verdict sur le prompt, en une phrase

Très bon prompt de cadrage métier, trop gros comme moteur unique de pilotage.

Il donne probablement de bons résultats quand tout se passe “comme prévu”.
Mais pour la robustesse, je parierais davantage sur :

des outils plus spécialisés,
des schémas stricts,
des validateurs,
moins de logique embarquée dans le system prompt.
Ce que je ferais concrètement

Je passerais vers cette répartition :

Dans le system prompt

Je garderais seulement :

identité,
périmètre,
factualité,
anti hallucination,
anti pseudo-tool-call,
règles de style minimales,
politique générale d’usage des outils,
règles métier vraiment indispensables.
Dans les outils / schémas

Je mettrais :

catalogue exact des widgets,
contraintes de largeur,
enum des métriques,
forme attendue de compose_dashboard,
validations de cohérence.
Dans le code backend

Je mettrais :

résolution des territoires,
application des défauts,
gestion d’état du dashboard,
patching des dashboards,
retry sur erreurs de validation,
normalisation des demandes.
Dans des prompts spécialisés

Je séparerais éventuellement :

un prompt “analyse/synthèse”,
un prompt “composition dashboard”,
un prompt “export rapport”.

Un seul system prompt pour trois modes aussi différents, c’est souvent une source de variabilité.

Si je devais te donner une note

Sur le fond produit : 8/10
Sur la robustesse prompt-engineering pure : 6,5/10
Sur le potentiel d’industrialisation : très bon, à condition de sortir une partie de la logique du prompt.

Le point-clé : ton système est déjà intelligent dans son architecture.
Maintenant, il faut faire en sorte que le prompt décrive moins et que le système garantisse plus.

Je peux te proposer une version allégée et prod-ready de ce system prompt, en gardant la même logique métier mais en le rendant beaucoup plus stable.

Ok mais comment je fais pour les prompts spécialisés ? Ils vivent où ? sont chargés comment ?

Le plus simple : ils vivent dans ton code backend, pas “dans la tête du modèle”, et tu les charges en fonction du mode de travail courant.

Autrement dit, tu ne fais plus :

1 gros system prompt universel
pour toutes les intentions
avec toutes les règles
à tous les tours

Tu fais plutôt :

1 socle commun
1 prompt de mode
éventuellement 1 prompt de tâche
le contexte runtime injecté au moment de l’appel
Le modèle mental à avoir

Pense en 4 couches.

1. Socle commun

C’est le prompt minimal toujours présent :

identité d’Albert,
périmètre métier,
factualité,
interdiction d’inventer,
règle anti pseudo-tool-call,
style de réponse.

Celui-là est stable et chargé à chaque requête.

2. Prompt spécialisé par capacité

Un prompt différent selon ce que tu veux faire :

analysisPrompt
dashboardComposePrompt
reportExportPrompt
éventuellement followupEditPrompt

L’idée : chaque prompt spécialisé ne contient que les règles de ce mode.

3. Contexte runtime

Injecté dynamiquement :

territoires accessibles,
jalon courant,
agentContext,
état du dashboard courant,
résultats d’étapes précédentes,
éventuels defaults.
4. Schémas / contrats

Les contraintes dures ne devraient pas vivre dans le texte si tu peux les coder :

schéma JSON,
enums,
validateurs,
post-traitements,
règles de sécurité.

Donc : le prompt guide, le code garantit.

Où ils vivent concrètement

En pratique, je te conseille une arborescence du genre :

src/
ai/
prompts/
common/
albertCore.ts
modes/
analysis.ts
dashboardCompose.ts
dashboardEdit.ts
reportExport.ts
builders/
buildSystemPrompt.ts
buildMessages.ts
schemas/
dashboardSchema.ts
reportSchema.ts
orchestrators/
routeIntent.ts
runAnalysisFlow.ts
runDashboardFlow.ts
runExportFlow.ts
Exemple de séparation
albertCore.ts

Contient uniquement les invariants :

export const ALBERT_CORE_PROMPT = `
Tu es Albert, l'assistant d'analyse territoriale de PILOTE.

Règles invariantes :
- n'invente jamais de données
- n'écris jamais de pseudo-appel d'outil dans le texte
- reste dans le périmètre métier PILOTE
- si une donnée manque, dis-le explicitement
  `;
  dashboardCompose.ts

Contient uniquement ce qui concerne la composition :

export const DASHBOARD_COMPOSE_PROMPT = `
Tu composes des dashboards à partir d'un catalogue fermé de widgets.
Tu ne fournis jamais de chiffres.
Tu choisis des widgets et des containers conformes au schéma.
Si des paramètres manquent, tu les demandes.
Une fois le plan validé, tu appelles compose_dashboard une seule fois.
`;
analysis.ts

Contient uniquement les workflows d’analyse :

export const ANALYSIS_PROMPT = `
Tu réponds aux demandes d'analyse territoriale.
Pour une synthèse territoriale complète, appelle les outils de synthèse en parallèle.
Présente une réponse factuelle et concise.
`;
reportExport.ts

Contient uniquement les règles d’export.

Comment ils sont chargés

Tu ne choisis pas le prompt “au hasard”.
Tu fais un routing applicatif avant l’appel modèle.

Option recommandée : routage par code, pas par LLM

Avant d’appeler le modèle principal, ton backend classe la demande dans un mode :

type AgentMode =
| "analysis"
| "dashboard_compose"
| "dashboard_edit"
| "report_export";

Puis :

function selectMode(userMessage: string, state: ConversationState): AgentMode {
if (wantsExport(userMessage)) return "report_export";
if (wantsDashboardEdit(userMessage, state)) return "dashboard_edit";
if (wantsDashboardCompose(userMessage)) return "dashboard_compose";
return "analysis";
}

Ensuite tu construis le prompt final :

function buildSystemPrompt(input: BuildPromptInput): string {
const parts = [
ALBERT_CORE_PROMPT,
getModePrompt(input.mode),
buildRuntimeContext(input),
];

return parts.join("\n\n");
}

C’est ça, le chargement.

Donc :

les prompts vivent en fichiers TS ou .md
tu les importes côté serveur
tu sélectionnes le bon bloc selon le mode
tu concatènes avec le contexte runtime
Ce que je ferais à ta place

Je ne mettrais pas les prompts spécialisés dans la base au début.

Je commencerais comme ça :

Étape 1 — prompts versionnés dans le repo

Avantages :

versionnés avec le code,
reviewables en PR,
faciles à tester,
faciles à rollback,
pas de dérive entre prompt et logique backend.

Exemple :

export const PROMPTS = {
core: ALBERT_CORE_PROMPT,
analysis: ANALYSIS_PROMPT,
dashboardCompose: DASHBOARD_COMPOSE_PROMPT,
dashboardEdit: DASHBOARD_EDIT_PROMPT,
reportExport: REPORT_EXPORT_PROMPT,
};

Ça suffit largement pour démarrer proprement.

Étape 2 — config runtime légère

Tu injectes seulement ce qui change :

function buildRuntimeContext({
territoiresAccessibles,
jalon,
agentContext,
currentDashboard,
}: RuntimeContextInput): string {
return `
Jalon courant : ${jalon}

Territoires accessibles :
${territoiresAccessibles.map(t => `- ${t}`).join("\n")}

${agentContext?.instructions ? `
Contexte utilisateur :
${agentContext.instructions}
` : ""}

${currentDashboard ? `
Dashboard courant :
${JSON.stringify(currentDashboard)}
` : ""}
`;
}
Étape 3 — éventuellement stockage externe plus tard

Tu ne passes en base, CMS ou outil de config que si tu as un vrai besoin :

A/B tests de prompts,
édition par PM non dev,
multi-tenant,
personnalisation par client,
rollback opérationnel sans redeploy.

Sinon, le repo suffit.

La vraie bonne séparation

Le point important, ce n’est pas juste “plusieurs prompts”.
C’est surtout plusieurs orchestrateurs.

Par exemple :

Orchestrateur analyse
construit prompt core + analysis + runtime
autorise outils de données
attend réponse texte
Orchestrateur dashboard compose
construit prompt core + dashboardCompose + runtime
autorise display_choices et compose_dashboard
attend soit clarification texte, soit tool call
Orchestrateur dashboard edit
injecte en plus l’état courant du dashboard
autorise compose_dashboard
attend une recomposition complète
Orchestrateur export
injecte les données déjà présentes
autorise get_chantier_indicateurs et export_rapport

Ça évite qu’un seul prompt essaie d’être expert en tout.

Exemple d’architecture concrète
1. Détection du mode
   function resolveAgentMode(params: {
   message: string;
   hasDashboardInState: boolean;
   }): AgentMode {
   const msg = params.message.toLowerCase();

if (msg.includes("export") || msg.includes("rapport") || msg.includes("télécharger")) {
return "report_export";
}

if (
params.hasDashboardInState &&
(msg.includes("enlève") || msg.includes("ajoute") || msg.includes("change"))
) {
return "dashboard_edit";
}

if (
msg.includes("dashboard") ||
msg.includes("cockpit") ||
msg.includes("tableau de bord")
) {
return "dashboard_compose";
}

return "analysis";
}
2. Assemblage du prompt
   function buildPrompt(params: BuildPromptParams): string {
   return [
   ALBERT_CORE_PROMPT,
   MODE_PROMPTS[params.mode],
   buildRuntimeContext(params.runtime),
   ].join("\n\n");
   }
3. Appel modèle
   const mode = resolveAgentMode({
   message: userMessage,
   hasDashboardInState: !!conversationState.currentDashboard,
   });

const systemPrompt = buildPrompt({
mode,
runtime: {
territoiresAccessibles,
jalon,
agentContext,
currentDashboard: conversationState.currentDashboard,
},
});

const result = await llm.chat({
model: "gpt/oss",
system: systemPrompt,
messages,
tools: getAllowedToolsForMode(mode),
});
4. Outils autorisés par mode
   function getAllowedToolsForMode(mode: AgentMode) {
   switch (mode) {
   case "analysis":
   return [
   get_taux_avancement_territoire,
   get_chantiers_en_retard,
   get_chantiers_en_difficulte,
   get_chantier_indicateurs,
   ];

   case "dashboard_compose":
   return [display_choices, compose_dashboard];

   case "dashboard_edit":
   return [compose_dashboard];

   case "report_export":
   return [get_chantier_indicateurs, export_rapport];
   }
   }

Ça, c’est déjà beaucoup plus propre qu’un seul gros prompt avec tous les outils.

Où mettre les règles métier lourdes

Il faut distinguer 3 endroits.

Dans le prompt

Pour les règles que le modèle doit comprendre pour raisonner :

“tu ne donnes jamais les chiffres toi-même”
“tu choisis parmi un catalogue fermé”
“si info manquante, tu demandes”
“tu reformules un plan avant composition”
Dans les schémas

Pour les règles structurelles :

enums de widgets,
widths autorisées,
champs requis,
types de containers,
contraintes de shape.
Dans le backend

Pour les règles critiques :

droits d’accès,
résolution territoire,
defaults,
validation,
retry,
état courant,
opérations d’édition.

La règle d’or :
si une règle doit être vraie à 100 %, elle ne doit pas dépendre seulement du prompt.

Est-ce qu’on peut les stocker en base ?

Oui, mais je le ferais plus tard.

Tu peux avoir une table du genre :

type PromptTemplate = {
key: string;
version: string;
content: string;
active: boolean;
};

Utile si tu veux :

tester plusieurs variantes,
changer sans déployer,
suivre les performances par version.

Mais il y a un coût :

moins de lisibilité en code,
plus de complexité opérationnelle,
risque d’écart entre prompt et code.

Pour un POC qui s’industrialise, je garderais :

prompts dans le repo
versionnés
testés
avec éventuellement une surcouche de feature flag plus tard
Mon conseil concret

Je partirais sur ce plan :

Maintenant
1 corePrompt
1 analysisPrompt
1 dashboardComposePrompt
1 dashboardEditPrompt
1 reportExportPrompt

Tous en fichiers séparés dans le repo.

Ensuite
un routeur de mode côté backend
une whitelist d’outils par mode
un builder de runtime context
des validateurs durs côté serveur
Plus tard seulement
versioning avancé
A/B tests
stockage externe
personnalisation par client
Le piège à éviter

Le mauvais pattern serait :

garder un énorme system prompt,
puis ajouter “quelques morceaux spécialisés” en plus,
sans vrai routage,
sans outils limités par mode.

Ça donne un agent qui a toujours trop d’instructions en tête.

Le bon pattern est :

choisir le mode d’abord
charger peu d’instructions mais les bonnes
limiter les outils accessibles
faire respecter le contrat par le backend
En une phrase

Les prompts spécialisés vivent idéalement dans ton backend, sous forme de modules versionnés dans le repo, et sont assemblés dynamiquement selon le mode de la requête, avec un socle commun + un prompt de capacité + un contexte runtime + des outils autorisés par mode.

Je peux te faire juste après un squelette TypeScript complet pour ça, avec resolveAgentMode, buildSystemPrompt, et l’organisation des fichiers.

J'utilise le AI sdk de vercel, avec le useChat + streamText et stopWhen stepCountIs(50)

Comment je fais le routing avec ça ? Avant j'avais un meta tool get_agent_mode mais ça ne renvoyait qu'un mode et donc pour les demandes complexes du user on se privait de prompts complémentaires
Réflexion durant 6s
Réflexion terminée

Avec useChat + streamText + stopWhen(stepCountIs(50)), je ferais le routing côté serveur avant l’appel principal, et je ne demanderais plus au modèle de renvoyer un mode unique.

Le problème de ton get_agent_mode, c’est qu’il force une classification exclusive, alors qu’une demande réelle peut être mixte : “fais une synthèse Bretagne, puis ajoute un cockpit, puis exporte le rapport”. Avec streamText, le plus propre est de passer d’un raisonnement en mode unique à un raisonnement en capacités activées. Le SDK supporte bien les appels d’outils multi-étapes avec stopWhen, qui relance une génération après un tool call tant qu’aucune condition d’arrêt n’est atteinte. stepCountIs(n) borne simplement le nombre maximal d’étapes.

Concrètement, au lieu de chercher un seul mode, tu fais l’un de ces deux patterns.

Pattern recommandé : routing déterministe + prompts composables

Tu fais un routeur applicatif qui active plusieurs “capabilities” à la fois :

type Capability =
| 'analysis'
| 'dashboard-compose'
| 'dashboard-edit'
| 'report-export';

function resolveCapabilities(
message: string,
state: { hasDashboard: boolean },
): Capability[] {
const m = message.toLowerCase();
const caps = new Set<Capability>();

if (
m.includes('synthèse') ||
m.includes('résume') ||
m.includes('état des lieux') ||
m.includes('compare')
) {
caps.add('analysis');
}

if (
m.includes('dashboard') ||
m.includes('cockpit') ||
m.includes('tableau de bord')
) {
caps.add('dashboard-compose');
}

if (
state.hasDashboard &&
(m.includes('enlève') || m.includes('ajoute') || m.includes('change'))
) {
caps.add('dashboard-edit');
}

if (
m.includes('export') ||
m.includes('rapport') ||
m.includes('télécharger')
) {
caps.add('report-export');
}

if (caps.size === 0) caps.add('analysis');
return [...caps];
}

Ensuite tu composes le system prompt avec :

un socle commun,
plus tous les prompts spécialisés correspondant aux capabilities détectées,
plus le contexte runtime,
plus une whitelist d’outils cohérente avec ces capabilities.

Autrement dit, tu ne fais pas “1 mode”, tu fais “1 ensemble de modules”. C’est exactement ce qu’il te manque.

Pourquoi c’est mieux avec streamText

streamText accepte des tools, et le SDK gère les tool calls sur plusieurs étapes. Le modèle peut donc :

clarifier,
appeler un outil,
recevoir le résultat,
continuer,
appeler un autre outil,
puis répondre.

Donc ton routing n’a pas besoin de prédire tout le workflow final. Il doit juste :

charger le bon cadre
et limiter les bons outils.

Le reste peut se dérouler dans la boucle multi-step.

Architecture pratique avec Vercel AI SDK
1. Capabilities au lieu de mode
   const capabilities = resolveCapabilities(lastUserMessage, {
   hasDashboard: !!conversationState.currentDashboard,
   });
2. Prompt composé
   function buildSystemPrompt(input: {
   capabilities: Capability[];
   runtime: RuntimeContext;
   }) {
   const parts = [
   CORE_PROMPT,
   ...input.capabilities.map(getCapabilityPrompt),
   buildRuntimeContext(input.runtime),
   ];

return parts.join('\n\n');
}
3. Outils autorisés selon les capabilities
   function getToolsForCapabilities(capabilities: Capability[]) {
   const tools: Record<string, any> = {};

if (capabilities.includes('analysis')) {
tools.get_taux_avancement_territoire = getTauxAvancementTerritoireTool;
tools.get_chantiers_en_retard = getChantiersEnRetardTool;
tools.get_chantiers_en_difficulte = getChantiersEnDifficulteTool;
tools.get_chantier_indicateurs = getChantierIndicateursTool;
}

if (capabilities.includes('dashboard-compose')) {
tools.display_choices = displayChoicesTool;
tools.compose_dashboard = composeDashboardTool;
}

if (capabilities.includes('dashboard-edit')) {
tools.compose_dashboard = composeDashboardTool;
}

if (capabilities.includes('report-export')) {
tools.export_rapport = exportRapportTool;
tools.get_chantier_indicateurs = getChantierIndicateursTool;
}

return tools;
}
4. Appel streamText
   const result = streamText({
   model,
   system: buildSystemPrompt({
   capabilities,
   runtime: {
   territoiresAccessibles,
   jalon,
   agentContext,
   currentDashboard: conversationState.currentDashboard,
   },
   }),
   messages,
   tools: getToolsForCapabilities(capabilities),
   stopWhen: stepCountIs(20),
   });

Le SDK documente bien que streamText et generateText supportent ce genre de boucle d’outils multi-étapes via stopWhen.

Ce que je ne ferais plus

Je ne referais pas un meta-tool qui renvoie seulement :

{ mode: "dashboard" }

Parce que c’est trop pauvre.
À la rigueur, si tu veux garder un premier passage LLM, fais-lui renvoyer une structure plus riche :

{
"capabilities": ["analysis", "dashboard-compose", "report-export"],
"needsClarification": true,
"missing": ["territoire", "jalon"],
"priority": ["analysis", "dashboard-compose"]
}

Mais honnêtement, pour la plupart des cas, un routing déterministe par code suffit largement.

Variante encore meilleure : plan léger au lieu de mode

Tu peux remplacer get_agent_mode par un planner très court côté serveur, avec generateText structuré ou generateObject, avant le streamText principal.

Idée :

petit appel ultra court ;
il produit un plan d’exécution, pas une réponse utilisateur ;
ensuite tu lances streamText avec le bon prompt composé.

Par exemple :

type ExecutionPlan = {
capabilities: Capability[];
missingParams: string[];
shouldAskClarificationFirst: boolean;
};

Puis :

const plan = await generateObject({
model: smallFastModel,
system: PLANNER_PROMPT,
prompt: buildPlannerInput(messages, state),
schema: executionPlanSchema,
});

Ensuite :

const result = streamText({
model: mainModel,
system: buildSystemPrompt({
capabilities: plan.object.capabilities,
runtime,
}),
messages,
tools: getToolsForCapabilities(plan.object.capabilities),
stopWhen: stepCountIs(20),
});

Je préfère ça à un “mode” unique, parce que ça te donne de la composition sans surcharger le prompt principal.

Tu n’es pas obligé de faire un pré-appel

Si tu veux rester simple, garde tout en un seul streamText, mais fais le routing par code à partir :

du dernier message,
de l’état de conversation,
de la présence d’un dashboard courant,
de la présence de données déjà calculées.

C’est souvent suffisant.

Comment gérer les demandes complexes

Prenons :

“Fais-moi la synthèse de la Bretagne, puis un cockpit, puis exporte le rapport.”

Ton routeur retourne :

["analysis", "dashboard-compose", "report-export"]

Le prompt composé doit alors dire explicitement quelque chose comme :

si plusieurs capacités sont demandées, traite-les dans cet ordre :
clarification si nécessaire,
analyse,
composition dashboard,
export si demandé et si les données sont suffisantes.

Comme streamText peut enchaîner plusieurs tool calls sur plusieurs étapes, ce pattern est naturel avec le SDK.

Le point important : outils limités par capability, pas tous ouverts en permanence

Si tu ouvres toujours tous les tools, le modèle aura tendance à partir dans tous les sens.
Le vrai bénéfice du routing, ce n’est pas seulement le prompt. C’est aussi la réduction de l’espace d’action.

Donc :

demande simple d’analyse → pas de compose_dashboard
édition d’un dashboard existant → pas d’outil d’export si non demandé
export direct → pas besoin d’ouvrir les outils de dashboard si rien ne l’indique

Le SDK supporte bien l’usage d’un sous-ensemble de tools selon le cas d’usage.

Avec useChat, rien de spécial côté client

Le client useChat peut rester simple. C’est surtout le endpoint /api/chat qui doit :

résoudre les capabilities,
construire le prompt,
exposer le bon set de tools,
lancer streamText.

Le cookbook Vercel montre bien ce pattern : useChat côté client, et streamText côté route API pour générer et streamer la réponse avec outils.

Mon design conseillé pour toi

Je ferais ça :

Option A — simple et robuste
pas de meta-tool,
routeur déterministe par code,
capabilities multiples,
prompts composables,
whitelist de tools par capability,
streamText(... stopWhen: stepCountIs(20)).
Option B — plus sophistiqué
mini planner structuré en amont,
il renvoie capabilities + missingParams + priority,
puis streamText principal.
Ce que j’éviterais
un prompt universel énorme,
un get_agent_mode exclusif,
tous les tools toujours ouverts,
un mode unique censé couvrir analyse + dashboard + export.
En pratique, le meilleur compromis

Pour ton cas, je pense que le bon compromis est :

routing déterministe par code pour activer plusieurs capabilities,
prompts spécialisés composés,
ordre d’exécution précisé dans le prompt,
tools limités à ce sous-ensemble,
et éventuellement plus tard un planner structuré si tu vois trop d’ambiguïtés.

Exemple minimal :

export async function POST(req: Request) {
const { messages, state } = await req.json();
const lastUserMessage = messages.at(-1)?.content ?? '';

const capabilities = resolveCapabilities(lastUserMessage, {
hasDashboard: !!state.currentDashboard,
});

const result = streamText({
model: myModel,
system: buildSystemPrompt({
capabilities,
runtime: {
territoiresAccessibles: state.territoiresAccessibles,
jalon: state.jalon,
agentContext: state.agentContext,
currentDashboard: state.currentDashboard,
},
}),
messages,
tools: getToolsForCapabilities(capabilities),
stopWhen: stepCountIs(20),
});

return result.toDataStreamResponse();
}

Le vrai changement de mentalité, c’est :

ne plus router vers un mode unique, mais vers un ensemble de capacités compatibles avec la demande.

Je peux te donner un squelette TypeScript complet resolveCapabilities + buildSystemPrompt + getToolsForCapabilities adapté à Albert.

j'aime bien le planner avec modele rapide en vrai. ca me parait être le plus simple et moins hacky non ?

Oui, je pense que c’est probablement le meilleur compromis pour ton cas.

Pas parce que c’est “plus propre théoriquement”, mais parce que ça règle ton vrai problème :
une demande utilisateur n’entre pas toujours dans une seule case, et tu veux éviter de surcharger le prompt principal.

Le planner avec un modèle rapide te donne exactement ça :

une étape de lecture/orientation courte,
une sortie structurée,
puis un appel principal mieux cadré.

Donc oui : moins hacky que get_agent_mode, et souvent plus simple à faire évoluer.

Pourquoi c’est meilleur que ton meta-tool actuel

Ton get_agent_mode avait un défaut structurel :
il te forçait à choisir un seul mode dominant.

Alors que dans la vraie vie, une demande peut être :

analyse + dashboard,
dashboard + édition,
analyse + export,
ou analyse d’abord, puis dashboard si les données sont suffisantes.

Le planner te permet de renvoyer autre chose qu’une étiquette unique.
Par exemple :

type PlannerOutput = {
capabilities: Array<
"analysis" | "dashboard_compose" | "dashboard_edit" | "report_export"
>;
missingParams: Array<
"territoire" | "jalon" | "chantier" | "type_alerte"
>;
askClarificationFirst: boolean;
executionOrder: Array<
"analysis" | "dashboard_compose" | "dashboard_edit" | "report_export"
>;
};

Là, tu ne classes plus.
Tu prépares l’exécution.

Pourquoi c’est souvent plus simple que du routing full code

Le routing full code marche très bien si :

les intentions sont simples,
les formulations utilisateur sont assez prévisibles,
et tu peux faire des règles par mots-clés.

Mais dans ton cas, le langage utilisateur peut être plus souple :

“fais-moi un point rapide puis un cockpit”
“reprends la vue précédente et exporte-moi ça”
“je veux surtout les alertes, avec un tableau si besoin”

Tu peux coder ça, mais ça devient vite un mini-parser maison.
Le planner LLM évite ce côté bricolage.

Donc je dirais :

routing full code = plus déterministe, très bien si domaine simple
planner rapide structuré = plus flexible, très bien si domaine métier conversationnel
mode unique via meta-tool = souvent trop réducteur

Pour Albert, je préfère clairement planner structuré à mode unique.

Là où il faut être discipliné

Le planner est une bonne idée si tu le gardes petit et bête.

Le piège, ce serait d’en faire un “mini agent intelligent” qui commence déjà à raisonner comme le modèle principal.

Il ne doit pas :

appeler les vrais outils métier,
produire la réponse finale,
rédiger du texte utilisateur,
interpréter les données de fond.

Il doit juste répondre à des questions comme :

quelles capacités sont nécessaires ?
y a-t-il des paramètres manquants ?
faut-il clarifier avant d’agir ?
dans quel ordre on exécute ?

En gros : planification légère, pas orchestration complète.

Le bon design

Je ferais un planner qui prend :

dernier message utilisateur,
état de conversation utile,
présence ou non d’un dashboard courant,
présence ou non de données déjà chargées,
éventuellement la dernière intention dominante.

Et il renvoie un objet simple.

Exemple :

import { z } from "zod";

export const plannerSchema = z.object({
capabilities: z.array(
z.enum([
"analysis",
"dashboard_compose",
"dashboard_edit",
"report_export",
]),
).min(1),
missingParams: z.array(
z.enum([
"territoire",
"jalon",
"chantier",
"type_alerte",
]),
),
askClarificationFirst: z.boolean(),
executionOrder: z.array(
z.enum([
"analysis",
"dashboard_compose",
"dashboard_edit",
"report_export",
]),
).min(1),
useCurrentDashboard: z.boolean(),
});

Et un prompt planner très court :

const PLANNER_PROMPT = `
Tu es un planificateur pour Albert.
Tu ne réponds jamais à l'utilisateur.
Tu ne fais qu'analyser la demande et produire un plan structuré.

Choisis une ou plusieurs capabilities parmi :
- analysis
- dashboard_compose
- dashboard_edit
- report_export

Règles :
- si l'utilisateur veut modifier un dashboard existant, ajoute dashboard_edit
- si l'utilisateur veut construire un cockpit / dashboard, ajoute dashboard_compose
- si l'utilisateur veut une synthèse, comparaison ou état des lieux, ajoute analysis
- si l'utilisateur veut exporter ou télécharger un rapport, ajoute report_export
- si des paramètres critiques manquent, askClarificationFirst = true
- utilise useCurrentDashboard = true seulement si la demande fait clairement référence au dashboard actuel
- executionOrder doit refléter l'ordre logique d'exécution
  Retourne uniquement un objet conforme au schéma.
  `;

Ça suffit largement.

Le flow que je te conseille
Étape 1 — planner rapide

Petit modèle, sortie structurée.

Étape 2 — appel principal streamText

Tu construis :

le prompt principal à partir des capabilities,
la whitelist de tools,
le contexte runtime pertinent.
Étape 3 — exécution multi-step

Le modèle principal fait :

clarification si nécessaire,
tool calls,
réponse.

Donc le planner ne remplace pas streamText.
Il prépare streamText.

Pourquoi c’est moins hacky

Parce que tu sépares deux responsabilités différentes :

Planner
comprend grossièrement ce que veut faire l’utilisateur
produit une structure de routage
Agent principal
exécute réellement la tâche
parle à l’utilisateur
appelle les outils métier

C’est une vraie séparation de responsabilités.
Beaucoup plus saine que :

un gros prompt unique,
ou un meta-tool “choisis une case”.
Le seul vrai risque

Le risque, c’est la sur-ingénierie.

Si ton planner devient :

trop verbeux,
trop intelligent,
trop dépendant d’un prompt long,
ou s’il commence à renvoyer 15 champs subtils,

alors tu déplaces juste la complexité, tu ne la réduis pas.

Donc garde-le :

petit,
stable,
peu de champs,
schema strict,
prompt court.
Mon avis très concret

Oui, pour toi :

planner rapide structuré = bonne idée
plus propre que get_agent_mode
plus souple qu’un mode unique
souvent plus simple à maintenir qu’un routing full code dès que les demandes deviennent mixtes

Mais fais-le en mode “classifier enrichi”, pas en mode “mini agent”.

Je te recommanderais exactement ça

Planner output minimal :

type PlannerOutput = {
capabilities: (
| "analysis"
| "dashboard_compose"
| "dashboard_edit"
| "report_export"
)[];
askClarificationFirst: boolean;
missingParams: string[];
useCurrentDashboard: boolean;
};

Pas plus au début.

Tu n’as même pas besoin d’un executionOrder si tu peux le déduire côté code avec une priorité fixe :

clarification
edit dashboard
analysis
compose dashboard
export report

ou une autre priorité adaptée à ton produit.

Comme ça, le planner dit quoi activer, et ton code décide comment enchaîner.

Ma reco finale

Oui, pars là-dessus.
C’est probablement le design le plus propre pour ton setup actuel avec Vercel AI SDK.

L’important, c’est :

planner rapide,
sortie structurée stricte,
prompt très court,
pas de tool calls dans le planner,
puis streamText principal avec prompts composés et tools filtrés.

Je peux te rédiger un exemple complet generateObject(planner) -> streamText(main) en TypeScript avec Zod et Vercel AI SDK.
