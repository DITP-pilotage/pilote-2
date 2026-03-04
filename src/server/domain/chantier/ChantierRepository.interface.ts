import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from "@prisma/client";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
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
  getChantierStatistiques(
    habilitations: Habilitations,
    listeChantier: Chantier["id"][],
    maille: Maille,
    jalon: number,
  ): Promise<AvancementsStatistiques>;
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
