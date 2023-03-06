export type CartographieLégendeDégradéContenu = {
  libellé: string,
  valeurMin: string,
  valeurMax: string,
  couleurMin: string,
  couleurMax: string,
};

export type CartographieLégendeDégradéStyledProps = {
  couleurMax: string,
  couleurMin: string,
};

export default interface CartographieLégendeDégradéProps {
  contenu: CartographieLégendeDégradéContenu,
}
