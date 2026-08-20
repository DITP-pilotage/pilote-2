import { Session } from "next-auth";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { ForbiddenError } from "@/server/app/error-boundary/forbidden-error";

export function vérifierPermissionAdmin(
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
