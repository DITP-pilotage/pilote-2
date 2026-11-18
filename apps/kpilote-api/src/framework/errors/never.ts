// Branche d'erreur d'un `.match` dont le type d'erreur est `never` : le paramètre `never`
// fait échouer la compilation dès que la command ou la query peut renvoyer une erreur.
export const never = (_error: never): never => {
  throw new Error('unreachable')
}
