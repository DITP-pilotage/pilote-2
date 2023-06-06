import {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface TableauProjetsStructurantsProps {
  données: ProjetStructurantVueDEnsemble[]
  setNombreProjetsStructurantsDansLeTableau: (nombreProjetsStructurantsDansLeTableau: number) => void
}
