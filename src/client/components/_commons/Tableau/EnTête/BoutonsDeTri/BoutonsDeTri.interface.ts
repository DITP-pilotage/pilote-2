export type DirectionDeTri = 'asc' | 'desc' | false;

export default interface BoutonsDeTriProps {
  nomColonneÀTrier: string;
  directionDeTri: DirectionDeTri;
  changementDirectionDeTriCallback: (tri: DirectionDeTri) => void;
}
