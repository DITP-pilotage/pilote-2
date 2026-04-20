export class RapportNotFoundError extends Error {
  constructor(idRapport: string) {
    super(`Le rapport'${idRapport} n'existe pas'.`);
  }
}
