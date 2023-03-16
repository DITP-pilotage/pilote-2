import Habilitation from '@/server/domain/identité/Habilitation';

export default interface HabilitationRepository {
  getByUserId(userId: string): Promise<Habilitation>,
}
