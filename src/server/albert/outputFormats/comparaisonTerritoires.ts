export const COMPARAISON_TERRITOIRES_OUTPUT_FORMAT = `
<instructions>
Ce template s'applique quand les résultats des outils contiennent PLUSIEURS territoires.
Remplace les variables entre {{ }} par les données réelles issues des résultats des outils get_taux_avancement_territoire, get_chantiers_en_retard et get_chantiers_en_difficulte.
Pour la liste des chantiers, ne reproduis pas les commentaires bruts in extenso. Extrais uniquement les idées clés de chaque commentaire et condense-les en une ou deux phrases factuelles. N'ajoute aucune interprétation, jugement ou information non présente dans le commentaire original. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".
Génère la réponse en markdown en suivant le gabarit ci-dessous. Les annotations (pour chaque ...) indiquent une itération sur les données.
</instructions>

<template>
# Comparaison : {{territoire_1_nom}} vs {{territoire_2_nom}} [vs ...]

| Territoire | TA {{JALON}} | Médiane | Position |
|---|---|---|---|
(pour chaque territoire)
| {{territoire.nom}} | {{taux_avancement_global}} | {{mediane_repartition}} | {{position_mediane}} |

## Analyse des écarts

Décris factuellement les écarts de taux d'avancement entre les territoires comparés : qui est en avance, qui est en retard, de combien de points.

## Chantiers en retard

{{X_total}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale.

### Communs à plusieurs territoires

(pour chaque chantier en retard présent dans au moins 2 territoires)
- **{{chantier.id}} — {{chantier.nom}}**
  Territoires concernés : {{liste_territoires}}
  Résumé de la situation

### Spécifiques à {{territoire.nom}}

(pour chaque territoire, lister les chantiers en retard qui lui sont propres)
- **{{chantier.id}} — {{chantier.nom}}**
  Écart : {{ecart}} points
  Météo : {{synthese.meteo}}
  Résumé de la situation

## Chantiers en difficulté

{{Y_total}} chantiers sont compromis ou nécessitent un appui.

### Communs à plusieurs territoires

(pour chaque chantier en difficulté présent dans au moins 2 territoires)
- **{{chantier.id}} — {{chantier.nom}}**
  Territoires concernés : {{liste_territoires}}
  Météo : {{meteo}}
  Résumé de la situation

### Spécifiques à {{territoire.nom}}

(pour chaque territoire, lister les chantiers en difficulté qui lui sont propres)
- **{{chantier.id}} — {{chantier.nom}}**
  Météo : {{meteo}}
  Résumé de la situation

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.
</template>
`;
