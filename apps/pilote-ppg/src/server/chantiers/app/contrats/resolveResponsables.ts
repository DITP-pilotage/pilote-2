import { UtilisateurEnrichi } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { getServiceLibelle } from "@/utils/referentiel-services";

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
    return [
      {
        nom: `${u.prenom} ${u.nom}`,
        email: u.email,
        service: getServiceLibelle(
          u.perimetre_ministeriel,
          u.service,
          u.service_autre,
        ),
        fonction: u.fonction ?? null,
      },
    ];
  });
}
