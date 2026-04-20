# 2. Mise en place des ADR

Date : 2026-01-14

## Statut

Accepté

## Contexte

La codebase existe depuis plusieurs années avec peu de documentation sur la manière de penser l'architecture. Les pratiques sont hétérogènes en fonction des features, ce qui rend difficile la cohérence architecturale et l'onboarding de nouveaux développeurs.

Sans documentation claire des décisions architecturales, chaque développeur peut faire des choix différents pour résoudre des problèmes similaires, créant ainsi une dette technique et une complexité accrue.

## Décision

Nous utiliserons les Architecture Decision Records (ADR) pour documenter les décisions d'architecture et aligner les pratiques dans la codebase.

Chaque décision architecturale significative sera documentée dans un ADR qui explicitera :
- Le contexte de la décision
- La décision prise
- Les conséquences et compromis

## Conséquences

**Avantages :**
- Plus de documentation pour les outils d'assistance au développement (comme Claude Code) qui pourront être aiguillés vers les manières de faire établies
- Meilleure cohérence architecturale à travers la codebase
- Facilitation de l'onboarding des nouveaux développeurs
- Traçabilité des décisions et de leur contexte
- Réduction de la dette technique en évitant la répétition d'erreurs passées

**Inconvénients :**
- Nécessite un effort initial pour documenter les décisions
- Demande de la discipline pour maintenir la documentation à jour
