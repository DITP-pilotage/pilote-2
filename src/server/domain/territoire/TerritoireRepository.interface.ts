import { territoire } from '@prisma/client';

export default interface TerritoireRepository {
  récupérerTous(): Promise<territoire[]>
}
