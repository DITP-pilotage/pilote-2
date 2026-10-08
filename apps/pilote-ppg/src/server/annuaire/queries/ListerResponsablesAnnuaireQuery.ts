import { $Enums } from "@prisma/client";
import type { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Inject } from "@/server/annuaire/module";
import {
  MAILLES_ANNUAIRE,
  type PersonneAnnuaire,
  personnesRetenues,
  selectionTerritoire,
  type TerritoireAnnuaire,
  versTerritoireAnnuaire,
} from "./personnesAnnuaire";

export type ChantierAnnuaire = { id: string; nom: string };

export type AffectationResponsable = {
  personneId: string;
  chantier: ChantierAnnuaire;
  territoire: TerritoireAnnuaire;
};

export type AnnuaireResponsables = {
  personnes: PersonneAnnuaire[];
  affectations: AffectationResponsable[];
};

export class ListerResponsablesAnnuaireQuery {
  private readonly prisma: PrismaPilote;
  private readonly utilisateurRepository: UtilisateurRepository;

  constructor({
    prisma,
    utilisateurRepository,
  }: Inject<"prisma" | "utilisateurRepository">) {
    this.prisma = prisma;
    this.utilisateurRepository = utilisateurRepository;
  }

  async run(): Promise<AnnuaireResponsables> {
    const prisma = this.prisma.getInstance();

    const lignes = await prisma.chantier_territoire.findMany({
      where: {
        maille: { in: MAILLES_ANNUAIRE },
        responsables_locaux_ids: { isEmpty: false },
        chantier_identite: { statut: $Enums.type_statut.PUBLIE },
      },
      orderBy: [
        { chantier_identite: { nom: "asc" } },
        { territoire_code: "asc" },
      ],
      select: {
        responsables_locaux_ids: true,
        chantier_identite: { select: { id: true, nom: true } },
        territoire: { select: selectionTerritoire },
      },
    });

    const utilisateurParId = await this.utilisateurRepository.recupererParIds(
      lignes.flatMap((ligne) => ligne.responsables_locaux_ids),
    );

    const affectations = lignes.flatMap((ligne) => {
      const chantier = {
        id: ligne.chantier_identite.id,
        nom: ligne.chantier_identite.nom,
      };
      const territoire = versTerritoireAnnuaire(ligne.territoire);
      return ligne.responsables_locaux_ids
        .filter((id) => utilisateurParId.has(id))
        .map((personneId) => ({ personneId, chantier, territoire }));
    });

    return {
      personnes: personnesRetenues(affectations, utilisateurParId),
      affectations,
    };
  }
}
