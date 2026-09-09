# Export fidèle de la dernière réponse Albert (PDF / presse-papiers) — Design

Date : 2026-09-09
Ticket : PIL-1678
Statut : En attente de relecture

## Contexte

L'export existant (`export_rapport`) est un **tool appelé par le LLM** : Albert
reçoit une description ("Génère un rapport structuré **synthétisant** la
discussion") et reconstruit lui-même le contenu dans un schéma
`sections[].parties[]` (paragraphe | tableau). Deux anomalies en découlent :

1. **Réinterprétation** : le LLM décide seul de la structure et peut transformer
   une synthèse rédigée en tableau (ex. synthèse de l'Ain).
2. **Markdown brut dans le PDF** : `markdownToPdfContent.ts` ne gère pas le token
   `"table"` de `marked` (tombe dans le `default`, imprime le markdown source tel
   quel), et les cellules du type structuré `"tableau"` sont écrites via
   `createText()` sans passer par un parseur markdown (ex. synthèse CH-050 AURA).
   Le bouton copier actuel (`AssistantMessage.tsx`) copie aussi le markdown brut
   (`extractMessageText`), sans conversion.

Le besoin exprimé par le ticket est différent de ce que fait `export_rapport` :
l'utilisateur veut une **copie fidèle de la dernière réponse affichée**, pas un
rapport de synthèse généré par le LLM. Les deux fonctionnalités sont conservées
en parallèle, avec des usages distincts (voir Hors périmètre).

## Objectifs

1. Permettre l'export PDF et la copie presse-papiers de la **dernière réponse
   Albert uniquement**, sans passer par le LLM — donc sans reformulation possible
   par construction.
2. Le PDF et le contenu copié respectent le rendu affiché : titres, paragraphes,
   listes, tableaux, emphases, liens — sans markdown brut visible.
3. Conserver `export_rapport` inchangé pour son usage actuel (rapport de synthèse
   sur toute la conversation, à la demande explicite de l'utilisateur en langage
   naturel).

## Décisions actées pendant le brainstorming

- **Portée** : les actions Copier / Exporter PDF n'apparaissent qu'au survol du
  **dernier message assistant** du fil (pas sur les messages précédents). Le
  bouton copier actuel, aujourd'hui présent sur tous les messages, est retiré des
  messages non-derniers.
- **Source de vérité pour le PDF** : le serveur relit le message depuis
  `ChatConversationRepository` (via `conversationId` + `messageId`), plutôt que de
  faire confiance à un texte envoyé par le client. Possible car le flag
  `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` est activé en prod et ne sera jamais
  désactivé — la persistance est donc garantie. Ce choix permettra aussi, plus
  tard, d'exporter depuis `ConversationHistoryDrawer` (conversation déjà fermée).
- **Course avec la persistance asynchrone** : `onFinish` (route.ts) persiste le
  message **après** la fin du stream, donc après que le bouton devienne cliquable
  côté client. La route d'export retente la lecture côté serveur (3 tentatives,
  backoff ~200ms) avant d'échouer, plutôt que de retarder artificiellement
  l'activation du bouton côté client.
- **Format de la réponse HTTP** : le PDF est retourné **directement en buffer**
  dans la réponse (pas de passage par `RapportFileStorage` / URL à télécharger
  séparément) — c'est un aller-retour synchrone, pas besoin de persister un
  fichier temporaire pour ce cas d'usage.

## 1. Backend

### Nouvelle route `POST /api/albert/conversations/[conversationId]/messages/[messageId]/export-pdf`

Mirroring de l'auth pattern existant (`/api/albert/rapports/[userId]/[filename]/route.ts`) :

```
1. auth() → 401 si pas de session
2. Charger la conversation : ChatConversationRepository.recupererParId({
     id: conversationId, utilisateurId: session.user.id
   })
   - null → retry (3x / ~200ms) → 404 si toujours absent après les tentatives
     (couvre la course avec onFinish, et le cas conversation supprimée)
   - implicite : recupererParId filtre déjà par utilisateurId → pas de fuite
     cross-utilisateur possible (même garantie que le storage de fichiers actuel)
3. Retrouver le message par id dans conversation.messages
   - absent → 404
   - role !== "assistant" → 400 (garde-fou, ne devrait pas arriver côté UI)
4. Extraire le texte du message (voir util partagé ci-dessous)
   - texte vide → 400 ("rien à exporter")
5. Générer le PDF :
   content = markdownToPdfContent(texte)   // même pipeline que buildRapportPDFContent,
                                             // corrigé pour les tableaux (cf. plus bas)
   buffer = pdfmake createPdf({ content, ... })   // même config que genererRapportPDF.ts
6. Retourner la réponse :
   Content-Type: application/pdf
   Content-Disposition: attachment; filename="reponse-albert-{shortId}.pdf"
```

Le `shortId` peut être dérivé de `messageId` (pas besoin d'un nouveau
`randomUUID()` côté route, contrairement à `exportRapport.ts`).

### Util partagé `extraireTexteMessage` (déplacement, pas duplication)

`extractMessageText` existe aujourd'hui uniquement côté client
(`src/client/components/_commons/ChatUI/utils.ts`). Il est déplacé vers un module
neutre importable des deux côtés, par exemple
`src/server/albert/piloteUIMessageUtils.ts` (à côté de `PiloteUIMessage.ts`), et
réexporté ou réimporté depuis `ChatUI/utils.ts` côté client. Objectif : garantir
que le texte extrait côté serveur pour le PDF est **exactement** le même calcul
que celui utilisé côté client pour l'affichage et la copie — pas de dérive
possible entre les deux implémentations.

### Fix `markdownToPdfContent.ts` (`convertBlockTokens`)

Ajout du `case "table"` manquant (token GFM de `marked`, disponible par défaut
depuis marked v4+, confirmé en v15 utilisée ici) :

- en-têtes → `createText({ bold: true })`, même style que
  `buildRapportPDFContent.ts` pour la cohérence visuelle avec les rapports
  `export_rapport` ;
- cellules → passées à travers `convertInlineTokens` (pas juste du texte brut),
  pour que le gras/liens/emphases dans une cellule soient rendus, pas affichés en
  markdown brut ;
- réutilisation de `createTable()` (déjà utilisé dans `buildRapportPDFContent.ts`,
  import depuis `@/server/evaluation/handlers/pdfFactories`).

Ce fix bénéficie aussi au pipeline `export_rapport` existant (une "partie"
paragraphe contenant un tableau markdown improvisé par le LLM sera désormais
rendue correctement).

## 2. Frontend

### `ChatUI.tsx`

- Passe `conversationId={chatRef.current.id}` et
  `isLastAssistantMessage={index === messages.length - 1}` à `AssistantMessage`.

### `AssistantMessage.tsx`

- Nouvelles props `conversationId: string` et `isLastAssistantMessage: boolean`.
- Le bouton copier actuel par bloc de texte (L74-91, condition
  `!isStreaming && index === lastTextIndex && hasText`) est retiré de sa forme
  actuelle et remplacé par un nouveau composant `LastResponseActions`, affiché
  uniquement quand `isLastAssistantMessage && hasText && !isStreaming` — au
  survol du message (même pattern visuel `opacity-0 group-hover` que
  l'existant), avec deux boutons : Copier / Exporter PDF.

### `LastResponseActions.tsx` (nouveau)

- **Copier** :
  - `marked(texte)` → HTML (déjà en dépendance de production dans `package.json`,
    pure JS sans API Node — utilisable côté client sans souci) ;
  - `navigator.clipboard.write([new ClipboardItem({ "text/html": ..., "text/plain": texte })])` ;
  - toast succès/erreur identique au comportement actuel.
- **Exporter PDF** :
  - état local `isExporting` (spinner sur le bouton, même pattern que
    `ExportRapportDownload.tsx`) ;
  - `fetch(POST /api/albert/conversations/${conversationId}/messages/${message.id}/export-pdf)` ;
  - réponse OK → `blob()` → `URL.createObjectURL` → clic sur `<a download>` →
    `URL.revokeObjectURL` ;
  - réponse KO → toast d'erreur "L'export a échoué, réessayez.".
- Icônes : `ClipboardIcon` (existant, réutilisé) + `FileTextIcon` ou
  `DownloadIcon` (existants, à choisir en implémentation selon rendu visuel).

## 3. Gestion d'erreurs

| Cas | Comportement |
|---|---|
| Conversation absente après retries | 404 → toast générique |
| Message absent dans la conversation | 404 → toast générique |
| Message vide (pas de texte) | 400 → bouton non affiché en pratique (`hasText` gate côté client) |
| Erreur de génération PDF (pdfmake) | 500 → toast générique, log serveur |
| Échec `navigator.clipboard.write` | toast d'erreur (comportement déjà existant pour la copie actuelle) |

## 4. Tests

- **`markdownToPdfContent`** (unitaire) : un markdown contenant un tableau GFM
  produit un contenu `pdfmake` de type tableau structuré (pas un `generic.raw`
  texte) — fixture basée sur le cas CH-050 AURA.
- **Route `export-pdf`** (unitaire/intégration) :
  - réponse textuelle simple → PDF généré, un seul bloc paragraphe ;
  - réponse avec tableau → PDF avec tableau structuré, pas de markdown brut ;
  - réponse avec listes → PDF avec `ul`/`ol` ;
  - fixture "synthèse Ain" → reste un paragraphe unique dans le PDF (documente
    l'absence de réinterprétation, garantie par construction puisqu'il n'y a plus
    de LLM dans la boucle) ;
  - conversation/message introuvable → 404 ;
  - conversation d'un autre utilisateur → 403/404 (pas de fuite cross-utilisateur).
- **`AssistantMessage` / `LastResponseActions`** (composant) :
  - la barre d'actions n'apparaît que sur `isLastAssistantMessage === true` ;
  - le clic copier écrit du `text/html` (mock `navigator.clipboard.write`), pas
    le markdown brut ;
  - le clic export déclenche le fetch vers la bonne URL et le download.

## Hors périmètre

- Pas de modification du comportement, du schéma ou du prompt d'`export_rapport`
  (hormis le bénéfice indirect du fix `markdownToPdfContent`).
- Pas d'export PDF pour les messages contenant uniquement des widgets tool-call
  (dashboard, tableaux d'indicateurs) — l'action n'est proposée que quand le
  message a du texte (`hasText`), comme le bouton copier actuel.
- Pas d'export depuis `ConversationHistoryDrawer` dans ce ticket (le choix de
  passer par `ChatConversationRepository` le permettra facilement plus tard, mais
  ce n'est pas demandé par l'US).
