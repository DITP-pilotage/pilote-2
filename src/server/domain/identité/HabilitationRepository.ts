import Habilitations from '@/server/domain/identité/Habilitations';

export default interface HabilitationRepository {
  getByUserId(userId: string): Promise<Habilitations>,
}
