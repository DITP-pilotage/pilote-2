import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';
import { HistoriqueIndicateurPourExport } from '@/server/chantiers/domain/HistoriqueIndicateurPourExport';

export interface IndicateurRepository {
  listerParIndicId({ indicId, jalon }: { indicId: string, jalon: number }): Promise<DonneeIndicateur[]>;
  supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void>;
  récupérerPourExports(chantierIdsLecture: string, territoireCodesLecture: string[], jalon: number): Promise<IndicateurPourExport[]>;
  récupérerHistoriquePourExports(chantierIdsLecture: string, territoireCodesLecture: string[], jalon: number): Promise<HistoriqueIndicateurPourExport[]>;
  récupérerChantierIdAssocié(indicateurId: string): Promise<string>
  récupérerDétailsParMailles(IndicateurId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<DétailsIndicateurMailles>
  récupérerDétailsTerritoirePourUnIndicateur(indicateurId: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<DétailsIndicateurTerritoire>
  récupérerParChantierId(chantierId: string): Promise<Indicateur[]>;
  récupérerDétailsParIndicIdEtMaille(indicateurId: string, maille: Maille, jalon: number): Promise<DétailsIndicateurs>;
  récupererDétailsParChantierIdEtTerritoire(chantierId: string, territoireCodes: string[], jalon: number): Promise<DétailsIndicateurs>;
  récupérerGroupésParChantier(chantiersIds: Chantier['id'][]): Promise<Record<string, Indicateur[]>>
  récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee, jalon: number): Promise<Record<Chantier['id'], DétailsIndicateurs>>
  recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(chantiersIds: Chantier['id'][]): Promise<Indicateur['id'][]>;
}
