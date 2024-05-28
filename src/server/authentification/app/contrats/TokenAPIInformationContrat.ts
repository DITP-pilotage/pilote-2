import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';
import { formaterDate } from '@/client/utils/date/date';

export type TokenAPIInformationContrat = { email: string, dateExpiration: string };

export const presenterEnTokenAPIInformationContrat = (tokenApi: TokenAPIInformation): TokenAPIInformationContrat => {
  const dateExpiration = new Date(tokenApi.dateCreation);

  dateExpiration.setFullYear(new Date(tokenApi.dateCreation).getFullYear() + 1);

  return {
    email: tokenApi.email,
    dateExpiration: formaterDate(dateExpiration.toISOString(), 'DD/MM/YYYY') || 'Erreur date expiration',
  };
};
