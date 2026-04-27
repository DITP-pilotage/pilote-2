# 8. Stockage des conversations Albert sous forme de blob JSONB unique

Date : 2026-04-27

## Statut

Accepté

## Contexte

Albert (l'assistant LLM intégré à PILOTE) a besoin d'un historique de conversations
pour permettre à un utilisateur de reprendre une discussion précédente, d'en
démarrer une nouvelle, et d'en supprimer.

Contraintes :

- Volumétrie attendue : ~20 conversations par jour, rétention 14 jours.
- Pas de besoin identifié pour de la recherche full-text sur le contenu des messages.
- Le format `PiloteUIMessage` est défini par la lib `ai` (Vercel AI SDK) et inclut
  des `parts` polymorphes (text, tool calls, tool results, dashboards). Le SDK
  fournit déjà un mécanisme de persistance via le callback `onFinish` de
  `toUIMessageStreamResponse` qui livre la liste complète des `UIMessage[]`.
- La table `llm_calls` existante reste en place comme audit log brut côté LLM
  (un appel = une ligne) ; elle n'est pas adaptée à la reconstitution d'une
  conversation en UI.

Deux options ont été envisagées :

- **(A)** Une table normalisée `chat_conversation` + `chat_message` avec une
  ligne par message.
- **(B)** Une seule table `chat_conversation` avec une colonne `messages JSONB`
  contenant l'intégralité des `PiloteUIMessage[]`.

## Décision

Nous choisissons l'option (B) : une seule table `chat_conversation` avec un
blob JSONB qui contient toute la conversation. À chaque tour, on réécrit le blob
complet via un `upsert`.

Schéma :

```
chat_conversation (
  id UUID PK,
  utilisateur_id UUID,
  titre TEXT,
  messages JSONB,
  territoire_code TEXT NULL,
  jalon INT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

Index sur `(utilisateur_id, updated_at DESC)` pour la liste par utilisateur, et
sur `updated_at` pour la purge.

## Conséquences

**Positives**

- Simplicité : pas de logique de mapping entre le format `UIMessage` du SDK et
  un schéma normalisé qui devrait évoluer à chaque ajout de tool/part.
- Lecture/écriture en une seule requête, sans jointure ni transaction multi-tables.
- Schema évolutif sans migration : un nouveau type de `part` apparaît côté SDK,
  on le stocke directement.

**Négatives**

- Réécriture du blob complet à chaque tour. Pour une conversation à 50 tours,
  ~200-300 KB sont réécrits à chaque message. Acceptable à la volumétrie cible,
  à surveiller en charge.
- Pas de recherche full-text native sur les messages. Si ce besoin apparaît,
  une migration vers une table normalisée + index FTS sera nécessaire.
- Race possible si deux onglets écrivent sur la même conversation (le second
  écrase le premier). Assumé en V1 ; un `version` optimiste peut être ajouté
  si le besoin se confirme.
