import { inflateRawSync } from "node:zlib";

const SIGNATURE_EOCD = 0x06054b50;
const SIGNATURE_CENTRAL = 0x02014b50;
const TAILLE_EOCD = 22;

const TAILLE_DECOMPRESSEE_MAX_DEFAUT = 64 * 1024 * 1024;
const NOMBRE_ENTREES_MAX_DEFAUT = 512;

export class FichierTabulaireIllisibleError extends Error {
  constructor(
    public readonly raison: string,
    message: string,
  ) {
    super(message);
    this.name = "FichierTabulaireIllisibleError";
  }
}

type EntreeCentrale = {
  nom: string;
  methode: number;
  chiffree: boolean;
  tailleCompressee: number;
  tailleDecompressee: number;
  offsetLocal: number;
};

function trouverEocd(archive: Buffer): number {
  const debut = Math.max(0, archive.length - TAILLE_EOCD - 0xffff);
  for (let i = archive.length - TAILLE_EOCD; i >= debut; i -= 1) {
    if (archive.readUInt32LE(i) === SIGNATURE_EOCD) {
      return i;
    }
  }
  throw new FichierTabulaireIllisibleError(
    "zip-invalide",
    "Le fichier n'est pas une archive lisible. Enregistrez-le au format .xlsx standard.",
  );
}

function lireCentralDirectory(archive: Buffer): EntreeCentrale[] {
  if (archive.length < TAILLE_EOCD) {
    throw new FichierTabulaireIllisibleError(
      "zip-invalide",
      "Le fichier n'est pas une archive lisible. Enregistrez-le au format .xlsx standard.",
    );
  }

  const eocd = trouverEocd(archive);
  const nombreEntrees = archive.readUInt16LE(eocd + 10);
  const offsetCentral = archive.readUInt32LE(eocd + 16);

  if (nombreEntrees === 0xffff || offsetCentral === 0xffffffff) {
    throw new FichierTabulaireIllisibleError(
      "zip64",
      "Les archives ZIP64 ne sont pas prises en charge. Réenregistrez le fichier depuis votre tableur.",
    );
  }

  const entrees: EntreeCentrale[] = [];
  let position = offsetCentral;

  for (let i = 0; i < nombreEntrees; i += 1) {
    if (
      position + 46 > archive.length ||
      archive.readUInt32LE(position) !== SIGNATURE_CENTRAL
    ) {
      throw new FichierTabulaireIllisibleError(
        "zip-invalide",
        "Le fichier n'est pas une archive lisible. Enregistrez-le au format .xlsx standard.",
      );
    }
    const flags = archive.readUInt16LE(position + 8);
    const longueurNom = archive.readUInt16LE(position + 28);
    const longueurExtra = archive.readUInt16LE(position + 30);
    const longueurCommentaire = archive.readUInt16LE(position + 32);

    entrees.push({
      nom: archive
        .subarray(position + 46, position + 46 + longueurNom)
        .toString("utf-8"),
      methode: archive.readUInt16LE(position + 10),
      chiffree: (flags & 0x0001) !== 0,
      tailleCompressee: archive.readUInt32LE(position + 20),
      tailleDecompressee: archive.readUInt32LE(position + 24),
      offsetLocal: archive.readUInt32LE(position + 42),
    });

    position += 46 + longueurNom + longueurExtra + longueurCommentaire;
  }

  return entrees;
}

function extraire(
  archive: Buffer,
  entree: EntreeCentrale,
  plafond: number,
): Buffer {
  if (entree.chiffree) {
    throw new FichierTabulaireIllisibleError(
      "chiffre",
      "Le fichier est protégé par un mot de passe. Enregistrez-le sans protection avant de l'importer.",
    );
  }

  // L'en-tête local redéclare les longueurs de nom et d'extra, qui peuvent
  // différer de celles du central directory : on les relit ici.
  const longueurNom = archive.readUInt16LE(entree.offsetLocal + 26);
  const longueurExtra = archive.readUInt16LE(entree.offsetLocal + 28);
  const debutDonnees = entree.offsetLocal + 30 + longueurNom + longueurExtra;
  const donnees = archive.subarray(
    debutDonnees,
    debutDonnees + entree.tailleCompressee,
  );

  if (entree.methode === 0) {
    return Buffer.from(donnees);
  }
  if (entree.methode !== 8) {
    throw new FichierTabulaireIllisibleError(
      "compression-non-supportee",
      "Le fichier utilise une compression non prise en charge. Réenregistrez-le depuis votre tableur.",
    );
  }

  try {
    // `maxOutputLength` est appliqué par zlib lui-même : une archive qui ment
    // sur sa taille décompressée est arrêtée à l'inflation, pas après.
    return inflateRawSync(donnees, { maxOutputLength: plafond });
  } catch {
    throw new FichierTabulaireIllisibleError(
      "trop-volumineux",
      "Le contenu décompressé du fichier dépasse la taille autorisée.",
    );
  }
}

export function lireEntreesZip(
  archive: Buffer,
  entreesVoulues: string[],
  limites: {
    tailleDecompresseeMax?: number;
    nombreEntreesMax?: number;
  } = {},
): Map<string, Buffer> {
  const tailleMax =
    limites.tailleDecompresseeMax ?? TAILLE_DECOMPRESSEE_MAX_DEFAUT;
  const entreesMax = limites.nombreEntreesMax ?? NOMBRE_ENTREES_MAX_DEFAUT;

  const central = lireCentralDirectory(archive);

  if (central.length > entreesMax) {
    throw new FichierTabulaireIllisibleError(
      "trop-d-entrees",
      "Le fichier contient trop d'éléments internes pour être traité.",
    );
  }

  // Les tailles annoncées sont vérifiées avant toute inflation : c'est ce que
  // le central directory permet et qu'une librairie de décompression ne donne
  // pas.
  const total = central.reduce((somme, e) => somme + e.tailleDecompressee, 0);
  if (total > tailleMax) {
    throw new FichierTabulaireIllisibleError(
      "trop-volumineux",
      "Le contenu décompressé du fichier dépasse la taille autorisée.",
    );
  }

  const resultat = new Map<string, Buffer>();
  for (const voulue of entreesVoulues) {
    const entree = central.find((e) => e.nom === voulue);
    if (entree) {
      resultat.set(voulue, extraire(archive, entree, tailleMax));
    }
  }
  return resultat;
}
