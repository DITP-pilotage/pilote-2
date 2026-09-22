/**
 * Statut d'un compte PILOTE PPG du point de vue de l'authentification.
 * `desactive` correspond à une `date_desactivation` non nulle, convention
 * utilisée dans tout le code (cf. UtilisateurListeGestionContrat).
 */
export type StatutCompte = "actif" | "desactive" | "inconnu";

/**
 * Ce que l'authentification a besoin de savoir d'un compte : son statut et le
 * profil qui porte ses droits. `profilCode` est nul quand aucun compte ne
 * correspond à l'email.
 */
export type CompteAuthentification = {
  statut: StatutCompte;
  profilCode: string | null;
};
