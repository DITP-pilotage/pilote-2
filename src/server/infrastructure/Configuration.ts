export class Configuration {
  public readonly isUsingDatabase: Boolean;

  constructor(private readonly env: NodeJS.ProcessEnv) {
    this.isUsingDatabase = this.env.USE_DATABASE == 'true';
  }
}

export const config = new Configuration(process.env);
