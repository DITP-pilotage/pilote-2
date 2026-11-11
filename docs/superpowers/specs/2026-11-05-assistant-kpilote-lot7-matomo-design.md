# Assistant kpilote — lot 7 : Matomo

Date : 2026-11-05 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-matomo` (empilée sur les dimensions Matomo, #2651)
Référence PPG : série PIL-1876 → 1879 (`assistantEvents.ts`, `useAssistantTracking.ts`).

## Intention

Mesurer l'usage de l'assistant et ses signaux implicites (relances, copies, exports, abandons) à côté
des 👍/👎, pour savoir ce qui sert sans solliciter l'utilisateur.

## Décisions

- **Socle kpilote** : `analytics.trackEvent` et `analyticsEvents` de `kpilote-shared`. Le contexte part
  dans les dimensions Matomo administrées dans kpilote-admin (#2651) pour les clés qui y sont
  associées (`conversation_id`, `llm_call_id`, `type_question`… à créer dans Matomo puis à reporter),
  sinon dans le nom de l'événement.
- **Catégorie `kpilote.assistant`**, sur le modèle des catégories kpilote (choix du builder ; PPG
  utilise `assistant_ia`).
- **Identifiants envoyés** : `conversation_id` et `llm_call_id`, comme PPG (choix du user), pour
  relier un événement à la fiche admin. Jamais de texte saisi ni d'identité.
- **Événements** (noms PPG repris, plus ceux des vues de kpilote) :

| Nom | Action | Contexte |
|---|---|---|
| `assistant.open` | open | `source` (palette, pastille), `view` |
| `assistant.resume` | open | `view` |
| `assistant.minimize` | select | `view` |
| `assistant.view.change` | switch | `from`, `to` |
| `conversation.new` | select | — |
| `conversation.history.open` | open | — |
| `conversation.history.select` | select | — |
| `conversation.delete` | submit | — |
| `banner.dismiss` | select | — |
| `prompt_proposition.view` | view | `nombre_choix`, `page_type` (indicateur, collection, autre) |
| `prompt_proposition.click` | select | `proposition_id`, `proposition_mode` (envoi_direct, preremplissage) |
| `question.send` | submit | `conversation_id`, `type_question` (premiere_libre, premiere_proposition, suivante), `origine` (saisie, proposition, palette, choix) |
| `speech.start` | select | — |
| `answer.complete` | success | `conversation_id`, `llm_call_id` |
| `answer.error` | error | `conversation_id` |
| `answer.stop` / `answer.retry` / `answer.follow` | select | `conversation_id` |
| `response.choices` | view | `conversation_id`, `llm_call_id`, `nombre_choix` |
| `response.choice` / `response.choice.other` | select | `conversation_id` |
| `response.link.internal` / `response.link.external` / `response.help_center.link` | select | — |
| `export.text` / `export.dashboard_image` / `export.report_copy` / `export.report_pdf` | success | `conversation_id`, `llm_call_id` |
| `feedback.positive` | submit | `conversation_id`, `llm_call_id` |
| `feedback.negative` | submit | `conversation_id`, `llm_call_id`, `categories` |

- Les exports sont comptés à l'usage (PPG comptait aussi leur disponibilité : le taux se calcule ici
  sur `answer.complete`).

## Tests

Contrat des événements (catégorie, action, nom) ; logique pure (type de question, issue d'une
réponse, choix présentés, liens internes, type de page).
