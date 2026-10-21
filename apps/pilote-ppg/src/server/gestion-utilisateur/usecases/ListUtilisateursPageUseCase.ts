import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";
import {
  presenterEnUtilisateurListeGestionContrat,
  UtilisateurListeGestionContrat,
} from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { FiltreQueryParams } from "@/server/gestion-utilisateur/app/contrats/FiltreQueryParams";
import type { Inject } from "@/server/gestion-utilisateur/module";

export type UtilisateursPage = {
  utilisateurs: UtilisateurListeGestionContrat[];
  total: number;
};

export class ListUtilisateursPageUseCase {
  constructor(
    private readonly deps: Inject<
      | "recupererListeUtilisateursUseCase"
      | "filtrerListeUtilisateursUseCase"
      | "territoireRepository"
    >,
  ) {}

  async run({
    filters,
    search,
    sorting,
    page,
    pageSize,
    profil,
    habilitation,
  }: {
    filters: FiltreQueryParams;
    search: string;
    sorting: { id: string; desc: boolean }[];
    page: number;
    pageSize: number;
    profil: ProfilCode;
    habilitation: Habilitation;
  }): Promise<UtilisateursPage> {
    const [utilisateurs, territoires] = await Promise.all([
      this.deps.recupererListeUtilisateursUseCase.run({
        sorting,
        valeurDeLaRecherche: search,
      }),
      this.deps.territoireRepository.listAll(),
    ]);

    const filteredUtilisateurs = this.deps.filtrerListeUtilisateursUseCase.run({
      utilisateurs,
      filtresActifs: filters,
      profil,
      habilitation,
    });

    return {
      utilisateurs: filteredUtilisateurs
        .slice(page * pageSize, (page + 1) * pageSize)
        .map((utilisateur) =>
          presenterEnUtilisateurListeGestionContrat(utilisateur, territoires),
        ),
      total: filteredUtilisateurs.length,
    };
  }
}
