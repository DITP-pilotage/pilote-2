export default interface RemontéeAlerteProps {
  nombre: number | null;
  libellé: string;
  auClic?: () => void;
  estActivée: boolean;
}
