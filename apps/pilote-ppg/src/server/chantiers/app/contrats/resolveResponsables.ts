import { UtilisateurEnrichi } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import type { ResolvedPerson } from "@/shared/personne/personReference";
import { getServiceLibelle } from "@/utils/referentiel-services";

export function versPersonne(utilisateur: UtilisateurEnrichi): ResolvedPerson {
  return {
    id: utilisateur.id,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
    email: utilisateur.email,
    service: getServiceLibelle(
      utilisateur.perimetre_ministeriel,
      utilisateur.service,
      utilisateur.service_autre,
    ),
    fonction: utilisateur.fonction ?? null,
    estDesactive: utilisateur.date_desactivation !== null,
  };
}

export function resolveNoms(
  ids: string[],
  utilisateurParId: Map<string, UtilisateurEnrichi>,
): string[] {
  return ids
    .map((id) => utilisateurParId.get(id))
    .filter((u): u is UtilisateurEnrichi => !!u)
    .map((u) => `${u.prenom} ${u.nom}`);
}

export function resolveMails(
  ids: string[],
  utilisateurParId: Map<string, UtilisateurEnrichi>,
): string[] {
  return ids
    .map((id) => utilisateurParId.get(id)?.email)
    .filter((e): e is string => !!e);
}

export function resolveResponsables(
  ids: string[],
  utilisateurParId: Map<string, UtilisateurEnrichi>,
) {
  return ids.flatMap((id) => {
    const u = utilisateurParId.get(id);
    if (!u) return [];
    const personne = versPersonne(u);
    return [
      {
        nom: `${personne.prenom} ${personne.nom}`,
        email: personne.email,
        service: personne.service,
        fonction: personne.fonction,
      },
    ];
  });
}
