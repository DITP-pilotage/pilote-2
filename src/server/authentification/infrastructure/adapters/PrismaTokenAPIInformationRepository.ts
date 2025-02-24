import { TokenAPIInformationRepository } from '@/server/authentification/domain/ports/TokenAPIInformationRepository';
import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';
import { prisma } from '@/server/db/prisma';

export class PrismaTokenAPIInformationRepository implements TokenAPIInformationRepository {
  async recupererTokenAPIInformation({ email }: { email: string }): Promise<TokenAPIInformation | null> {
    const result = await prisma.token_api_information.findUnique({
      where: { email },
    });

    if (!result) {
      return null;
    }

    return TokenAPIInformation.creerTokenAPIInformation({
      email: result.email,
      dateCreation: result.date_creation,
    });
  }

  async listerTokenAPIInformation(): Promise<TokenAPIInformation[]> {
    const result = await prisma.token_api_information.findMany({
      orderBy: {
        date_creation: 'asc',
      },
    });

    return result.map(tokenAPI => TokenAPIInformation.creerTokenAPIInformation({
      email: tokenAPI.email,
      dateCreation: tokenAPI.date_creation,
    }));
  }

  async sauvegarderTokenAPIInformation({ email, dateCreation }: {
    email: string;
    dateCreation: string
  }): Promise<void> {
    await prisma.token_api_information.create({
      data: {
        email,
        date_creation: dateCreation,
      },
    });
  }

  async supprimerTokenAPIInformation({ email }: {
    email: string;
  }): Promise<void> {
    await prisma.token_api_information.delete({
      where: {
        email,
      },
    });
  }
}
