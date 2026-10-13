import { Session } from "next-auth";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { ForbiddenError } from "@/shared/errors/forbidden-error";

export function checkAdminPermission(
  session: Session & { user: Session["user"] },
) {
  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    throw new ForbiddenError("Accès non autorisé");
  }
}
