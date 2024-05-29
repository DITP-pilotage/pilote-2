import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';

export class TokenAPIInformationBuilder {
  private email: string = 'test@test.fr';

  private dateCreation: string = new Date().toISOString();

  withEmail(email: string): TokenAPIInformationBuilder {
    this.email = email;
    return this;
  }

  withDateCreation(dateCreation: string): TokenAPIInformationBuilder {
    this.dateCreation = dateCreation;
    return this;
  }

  build(): TokenAPIInformation {
    return TokenAPIInformation.creerTokenAPIInformation({
      email: this.email,
      dateCreation: this.dateCreation,
    });
  }
}
