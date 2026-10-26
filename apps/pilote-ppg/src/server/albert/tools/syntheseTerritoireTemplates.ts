import { buildRestrictionWarning } from "@/server/albert/tools/restrictionWarning";

export const SYNTHESE_MONO_TERRITOIRE_TEMPLATE = `# Gabarit de synthèse territoriale

<instructions>
Remplace les variables entre {{ }} par les données réelles issues des résultats des outils.
Génère la réponse en markdown en suivant le gabarit ci-dessous. Les annotations (pour chaque ...) indiquent une itération sur les données.
</instructions>

<template>
# Synthèse pour {{territoire_nom}}

Dans Pilote, le TA {{JALON}} de la région s'établit à {{taux_avancement_global}}%, pour une médiane des <if territoire is DEPT>départements</if><else>régions</else> à {{mediane_repartition}}%.

---

## Chantiers en retard

{{X}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale :

(pour chaque chantier_en_retard, séparé du suivant par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Écart** : {{ecart}} points\\
**Météo** : {{synthese.meteo}}

> {{résumé condensé en 1-2 phrases factuelles à partir du commentaire de la synthèse du chantier. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

NOTE FORMAT :
- la barre oblique inverse (\\) en fin de ligne est un saut de ligne markdown — reproduis-la telle quelle.
- entre deux chantiers, insère un paragraphe contenant uniquement \`&nbsp;\` pour créer une séparation visuelle.

**Synthèse — chantiers en retard** : {{1-2 phrases factuelles décrivant les tendances communes (ampleur des écarts, météo dominante, secteurs concernés). Aucune opinion ni recommandation.}}

---

## Chantiers en difficulté

{{Y}} chantiers sont compromis ou nécessitent un appui :

(pour chaque chantier_en_difficulte, séparé du suivant par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Écart** : {{ecart}} points\\
**Météo** : {{synthese.meteo}}

> {{résumé condensé en 1-2 phrases factuelles à partir du commentaire de la synthèse du chantier. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

**Synthèse — chantiers en difficulté** : {{1-2 phrases factuelles décrivant les tendances communes (météo dominante, secteurs concernés). Aucune opinion ni recommandation.}}

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.
</template>`;

export const SYNTHESE_COMPARAISON_TEMPLATE = `# Gabarit de synthèse territoriale

<instructions>
Remplace les variables entre {{ }} par les données réelles issues des résultats des outils.
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

---

## Chantiers en retard

{{X_total}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale.

### Communs à plusieurs territoires

(pour chaque chantier en retard présent dans au moins 2 territoires, séparé du suivant par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Territoires concernés** : {{liste_territoires}}

> {{résumé condensé en 1-2 phrases factuelles à partir des commentaires de synthèse. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

### Spécifiques à {{territoire.nom}}

(pour chaque territoire, lister les chantiers en retard qui lui sont propres, séparés par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Écart** : {{ecart}} points\\
**Météo** : {{synthese.meteo}}

> {{résumé condensé en 1-2 phrases factuelles à partir du commentaire de la synthèse du chantier. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

NOTE FORMAT :
- la barre oblique inverse (\\) en fin de ligne est un saut de ligne markdown — reproduis-la telle quelle.
- entre deux chantiers, insère un paragraphe contenant uniquement \`&nbsp;\` pour créer une séparation visuelle.

**Synthèse — chantiers en retard** : {{1-2 phrases factuelles décrivant les tendances communes entre territoires (ampleur des écarts, météo dominante, secteurs concernés). Aucune opinion ni recommandation.}}

---

## Chantiers en difficulté

{{Y_total}} chantiers sont compromis ou nécessitent un appui.

### Communs à plusieurs territoires

(pour chaque chantier en difficulté présent dans au moins 2 territoires, séparé du suivant par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Territoires concernés** : {{liste_territoires}}\\
**Météo** : {{meteo}}

> {{résumé condensé en 1-2 phrases factuelles à partir des commentaires de synthèse. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

### Spécifiques à {{territoire.nom}}

(pour chaque territoire, lister les chantiers en difficulté qui lui sont propres, séparés par une ligne contenant uniquement \`&nbsp;\`)
**{{chantier.id}} — {{chantier.nom}}**\\
**Météo** : {{meteo}}

> {{résumé condensé en 1-2 phrases factuelles à partir du commentaire de la synthèse du chantier. OBLIGATOIRE pour CHAQUE chantier. Si aucun commentaire n'est disponible, écris "Pas de commentaire disponible".}}

&nbsp;

**Synthèse — chantiers en difficulté** : {{1-2 phrases factuelles décrivant les tendances communes entre territoires (météo dominante, secteurs concernés). Aucune opinion ni recommandation.}}

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.
</template>`;

const NON_APPLICABLE_EN_RETARD_INSTRUCTIONS =
  "L'analyse des chantiers en retard n'est pas applicable sur ce périmètre : dans la section « Chantiers en retard », reprends fidèlement la raison fournie dans `non_applicable_en_retard.raison`. N'écris pas « aucun chantier en retard ».\n\n";

const RESTITUTION_RULES = `Règles de restitution, prioritaires sur le gabarit :
- Météo : remplace toujours le code par son libellé, y compris pour {{synthese.meteo}} et {{meteo}} : SOLEIL → « Objectifs sécurisés », COUVERT → « Objectifs atteignables », NUAGE → « Appuis nécessaires », ORAGE → « Objectifs compromis ». N'écris jamais le code.
- Commentaires : résume chaque commentaire en 1-2 phrases avec tes propres mots. Ne recopie jamais une phrase ou un fragment de phrase d'un commentaire.
- Rapport : si l'utilisateur a demandé un rapport, un export ou un téléchargement, n'écris pas la synthèse dans le chat. Appelle get_indicateurs pour chaque chantier listé, puis export_rapport en reprenant la structure de ce gabarit.

`;

export function buildSyntheseInstructions({
  nombreTerritoires,
  nonApplicableEnRetard,
  restrictedTerritoires,
}: {
  nombreTerritoires: number;
  nonApplicableEnRetard: boolean;
  restrictedTerritoires: string[];
}): string {
  return (
    buildRestrictionWarning(restrictedTerritoires) +
    (nonApplicableEnRetard ? NON_APPLICABLE_EN_RETARD_INSTRUCTIONS : "") +
    RESTITUTION_RULES +
    (nombreTerritoires === 1
      ? SYNTHESE_MONO_TERRITOIRE_TEMPLATE
      : SYNTHESE_COMPARAISON_TEMPLATE)
  );
}
