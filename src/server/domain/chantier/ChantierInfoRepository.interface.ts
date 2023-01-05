import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';

export default interface ChantierInfoRepository {
  getListe(): Promise<ChantierInfo[]>;
}
