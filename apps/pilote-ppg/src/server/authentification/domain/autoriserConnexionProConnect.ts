import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";

export type MotifRefusConnexion =
  "email_absent" | "compte_inconnu" | "compte_desactive";

/**
 * ProConnect authentifie, PILOTE PPG autorise. Aucun compte ni aucune
 * habilitation n'est créé à partir des données ProConnect : l'email normalisé
 * est la seule clé de rapprochement avec un compte existant.
 *
 * Retourne `null` si la connexion est autorisée, sinon le motif du refus.
 */
export const autoriserConnexionProConnect = async ({
  email,
  recupererStatutCompte,
}: {
  email: string | null | undefined;
  recupererStatutCompte: (email: string) => Promise<StatutCompte>;
}): Promise<MotifRefusConnexion | null> => {
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
