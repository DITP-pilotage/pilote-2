import fs from 'node:fs';

export function recupererFichier(cheminCompletDuFichier: string) {
  return fs.createReadStream(cheminCompletDuFichier);
}

export function supprimerLeFichier(cheminCompletDuFichier: string) {
  fs.unlink(cheminCompletDuFichier, () => {});
}
