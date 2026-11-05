import type { Inject } from "@/server/albert/module";
import type { ResolvedPerson } from "@/shared/personne/personReference";
import { getServiceLibelle } from "@/utils/referentiel-services";

const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ResolvePersonsQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute({ ids }: { ids: string[] }): Promise<ResolvedPerson[]> {
    // `utilisateur.id` est un UUID : un seul identifiant malformé ferait échouer toute la requête.
    const validIds = [...new Set(ids)].filter((id) => UUID_FORMAT.test(id));
    if (validIds.length === 0) return [];

    const utilisateurs = await this.deps.prisma
      .getInstance()
      .utilisateur.findMany({
        where: { id: { in: validIds } },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          perimetre_ministeriel: true,
          service: true,
          service_autre: true,
          fonction: true,
          date_desactivation: true,
        },
      });

    return utilisateurs.map((utilisateur) => ({
      id: utilisateur.id,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      email: utilisateur.email,
      service: getServiceLibelle(
        utilisateur.perimetre_ministeriel,
        utilisateur.service,
        utilisateur.service_autre,
      ),
      fonction: utilisateur.fonction,
      estDesactive: utilisateur.date_desactivation !== null,
    }));
  }
}
