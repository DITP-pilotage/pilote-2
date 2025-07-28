export class NonAutorisé extends Error {}

export class TerritoireNonAutoriséErreur extends NonAutorisé {
  constructor() {
    super("Territoire non autorisé");
  }
}

export class ChantierNonAutoriséErreur extends NonAutorisé {
  constructor() {
    super("Chantier non autorisé");
  }
}

export class MailleNonAutoriséeErreur extends NonAutorisé {
  constructor() {
    super("Maille non autorisée");
  }
}

export class ChantiersNonAutorisésCreationModificationUtilisateurErreur extends NonAutorisé {
  constructor() {
    super(
      "Au moins un des chantiers n'est pas autorisé pour la création ou modification de l'utilisateur",
    );
  }
}

export class TerritoiresNonAutorisésCreationModificationUtilisateurErreur extends NonAutorisé {
  constructor() {
    super(
      "Au moins un des territoires n'est pas autorisé pour la création ou modification de l'utilisateur",
    );
  }
}

export class ChantiersNonAutorisésSuppressionUtilisateurErreur extends NonAutorisé {
  constructor() {
    super(
      "Au moins un des chantiers n'est pas autorisé pour la supression de l'utilisateur",
    );
  }
}

export class TerritoiresNonAutorisésSuppressionUtilisateurErreur extends NonAutorisé {
  constructor() {
    super(
      "Au moins un des territoires n'est pas autorisé pour la suppression de l'utilisateur",
    );
  }
}

export class ProfilNonAutorisésSuppressionUtilisateurErreur extends NonAutorisé {
  constructor() {
    super("Le profil n'est pas autorisé pour la suppression de l'utilisateur");
  }
}
