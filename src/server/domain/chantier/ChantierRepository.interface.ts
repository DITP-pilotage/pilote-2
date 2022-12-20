import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';

export default interface ChantierRepository {
  add(chantier: ChantierInfo): Promise<void>;
  getListe(): Promise<ChantierInfo[]>;
}
