import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";

export type MotifRefusConnexion =
  | "double_authentification_absente"
  | "email_absent"
  | "compte_inconnu"
  | "compte_desactive";

/**
 * Niveaux eidas ProConnect qui impliquent une authentification multi-facteur.
 * `eidas1-mfa` est aussi la valeur renvoyée quand ProConnect relaie la MFA par
 * un OTP mail, faute de FI compatible.
 *
 * https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/double_authentification
 */
export const ACR_DOUBLE_AUTHENTIFICATION = [
  "eidas0-mfa",
  "eidas1-mfa",
  "eidas2",
  "eidas3",
];

/**
 * ProConnect authentifie, PILOTE PPG autorise. Aucun compte ni aucune
 * habilitation n'est créé à partir des données ProConnect : l'email normalisé
 * est la seule clé de rapprochement avec un compte existant.
 *
 * La double authentification est contrôlée avant le rapprochement du compte :
 * une identité insuffisamment authentifiée ne doit rien apprendre de
 * l'existence d'un compte PILOTE.
 *
 * Retourne `null` si la connexion est autorisée, sinon le motif du refus.
 */
export const autoriserConnexionProConnect = async ({
  email,
  acr,
  recupererStatutCompte,
}: {
  email: string | null | undefined;
  acr: string | null | undefined;
  recupererStatutCompte: (email: string) => Promise<StatutCompte>;
}): Promise<MotifRefusConnexion | null> => {
  if (!ACR_DOUBLE_AUTHENTIFICATION.includes(acr ?? "")) {
    return "double_authentification_absente";
  }

  const emailNormalise = email?.trim().toLowerCase();
  if (!emailNormalise) {
    return "email_absent";
  }

  const statut = await recupererStatutCompte(emailNormalise);
  if (statut === "inconnu") {
    return "compte_inconnu";
  }
  if (statut === "desactive") {
    return "compte_desactive";
  }

  return null;
};
