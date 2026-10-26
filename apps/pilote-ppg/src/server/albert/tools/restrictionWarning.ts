export function buildRestrictionWarning(
  restrictedTerritoires: string[],
): string {
  if (restrictedTerritoires.length === 0) return "";

  return `⚠️ Restriction d'accès — territoires ${restrictedTerritoires.join(", ")} : seuls le taux d'avancement, la météo et l'écart à la médiane sont disponibles. Les champs tendance et synthèse (commentaire) sont null par restriction d'accès, et non par absence de données. Tu DOIS le mentionner explicitement dans ta réponse quand ces champs sont retournés.\n\n`;
}
