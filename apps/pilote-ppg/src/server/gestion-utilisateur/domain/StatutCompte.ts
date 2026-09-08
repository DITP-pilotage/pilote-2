/**
 * Statut d'un compte PILOTE PPG du point de vue de l'authentification.
 * `desactive` correspond à une `date_desactivation` non nulle, convention
 * utilisée dans tout le code (cf. UtilisateurListeGestionContrat).
 */
export type StatutCompte = "actif" | "desactive" | "inconnu";
