import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';

export default interface ChantierInfoRepository {
  add(chantier: ChantierInfo): Promise<void>;
  getListe(): Promise<ChantierInfo[]>;
}
