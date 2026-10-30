// Les valeurs factices des fichiers d'env (to-be-defined, TBD, ToBeDefined) désactivent Keycloak.
export function isKeycloakImportEnabled(
  keycloakUrl: string | undefined,
): boolean {
  return keycloakUrl?.startsWith("http") ?? false;
}
