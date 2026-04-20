export const formaterPropositions = (
  nombrePropositions: number,
  estApplicable: boolean | null,
): string => {
  if (estApplicable === false) return "Non applicable";
  if (nombrePropositions === 0) return "pas de proposition";
  return `${nombrePropositions} ${nombrePropositions > 1 ? "propositions" : "proposition"}`;
};
