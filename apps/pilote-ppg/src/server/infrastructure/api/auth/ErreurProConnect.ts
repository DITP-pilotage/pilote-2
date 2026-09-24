export const PROVIDER_PROCONNECT = "proconnect";

/**
 * Une erreur levée depuis le handler `userinfo` traverse Auth.js sans être
 * enveloppée : elle arrive telle quelle au `logger.error` de la configuration,
 * qui n'en connaît que le nom et la cause. D'où cette classe nommée plutôt
 * qu'un `Error` anonyme, sans quoi le panel administrateur afficherait un
 * « Error » indistinct de n'importe quel autre échec d'authentification.
 *
 * L'identifiant du provider vit ici, et non dans `proconnect.ts` : ce module
 * doit rester importable sans déclencher la configuration du provider, qui lit
 * l'environnement dès son évaluation.
 */
export class ErreurProConnect extends Error {
  constructor(message: string) {
    super(message, { cause: { provider: PROVIDER_PROCONNECT } });
    this.name = "ErreurProConnect";
  }
}
