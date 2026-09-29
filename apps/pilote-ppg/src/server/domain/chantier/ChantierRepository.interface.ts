import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { ChantierPourAgregation } from "@/client/utils/chantier/agrégateurListeChantiers/agregateur";

export default interface ChantierRepository {
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
