import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { ChantierPourAgregation } from "@/server/chantiers/domain/agrégateurListeChantiers/agregateur";

export interface ChantierRepository {
  recupererLaRepartitionMeteo(
    chantiersLectureIds: string[],
    territoireCode: string,
    filtres: FiltreQueryParams,
  ): Promise<RepartitionMeteoChantiers>;
  recupererDonneesAvancementChantiers(
    chantierIds: string[],
    jalon: number,
  ): Promise<ChantierPourAgregation[]>;
}
