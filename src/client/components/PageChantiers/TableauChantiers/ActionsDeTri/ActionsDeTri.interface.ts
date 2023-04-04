import { DirectionDeTri } from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';

export default interface ActionsDeTriProps {
  listeColonnesÀtrier: Array<{
    libellé: string,
    colonneId: string,
  }>,
  changementColonneÀTrierCallback: (string) => void;
  colonneÀTrier: string;
  changementDirectionDeTriCallback: (directionTri: DirectionDeTri) => void;
  directionDeTri: DirectionDeTri;
}
