import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";

export type AvancementsStatistiques = number | null;

export default interface AvancementsProps {
  avancementTerritoire: AvancementsStatistiques;
  jalon: number;
}

export const AvancementsFicheTerritoriale: FunctionComponent<
  AvancementsProps
> = ({ avancementTerritoire, jalon }) => {
  return (
    <div>
      <JaugeDeProgression
        couleur="bleu"
        libellé={`Taux d'avancement à échéance ${jalon} du territoire`}
        pourcentage={avancementTerritoire || null}
        taille="lg"
      />
    </div>
  );
};
