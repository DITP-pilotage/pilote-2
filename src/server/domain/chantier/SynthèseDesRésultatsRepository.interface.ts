import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

export default interface SynthèseDesRésultatsRepository {
  findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null>
}
