import SynthèseDesRésultats from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";

export interface SynthèseDesRésultatsProps {
  synthèseDesRésultatsInitiale: SynthèseDesRésultats;
  réformeId: string;
  territoireCode: string;
  nomTerritoire: string;
  modeÉcriture?: boolean;
  estInteractif?: boolean;
}
