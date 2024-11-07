type CouleurÉcart = 'rouge' | 'bleu' | 'vert' | 'gris';

export function définirCouleurÉcartArrondi(écart: number | null, estArchive?: boolean) {
  if (écart === null) return null;

  const écartArrondi = +écart.toFixed(1) || 0;
  const couleur: CouleurÉcart = estArchive ? 'gris' : (écartArrondi <= -10 ? 'rouge' : écartArrondi >= 10 ? 'vert' : 'bleu');

  return { écartArrondi, couleur };
}
