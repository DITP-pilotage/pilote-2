import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { AvancementsFicheTerritorialeStyled } from "@/components/PageFicheTerritoriale/AvancementsFicheTerritoriale/AvancementsFicheTerritoriale.styled";

export type AvancementsStatistiques = number | null;

export default interface AvancementsProps {
  avancementTerritoire: AvancementsStatistiques;
  jalon: number;
}

export const AvancementsFicheTerritoriale: FunctionComponent<
  AvancementsProps
> = ({ avancementTerritoire, jalon }) => {
  return (
    <AvancementsFicheTerritorialeStyled>
      <JaugeDeProgression
        couleur="bleu"
        libellé={`Taux d'avancement à échéance ${jalon} du territoire`}
        pourcentage={avancementTerritoire || null}
        taille="lg"
      />
    </AvancementsFicheTerritorialeStyled>
  );
};
