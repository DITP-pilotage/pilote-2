import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from "@prisma/client";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { RepartitionMeteoChantiers } from "@/server/chantiers/domain/RepartitionMeteoChantiers";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { ChantierPourAgregation } from "@/client/utils/chantier/agrégateurListeChantiers/agregateur";

export default interface ChantierRepository {
  récupérerLesEntréesDUnChantier(
    id: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<
    PrismaChantierIdentite & {
      chantier_territoire: (PrismaChantierTerritoire & {
        chantier_territoire_jalon: PrismaChantierTerritoireJalon[];
      })[];
    }
  >;
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
