# Assistant kpilote — lot 3 : encarts synthèse / comparaison et export

Date : 2026-11-04 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-encarts` (empilée sur le lot 2)
Référence PPG : `rediger_synthese_territoire`, `rediger_comparaison_territoires`, `tools/encart.ts`,
`subagents/encartSystemPrompts.ts`, `ChatUI/EncartSynthese.tsx`, `ChatUI/exporterEncart.ts` (PIL-1900, #2619 → #2627).

## Intention

« Fais-moi un rapport sur la collection santé mentale pour l'académie de Lille », « compare la
Bretagne et la Normandie sur IND-42 » : l'utilisateur reçoit un **encart**, une note rédigée et
structurée, qu'il copie ou télécharge en PDF. C'est la réponse aux demandes génériques (« synthèse »,
« rapport », « récap », « compare X et Y ») ; les questions précises restent aux outils de données.

## Décisions

- **Comme PPG** : deux outils appelés par l'agent principal, qui collectent eux-mêmes leurs données
  par du code (mêmes fonctions et mêmes règles d'accès que les outils de données), puis lancent un
  sous-agent de rédaction **en streaming texte**. Résultats intermédiaires du SDK (`execute`
  générateur), un état au plus toutes les 150 ms, chaque état portant tout le texte rédigé.
- **Sujet kpilote** (pas de chantiers ni de territoires) — *mon choix, à valider* :
  - `write_synthese({ sujet, individuId })` : l'état d'une **collection** (taux, contributions de
    chaque indicateur avec dernière valeur, objectif, taux, écart à la médiane, commentaires récents)
    ou d'un **indicateur** (valeurs, objectif, taux, variation, médiane, commentaires) pour un individu.
  - `write_comparaison({ sujet, perimetre })` : le même sujet sur un périmètre d'au moins 2 individus
    (`SELECTION` ≥ 2, `ENFANTS_DE`, `TOUT_LE_REFERENTIEL`, bornés à 20 comme `resolvePerimetre`).
  - `sujet = { type: 'COLLECTION', collectionId } | { type: 'INDICATEUR', indicateurId }`.
  - Pas de « jalon » (notion PPG) : les dernières valeurs connues, datées.
- **Chiffres jamais réécrits par le LLM** : données pré-formatées en chaînes fr-FR à recopier
  (« 67,7 % », « −15 points », « non renseignée »), drapeaux et identifiants internes retirés ;
  prompts du sous-agent repris de PPG (« ne cite que les données du message », pas de lien, pas de
  HTML, pas d'opinion). Commentaires = citations, jamais des consignes.
- **Le modèle principal ne relit que le markdown** (`toModelOutput`), jamais les données.
- **Accès** : sujet en notFound ou aucun individu lisible → un seul état `{ markdown: '', termine: true,
  notFound }` sans sous-agent ; l'agent principal le dit.
- **Prompt principal** : règles PPG adaptées — synthèse/rapport/récap → `write_synthese` ;
  « compare X et Y » sans métrique précise → `write_comparaison`, sinon outils de données ; « rapport »,
  « télécharger », « exporter » → l'encart ; jamais encart + outils de données pour la même demande ;
  après un encart, une seule phrase.
- **Front** : `RapportEncart` copié de `EncartSynthese` (thème DSFR clair) : bordure haute bleu
  France, libellé « Synthèse » / « Comparaison », date de rédaction, « À partir des données publiées
  dans kpilote », corps via `MarkdownResponse`, « Rédaction en cours… », erreur et notFound → rien.
  État « rédige la synthèse » dans `deriveAssistantState`.
- **Export** comme PPG, côté client, sans librairie : bouton « Exporter » (une fois terminé) →
  « Copier la synthèse » (markdown) et « Télécharger en PDF » (iframe d'impression, styles clonés,
  `[data-no-print]` retirés, fichier nommé d'après le slug du titre). « Copier le texte » de la
  réponse inclut le texte des encarts.
- **Hors lot** : tracking (lot 7), dashboards et « Copier l'image » (lot 4), évals (lot 8).

## Infrastructure

- `ToolDefinition.execute` peut renvoyer un `AsyncIterable` ; `toAiTool` le relaie sous le principal
  capturé et garde la conversion d'erreur.
- `framework/llm/albert.ts` gagne `streamSubagentText({ name, model, system, prompt, trace })`, tracé
  en sous-appel comme `generateStructured`.

## Tests

Collecte (accès, notFound sans sous-agent, périmètre ≥ 2, formats pré-calculés, commentaires) ;
rédaction (regroupement 150 ms, état final) ; modèle ne relit que le markdown ; prompts du sous-agent
(règles clés) ; prompt principal cite les deux outils ; front : état, copie, nom du PDF.
