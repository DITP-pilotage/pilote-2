export type CartographieLégendeDégradéDeSurfaceContenu = {
  libelléUnité: string,
  valeurMin: string,
  valeurMax: string,
  couleurMin: string,
  couleurMax: string,
};

export default interface CartographieLégendeDégradéDeSurfaceProps {
  contenu: CartographieLégendeDégradéDeSurfaceContenu,
}
