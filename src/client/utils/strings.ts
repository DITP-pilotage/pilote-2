import DOMPurify from 'isomorphic-dompurify';

export function normaliserChaîneDeCaractères(chaîneDeCaractères: string) {
  return chaîneDeCaractères
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036F]/g, ''); // Enlève les diacritiques
}


export function nettoyerUneChaîneDeCaractèresPourAffichageHTML(chaîneDeCaractères: string) {
  const chaîneDeCaractèresAvecBr = chaîneDeCaractères.replaceAll('\n', '<br/>');
  return DOMPurify.sanitize(chaîneDeCaractèresAvecBr);
}


export function commenceParUneVoyelle(chaîneDeCaractères: string) {
  const VOYELLES = ['a', 'e', 'i', 'o', 'u', 'y'];
  return VOYELLES.includes(
    normaliserChaîneDeCaractères(chaîneDeCaractères).charAt(0),
  );
}

export function normaliseNom(nom: string) {
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

const INDEX_A_NE_PAS_METTRE_AVEC_VIRGULE = 0;

export const ajoutVirguleAprèsIndex = (index: number) => {
  return (index !== INDEX_A_NE_PAS_METTRE_AVEC_VIRGULE ? ', ' : '');
};
