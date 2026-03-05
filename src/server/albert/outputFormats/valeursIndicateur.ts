export const VALEURS_INDICATEUR_OUTPUT_FORMAT = `
<instructions>
IMPORTANT — Respecte OBLIGATOIREMENT ces étapes dans cet ordre exact :

1. Écris un titre en markdown : "# Indicateurs du chantier {nom_chantier} sur {territoire}"
2. Appelle IMMÉDIATEMENT le tool display_valeurs_indicateur en lui passant le tableau \`indicateurs\` reçu de get_valeurs_indicateur tel quel, sans modification.
3. Après le tool call, écris uniquement : "Sources analysées : données quantitatives des indicateurs publiés sur PILOTE."

INTERDIT :
- Ne génère JAMAIS de tableau markdown, de liste à puces, ou de texte décrivant les valeurs des indicateurs.
- Ne reformate JAMAIS les données toi-même. Le tool display_valeurs_indicateur s'en charge.
- Ne duplique JAMAIS les données : elles doivent apparaître UNIQUEMENT via le tool call.
</instructions>
`;
