import chroma from 'chroma-js';
import { CouleurHexa, CouleurRVB } from '@/client/utils/couleur/couleur.interface';

function déterminerValeursNumériques(couleur: CouleurHexa): CouleurRVB {
  const couleurValeursHexa = couleur.replace('#', '');
  return {
    r: Number.parseInt(couleurValeursHexa.slice(0, 2), 16),
    v: Number.parseInt(couleurValeursHexa.slice(2, 4), 16),
    b: Number.parseInt(couleurValeursHexa.slice(4, 6), 16),
  };
}

function soustraireCouleurs(couleurA: CouleurRVB, couleurB: CouleurRVB): CouleurRVB {
  return {
    r: couleurB.r - couleurA.r,
    v: couleurB.v - couleurA.v,
    b: couleurB.b - couleurA.b,
  };
}

function restreintLaCouleurDansUnIntervalle(couleur: CouleurRVB, borne1: CouleurRVB, borne2: CouleurRVB): CouleurRVB {
  const rougeMin = Math.min(borne1.r, borne2.r);
  const vertMin = Math.min(borne1.v, borne2.v);
  const bleuMin = Math.min(borne1.b, borne2.b);

  const rougeMax = Math.max(borne1.r, borne2.r);
  const vertMax = Math.max(borne1.v, borne2.v);
  const bleuMax = Math.max(borne1.b, borne2.b);

  return {
    r: Math.min(rougeMax, Math.max(rougeMin, couleur.r)),
    v: Math.min(vertMax, Math.max(vertMin, couleur.v)),
    b: Math.min(bleuMax, Math.max(bleuMin, couleur.b)),
  };
}

function interpolerCouleursRVB(couleurRVBDépart: CouleurRVB, couleurRVBArrivée: CouleurRVB, pourcentage: number): CouleurRVB {
  const différences = soustraireCouleurs(couleurRVBDépart, couleurRVBArrivée);
  const couleurRVBInterpolée = {
    r: ((différences.r * pourcentage / 100) + couleurRVBDépart.r),
    v: ((différences.v * pourcentage / 100) + couleurRVBDépart.v),
    b: ((différences.b * pourcentage / 100) + couleurRVBDépart.b),
  };
  return restreintLaCouleurDansUnIntervalle(couleurRVBInterpolée, couleurRVBDépart, couleurRVBArrivée);
}

function convertitEnHexadécimal(valeur: number): string {
  const hexadécimal = valeur.toString(16);
  const hexadécimalSansDécimale = hexadécimal.split('.')[0];
  return hexadécimalSansDécimale.padStart(2, '0');
}

export const interpolerCouleurs = (couleurDépart: CouleurHexa, couleurArrivée: CouleurHexa, pourcentage: number): CouleurHexa => {
  const couleurRVBDépart = déterminerValeursNumériques(couleurDépart);
  const couleurRVBArrivée = déterminerValeursNumériques(couleurArrivée);
  const couleurRVB = interpolerCouleursRVB(couleurRVBDépart, couleurRVBArrivée, pourcentage);

  let hexaRouge = convertitEnHexadécimal(couleurRVB.r);
  let hexaVert = convertitEnHexadécimal(couleurRVB.v);
  let hexaBleu = convertitEnHexadécimal(couleurRVB.b);

  return `#${hexaRouge}${hexaVert}${hexaBleu}`;
};

export function générerCouleursAléatoiresEntreDeuxCouleurs(couleurClair: CouleurHexa, couleurFoncée: CouleurHexa, nombreDeCouleurs: number) {
  return chroma.scale([couleurFoncée, couleurClair]).mode('lch').colors(nombreDeCouleurs);
}
