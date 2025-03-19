import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ChantierPourExport } from '@/server/chantiers/domain/ChantierPourExport';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  PropositionValeurAvancementChantierInformation,
} from '@/server/chantiers/domain/PropositionValeurAvancementChantierInformation';

export interface ChantierRepository {
  récupérerDonneesChantier(chantierId: string, territoireCodesLecture: string[]): Promise<DonneeChantier[]>;
  récupérerPourExports(chantierId: string, territoireCodesLecture: string[], optionsExport: OptionsExport, jalon: number): Promise<ChantierPourExport[] | null>;
  récupérerPourExportsV2(chantierId: string, territoireCodesLecture: string[], optionsExport: OptionsExport, jalon: number): Promise<ChantierPourExport[] | null>;
  récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(chantierIds: string[], optionsExport: OptionsExport): Promise<Chantier['id'][]>;
  recupererPropositionValeurAvancementChantierInformationParIndicId({ indicId }: { indicId: string }): Promise<PropositionValeurAvancementChantierInformation>;
}
