export type AvancementsStatistiques = {
  médiane: number | null | undefined;
  minimum: number | null | undefined;
  maximum: number | null | undefined;
} | null;

export default interface AvancementsProps {
  avancements: AvancementsStatistiques;
  jalon: number;
  chantiersSontArchives: boolean;
  moyenneTauxAvancementTerritoire: number | null;
}
