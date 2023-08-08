import { Dispatch, SetStateAction } from 'react';
import {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface TableauProjetsStructurantsProps {
  données: ProjetStructurantVueDEnsemble[]
  setNombreProjetsStructurantsDansLeTableau: Dispatch<SetStateAction<number | undefined>>
}

export type DonnéesTableauProjetsStructurants = ProjetStructurantVueDEnsemble;

