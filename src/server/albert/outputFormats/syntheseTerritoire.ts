export const SYNTHESE_TERRITOIRE_OUTPUT_FORMAT = `
<instructions>
Remplace les variables entre {{ }} par les données réelles issues des résultats des outils get_taux_avancement_territoire, get_chantiers_en_retard et get_chantiers_en_difficulte.
Pour la liste des chantiers, ne reproduis pas les commentaires bruts in extenso. Extrais uniquement les idées clés de chaque commentaire et condense-les en une ou deux phrases factuelles. N'ajoute aucune interprétation, jugement ou information non présente dans le commentaire original. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".
Génère la réponse en markdown en suivant le gabarit ci-dessous. Les annotations (pour chaque ...) indiquent une itération sur les données.
N'utilise JAMAIS de tableaux pour présenter la donnée.
</instructions>

<template>
# Synthèse pour {{territoire_nom}}

Dans Pilote, le TA {{JALON}} de la région s'établit à {{taux_avancement_global}}%, pour une médiane des <if territoire is DEPT>départements</if><else>régions</else> à {{mediane_repartition}}%.

## Chantiers en retard

{{X}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale :

(pour chaque chantier_en_retard)
- **{{chantier.id}} — {{chantier.nom}}**
  
  Écart : {{ecart}} points
  Météo : {{synthese.meteo}}
  
  Résumé de la situation

## Chantiers en difficulté

{{Y}} chantiers sont compromis ou nécessitent un appui :

(pour chaque chantier_en_difficulte)
- **{{chantier.id}} — {{chantier.nom}}**
  Météo : {{meteo}}
  Résumé de la situation

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.
</template>
`;
