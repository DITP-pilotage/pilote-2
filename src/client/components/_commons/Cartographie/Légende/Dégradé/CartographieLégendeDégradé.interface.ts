export type CartographieLégendeDégradéContenu = {
  libelléUnité: string,
  valeurMin: string,
  valeurMax: string,
  couleurMin: string,
  couleurMax: string,
};

export default interface CartographieLégendeDégradéProps {
  contenu: CartographieLégendeDégradéContenu,
}
