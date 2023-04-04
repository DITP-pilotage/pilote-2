export type DirectionDeTri = 'asc' | 'desc' | false;

export default interface BoutonsDeTriProps {
  directionDeTri: DirectionDeTri;
  changementDirectionDeTriCallback: (tri: DirectionDeTri) => void
}
