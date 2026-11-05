import type { Inject } from "@/server/albert/module";
import type { ResolvedPerson } from "@/shared/personne/personReference";
import { versPersonne } from "@/server/chantiers/app/contrats/resolveResponsables";

export class ResolvePersonsQuery {
  constructor(private readonly deps: Inject<"utilisateurRepository">) {}

  async execute({ ids }: { ids: string[] }): Promise<ResolvedPerson[]> {
    const utilisateurs =
      await this.deps.utilisateurRepository.recupererParIds(ids);
    return [...utilisateurs.values()].map(versPersonne);
  }
}
