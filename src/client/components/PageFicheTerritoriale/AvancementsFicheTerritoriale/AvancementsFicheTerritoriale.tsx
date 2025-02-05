import { FunctionComponent } from 'react';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import {
  AvancementsFicheTerritorialeStyled,
} from '@/components/PageFicheTerritoriale/AvancementsFicheTerritoriale/AvancementsFicheTerritoriale.styled';

export type AvancementsStatistiques = number | null;

export default interface AvancementsProps {
  avancementGlobalTerritoire: AvancementsStatistiques
}

export const AvancementsFicheTerritoriale: FunctionComponent<AvancementsProps> = ({ avancementGlobalTerritoire }) => {
  return (
    <AvancementsFicheTerritorialeStyled>
      <JaugeDeProgression
        couleur='bleu'
        libellé="Taux d'avancement à échéance 2026 du territoire"
        pourcentage={avancementGlobalTerritoire || null}
        taille='lg'
      />
    </AvancementsFicheTerritorialeStyled>
  );
};
