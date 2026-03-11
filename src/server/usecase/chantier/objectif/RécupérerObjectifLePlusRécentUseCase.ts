import Objectif, {
  TypeObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import type { Inject } from "@/server/legacy/module";

export default class RécupérerObjectifLePlusRécentUseCase {
  private readonly objectifRepository: ObjectifRepository;

  constructor({ objectifRepository }: Inject<"objectifRepository">) {
    this.objectifRepository = objectifRepository;
  }

  async run(
    chantierId: string,
    type: TypeObjectif,
    habilitations: Habilitations,
  ): Promise<Objectif> {
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnLecture(chantierId, null);

    return this.objectifRepository.récupérerLePlusRécent(chantierId, type);
  }
}
