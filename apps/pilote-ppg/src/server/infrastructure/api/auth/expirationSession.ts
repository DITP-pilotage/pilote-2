import { PROVIDER_PROCONNECT } from "@/server/infrastructure/api/auth/proconnect";

/**
 * Providers dont l'access token ne conditionne pas la durée de la session
 * PILOTE.
 *
 * ProConnect plafonne son refresh token à 2 h en dur, sans rotation : le
 * rafraîchir au-delà est impossible. La session PILOTE est donc autonome, et le
 * contrôle d'accès continu passe par le statut du compte en base (proxy.ts)
 * plutôt que par l'IdP.
 */
const PROVIDERS_SANS_RAFRAICHISSEMENT = [PROVIDER_PROCONNECT, "credentials"];

export const sessionExpiree = ({
  provider,
  accessTokenExpires,
  maintenant,
}: {
  provider: string;
  accessTokenExpires: number;
  maintenant: number;
}): boolean => {
  if (PROVIDERS_SANS_RAFRAICHISSEMENT.includes(provider)) {
    return false;
  }
  return maintenant >= accessTokenExpires;
};
