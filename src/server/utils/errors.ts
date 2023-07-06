class ExtendableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InternalError extends ExtendableError {
  data: Record<string, unknown>;

  constructor(message: string, data: Record<string, unknown>) {
    super(message);
    this.data = data;
  }
}

export class ValidationError extends ExtendableError {}

export class ResourceNotFound extends ExtendableError {
  data: Record<string, unknown>;

  constructor(resource: string, query: Record<string, unknown> | string) {
    super(`Resource ${resource} was not found.`);
    this.data = { resource, query };
  }
}
export class NonAutorisé extends Error {}

export class TerritoireNonAutoriséErreur extends NonAutorisé {
  constructor() { super('Territoire non autorisé'); }
}

export class ChantierNonAutoriséErreur extends NonAutorisé {
  constructor() { super('Chantier non autorisé'); }
}

export class ProjetStructurantNonAutoriséErreur extends NonAutorisé {
  constructor() { super('Projet structurant non autorisé'); }
}

export class MailleNonAutoriséeErreur extends NonAutorisé {
  constructor() { super('Maille non autorisée'); }
}

export class ChantiersNonAutorisésCreationModificationUtilisateurErreur extends NonAutorisé {
  constructor() { super("Au moins un des chantiers n'est pas autorisé pour la création ou modification de l'utilisateur"); }
}

export class TerritoiresNonAutorisésCreationModificationUtilisateurErreur extends NonAutorisé {
  constructor() { super("Au moins un des territoires n'est pas autorisé pour la création ou modification de l'utilisateur"); }
}
