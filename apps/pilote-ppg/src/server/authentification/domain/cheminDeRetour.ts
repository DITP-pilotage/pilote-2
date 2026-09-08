/**
 * Un chemin de retour doit rester interne à PILOTE. On refuse toute valeur qui
 * pourrait être interprétée comme une URL absolue ou protocol-relative
 * (`//exemple.test`), sous peine d'ouvrir une redirection arbitraire depuis
 * l'écran de connexion.
 */
const CHEMIN_INTERNE = /^\/(?:[^/\\].*)?$/;
// 2048 est la limite d'URL de fait des navigateurs. En dessous, un chemin
// porteur de filtres nuqs se fait tronquer et on perd la destination.
const LONGUEUR_MAXIMALE = 2048;

export const cheminDeRetourSur = ({
  chemin,
}: {
  chemin: string | null | undefined;
}): string | null => {
  if (!chemin || chemin.length > LONGUEUR_MAXIMALE) {
    return null;
  }
  return CHEMIN_INTERNE.test(chemin) ? chemin : null;
};
