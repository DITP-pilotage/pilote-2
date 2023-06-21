type CouleurÉcart = 'rouge' | 'bleu' | 'vert';

export function définirCouleurÉcartArrondi(écart: number | null) {
  if (écart === null) {
    return null;
  }

  let écartArrondi = Number(écart.toFixed(1));

  if (écartArrondi === -0) {
    écartArrondi = 0;
  }

  let couleur: CouleurÉcart = 'bleu';

  if (écartArrondi <= -10) {
    couleur = 'rouge';
  } else if (écartArrondi >= 10) {
    couleur = 'vert';
  }

  return {
    écartArrondi,
    couleur,
  };
}
