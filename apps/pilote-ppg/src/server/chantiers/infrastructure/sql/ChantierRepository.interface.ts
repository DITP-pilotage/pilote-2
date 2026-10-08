import { ChantierPourAgregation } from "@/server/chantiers/domain/agregateurListeChantiers/agregateur";

export interface ChantierRepository {
  recupererDonneesAvancementChantiers(
    chantierIds: string[],
    jalon: number,
  ): Promise<ChantierPourAgregation[]>;
}
