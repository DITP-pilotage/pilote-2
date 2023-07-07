export default interface InterrupteurProps {
  checked: boolean;
  id: string;
  auChangement: (estCochée: boolean) => void;
  libellé: string;
}
