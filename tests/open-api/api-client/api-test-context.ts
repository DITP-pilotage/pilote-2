import { Page } from "@playwright/test";
import Playwright from "playwright-core";
import { OpenApiClient } from "./open-api.client";
import { AppActions } from "../../actions/app.actions";
import { PageGestionTokenApi } from "../../pages/admin/page-gestion-token-api";

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
  private token: string | null = null;

  private client: OpenApiClient | null = null;

  private pageGestionToken: PageGestionTokenApi | null = null;

  readonly userEmail: string;

  readonly chantierId?: string;

  readonly indicateurId?: string;

  private constructor(
    private readonly page: Page,
    private readonly playwright: typeof Playwright,
    profile: UserProfile,
  ) {
    const config = USER_PROFILES[profile];
    this.userEmail = config.email;
    this.chantierId = config.chantierId;
    this.indicateurId = config.indicateurId;
  }

  static async create(
    page: Page,
    playwright: typeof Playwright,
    profile: UserProfile,
  ): Promise<ApiTestContext> {
    const context = new ApiTestContext(page, playwright, profile);
    await context.setup();
    return context;
  }

  private async setup(): Promise<void> {
    const appActions = new AppActions(this.page);
    await appActions.loginAs();

    this.pageGestionToken = new PageGestionTokenApi(this.page);
    await this.pageGestionToken.goto();
    this.token = await this.pageGestionToken.createToken(this.userEmail);

    const apiContext = await this.playwright.request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    this.client = new OpenApiClient(apiContext);
  }

  getClient(): OpenApiClient {
    if (!this.client) {
      throw new Error("ApiTestContext not initialized. Call create() first.");
    }
    return this.client;
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.dispose();
    }

    if (this.pageGestionToken && this.userEmail) {
      await this.pageGestionToken.goto();
      await this.pageGestionToken.deleteToken(this.userEmail);
    }
  }
}
