const MESSAGE_GENERIQUE =
  "La connexion n'a pas abouti. Vous pouvez réessayer ci-dessous.";

const MESSAGES_PAR_MOTIF: Record<string, string> = {
  compte_inconnu:
    "Nous n'avons trouvé aucun compte PILOTE correspondant à votre adresse électronique. Votre compte doit avoir été créé au préalable par un administrateur.",
  compte_desactive:
    "Votre compte PILOTE est désactivé. Contactez l'assistance pour demander sa réactivation.",
  email_absent:
    "Le fournisseur d'identité n'a transmis aucune adresse électronique exploitable. Sans elle, nous ne pouvons pas retrouver votre compte PILOTE.",
};

export const messageDeConnexion = ({
  motif,
  error,
}: {
  motif: string | null;
  error: string | null;
}): string | null => {
  if (motif) {
    return MESSAGES_PAR_MOTIF[motif] ?? MESSAGE_GENERIQUE;
  }
  if (error) {
    return MESSAGE_GENERIQUE;
  }
  return null;
};
