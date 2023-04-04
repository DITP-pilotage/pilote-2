import { DirectionDeTri } from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';

export default interface TableauChantiersActionsDeTriProps {
  changementColonneÀTrierCallback: (colonneId: string) => void;
  colonneÀTrier: string;
  changementDirectionDeTriCallback: (directionTri: DirectionDeTri) => void;
  directionDeTri: DirectionDeTri;
}
