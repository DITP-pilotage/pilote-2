import { z } from "zod";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";

export class TerritoireNonAutoriséErreur extends ForbiddenError {
  constructor() {
    super("Territoire non autorisé");
  }
}

export class ChantierNonAutoriséErreur extends ForbiddenError {
  constructor() {
    super("Chantier non autorisé");
  }
}

export class MailleNonAutoriséeErreur extends ForbiddenError {
  constructor() {
    super("Maille non autorisée");
  }
}

export class ChantiersNonAutorisésCreationModificationUtilisateurErreur extends ForbiddenError {
  constructor() {
    super(
      "Au moins un des chantiers n'est pas autorisé pour la création ou modification de l'utilisateur",
    );
  }
}

export class TerritoiresNonAutorisésCreationModificationUtilisateurErreur extends ForbiddenError {
  constructor() {
    super(
      "Au moins un des territoires n'est pas autorisé pour la création ou modification de l'utilisateur",
    );
  }
}

export class ChantiersNonAutorisésSuppressionUtilisateurErreur extends ForbiddenError {
  constructor() {
    super(
      "Au moins un des chantiers n'est pas autorisé pour la supression de l'utilisateur",
    );
  }
}

export class TerritoiresNonAutorisésSuppressionUtilisateurErreur extends ForbiddenError {
  constructor() {
    super(
      "Au moins un des territoires n'est pas autorisé pour la suppression de l'utilisateur",
    );
  }
}

export class ProfilNonAutorisésSuppressionUtilisateurErreur extends ForbiddenError {
  constructor() {
    super("Le profil n'est pas autorisé pour la suppression de l'utilisateur");
  }
}

export const isENOENTError = (err: unknown) =>
  z.object({ code: z.literal("ENOENT") }).safeParse(err).success;

export const isUtilisateurDoublonError = (error: unknown) =>
  z
    .object({
      message: z.literal("Request failed with status code 409"),
      responseData: z.object({
        errorMessage: z.literal("User exists with same username"),
      }),
    })
    .safeParse(error).success;
