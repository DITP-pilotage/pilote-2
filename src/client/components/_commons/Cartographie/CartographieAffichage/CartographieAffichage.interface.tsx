export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur'>;

export type CartographieTerritoireCodeInsee = string;

export type CartographieValeur = {
  brute: number | null,
  affichée: string,
};

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export default interface CartographieAffichageProps {
  territoires: CartographieTerritoire[]
}
