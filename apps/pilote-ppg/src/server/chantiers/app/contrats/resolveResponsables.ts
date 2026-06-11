import { UtilisateurEnrichi } from "@/server/chantiers/domain/ports/ChantierRepository";
import { getServiceLibelle } from "@/utils/referentiel-services";

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
