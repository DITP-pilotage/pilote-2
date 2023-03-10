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
