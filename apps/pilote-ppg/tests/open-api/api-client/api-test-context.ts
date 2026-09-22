import { encode } from "next-auth/jwt";
import { APIRequest } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { OpenApiClient } from "./open-api.client";

export type UserProfile = "DITP_ADMIN" | "EQUIPE_DIR_PROJET";

type UserConfig = {
  email: string;
  chantierId?: string;
  indicateurId?: string;
};

const USER_PROFILES: Record<UserProfile, UserConfig> = {
  DITP_ADMIN: {
    email: "ditp.admin@example.com",
  },
  EQUIPE_DIR_PROJET: {
    email: "equipe.dir.projet@example.com",
    chantierId: "CH-129",
    indicateurId: "IND-021",
  },
};

export class ApiTestContext {
  private client: OpenApiClient | null = null;

  readonly userEmail: string;

  readonly chantierId?: string;

  readonly indicateurId?: string;

  private constructor(client: OpenApiClient, config: UserConfig) {
    this.client = client;
    this.userEmail = config.email;
    this.chantierId = config.chantierId;
    this.indicateurId = config.indicateurId;
  }

  static async create(
    playwright: { request: APIRequest },
    profile: UserProfile,
  ): Promise<ApiTestContext> {
    const config = USER_PROFILES[profile];

    const token = await encode({
      token: { email: config.email },
      secret: process.env.TOKEN_API_SECRET!,
      maxAge: 365 * 24 * 60 * 60,
      salt: "authjs.session-token",
    });

    // La ligne token_api_information est une donnée de test partagée par tous les
    // fichiers open-api : on la crée si elle manque et on ne la supprime jamais,
    // sinon un fichier en parallèle perd son token (403) au dispose d'un autre.
    await prisma.token_api_information.upsert({
      where: { email: config.email },
      update: {},
      create: {
        email: config.email,
        date_creation: new Date().toISOString(),
      },
    });

    const apiContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const client = new OpenApiClient(apiContext);

    return new ApiTestContext(client, config);
  }

  getClient(): OpenApiClient {
    if (!this.client) {
      throw new Error("ApiTestContext not initialized. Call create() first.");
    }
    return this.client;
  }

  async dispose(): Promise<void> {
    if (this.client) {
      await this.client.dispose();
    }
  }
}
