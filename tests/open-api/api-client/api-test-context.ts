import { encode } from "next-auth/jwt";
import Playwright from "playwright-core";
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
    playwright: typeof Playwright,
    profile: UserProfile,
  ): Promise<ApiTestContext> {
    const config = USER_PROFILES[profile];

    const token = await encode({
      token: { email: config.email },
      secret: process.env.TOKEN_API_SECRET!,
      maxAge: 365 * 24 * 60 * 60,
    });

    await prisma.token_api_information.upsert({
      where: { email: config.email },
      update: { date_creation: new Date().toISOString() },
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

    await prisma.token_api_information.deleteMany({
      where: { email: this.userEmail },
    });
  }
}
