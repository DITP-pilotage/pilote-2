# Solution Logs Admin - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist application logs to database via a Pino transport and expose an admin page with filterable table and trend charts.

**Architecture:** Custom Pino transport writes logs to PostgreSQL via a dedicated PrismaClient in a worker thread. A new Awilix module (`applicationLog`) exposes use cases for listing, statistics, and purging. A tRPC router serves data to a React admin page with DSFR tabs (table + ECharts graphs).

**Tech Stack:** Pino + pino-abstract-transport, Prisma 6, tRPC v11, React 19, DSFR tabs, ECharts 6, Awilix 12, Zod

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/server/infrastructure/pino-prisma-transport.ts` | Pino transport that persists logs to DB |
| `src/server/application-log/domain/ApplicationLogRepository.interface.ts` | Repository interface |
| `src/server/application-log/usecases/ListerLogsUseCase.ts` | Query: list logs with filters + pagination |
| `src/server/application-log/usecases/ObtenirStatistiquesLogsUseCase.ts` | Query: aggregated stats for charts |
| `src/server/application-log/usecases/PurgerLogsUseCase.ts` | Command: delete old logs with 7-day guard |
| `src/server/application-log/module.ts` | Awilix module definition |
| `src/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository.ts` | Prisma repository impl |
| `src/server/infrastructure/api/trpc/routes/applicationLog.ts` | tRPC router with 3 procedures |
| `src/pages/panel-administrateur/logs.tsx` | Next.js admin page |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs.tsx` | Main component with tabs |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/TableauLogs.tsx` | Tab 1: filterable log table |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/GraphesLogs.tsx` | Tab 2: ECharts graphs |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useTableauLogs.ts` | Hook for table state/filters |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useGraphesLogs.ts` | Hook for graphs data |
| `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/ModalePurge.tsx` | Purge confirmation modal |

### Modified files

| File | Change |
|------|--------|
| `src/database/prisma/schema.prisma` | Add `log_level` enum + `application_log` model |
| `src/server/infrastructure/Logger.ts` | Add multi-target transport config |
| `src/server/module-system/moduleNames.ts` | Add `"applicationLog"` |
| `src/server/dependances.ts` | Register `applicationLogModule` |
| `src/server/infrastructure/api/trpc/routes/routes.ts` | Add `applicationLog` router |
| `src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx` | Add "Logs applicatifs" menu item |
| `package.json` | Add `pino-abstract-transport` dependency |

---

## Task 1: Prisma schema - enum and model

**Files:**
- Modify: `src/database/prisma/schema.prisma` (append at end)

- [ ] **Step 1: Add `log_level` enum and `application_log` model to Prisma schema**

Append at the end of `src/database/prisma/schema.prisma`:

```prisma
enum log_level {
  INFO
  WARN
  ERROR
  DEBUG

  @@schema("public")
}

model application_log {
  id        String    @id @default(uuid())
  timestamp DateTime  @default(now())
  level     log_level
  categorie String
  message   String
  contexte  Json?
  source    String?
  duree_ms  Int?

  @@index([timestamp])
  @@index([categorie])
  @@index([level])
  @@index([categorie, timestamp])
  @@schema("public")
}
```

- [ ] **Step 2: Generate Prisma migration**

Run: `npx prisma migrate dev --name add-application-log`
Expected: Migration created successfully, Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add src/database/prisma/schema.prisma src/database/prisma/migrations/
git commit -m "feat: add application_log table and log_level enum to Prisma schema"
```

---

## Task 2: Install pino-abstract-transport

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependency**

Run: `npm install pino-abstract-transport`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pino-abstract-transport dependency"
```

---

## Task 3: Pino Prisma transport

**Files:**
- Create: `src/server/infrastructure/pino-prisma-transport.ts`

- [ ] **Step 1: Create the transport file**

```typescript
import build from "pino-abstract-transport";
import { PrismaClient } from "@prisma/client";

export default async function (opts: { databaseUrl?: string }) {
  const prisma = new PrismaClient({
    datasourceUrl: opts.databaseUrl,
  });

  return build(
    async function (source) {
      for await (const log of source) {
        const level = mapPinoLevelToEnum(log.level);
        if (!level) continue;

        try {
          await prisma.application_log.create({
            data: {
              level,
              categorie: log.categorie ?? "systeme",
              message: log.msg ?? "",
              contexte: extraireContexte(log),
              source: log.source ?? null,
              duree_ms: log.duree_ms ?? null,
            },
          });
        } catch {
          // silencieux — ne jamais crasher à cause du logging
        }
      }
    },
    {
      async close() {
        await prisma.$disconnect();
      },
    },
  );
}

function mapPinoLevelToEnum(pinoLevel: number): string | null {
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null;
}

function extraireContexte(
  log: Record<string, unknown>,
): Record<string, unknown> | null {
  const {
    level: _level,
    time: _time,
    pid: _pid,
    hostname: _hostname,
    msg: _msg,
    categorie: _categorie,
    source: _source,
    duree_ms: _dureeMs,
    ...contexte
  } = log;
  return Object.keys(contexte).length > 0 ? contexte : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/infrastructure/pino-prisma-transport.ts
git commit -m "feat: add Pino transport for persisting logs to PostgreSQL"
```

---

## Task 4: Modify Logger for multi-target transport

**Files:**
- Modify: `src/server/infrastructure/Logger.ts`

- [ ] **Step 1: Update AppLogger constructor with multi-target transport**

Replace the full content of `src/server/infrastructure/Logger.ts` with:

```typescript
import pino, { type Logger } from "pino";

class AppLogger implements Pick<Logger, "info" | "error" | "warn"> {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: "info",
      transport: {
        targets: [
          {
            target: "pino/file",
            options: { destination: 1 },
            level: "info",
          },
          {
            target: "./pino-prisma-transport",
            options: { databaseUrl: process.env.DATABASE_URL },
            level: "info",
          },
        ],
      },
    });
  }

  info(...obj: unknown[]) {
    this._logger.info(obj);
  }

  error(...obj: unknown[]) {
    this._logger.error(obj);
  }

  warn(...obj: unknown[]) {
    this._logger.warn(obj);
  }

  debug(...obj: unknown[]) {
    this._logger.debug(obj);
  }
}

const logger = new AppLogger();

export default logger;
```

- [ ] **Step 2: Commit**

```bash
git add src/server/infrastructure/Logger.ts
git commit -m "feat: configure Logger with multi-target Pino transport (stdout + DB)"
```

---

## Task 5: Repository interface

**Files:**
- Create: `src/server/application-log/domain/ApplicationLogRepository.interface.ts`

- [ ] **Step 1: Create repository interface**

```typescript
import { $Enums } from "@prisma/client";

export type ApplicationLogFiltre = {
  page: number;
  taillePage: number;
  filtreLevel?: $Enums.log_level;
  filtreCategorie?: string;
  filtreRecherche?: string;
  dateDebut?: Date;
  dateFin?: Date;
};

export type ApplicationLogEntree = {
  id: string;
  timestamp: Date;
  level: $Enums.log_level;
  categorie: string;
  message: string;
  contexte: unknown;
  source: string | null;
  duree_ms: number | null;
};

export type StatistiquesLogs = {
  parLevel: { level: $Enums.log_level; count: number }[];
  parCategorie: { categorie: string; count: number }[];
  timeline: { date: string; info: number; warn: number; error: number }[];
};

export type Granularite = "heure" | "jour" | "semaine";

export interface ApplicationLogRepository {
  lister(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }>;

  obtenirStatistiques(
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<StatistiquesLogs>;

  purger(anterieurA: Date): Promise<number>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/application-log/domain/ApplicationLogRepository.interface.ts
git commit -m "feat: add ApplicationLogRepository interface"
```

---

## Task 6: SQL Repository implementation

**Files:**
- Create: `src/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository.ts`

- [ ] **Step 1: Create SQL repository**

```typescript
import { Prisma } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  type ApplicationLogEntree,
  type ApplicationLogFiltre,
  type ApplicationLogRepository,
  type Granularite,
  type StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";

export class ApplicationLogSQLRepository implements ApplicationLogRepository {
  private readonly prisma;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma.getInstance();
  }

  async lister(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }> {
    const where: Prisma.application_logWhereInput = {};

    if (filtres.filtreLevel) {
      where.level = filtres.filtreLevel;
    }
    if (filtres.filtreCategorie) {
      where.categorie = filtres.filtreCategorie;
    }
    if (filtres.filtreRecherche) {
      where.message = { contains: filtres.filtreRecherche, mode: "insensitive" };
    }
    if (filtres.dateDebut || filtres.dateFin) {
      where.timestamp = {};
      if (filtres.dateDebut) {
        where.timestamp.gte = filtres.dateDebut;
      }
      if (filtres.dateFin) {
        where.timestamp.lte = filtres.dateFin;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.application_log.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (filtres.page - 1) * filtres.taillePage,
        take: filtres.taillePage,
      }),
      this.prisma.application_log.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        categorie: log.categorie,
        message: log.message,
        contexte: log.contexte,
        source: log.source,
        duree_ms: log.duree_ms,
      })),
      total,
    };
  }

  async obtenirStatistiques(
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<StatistiquesLogs> {
    const where: Prisma.application_logWhereInput = {
      timestamp: { gte: dateDebut, lte: dateFin },
    };

    const [parLevel, parCategorie, timelineRaw] = await Promise.all([
      this.prisma.application_log.groupBy({
        by: ["level"],
        where,
        _count: { _all: true },
      }),
      this.prisma.application_log.groupBy({
        by: ["categorie"],
        where,
        _count: { _all: true },
        orderBy: { _count: { categorie: "desc" } },
      }),
      this.construireTimeline(dateDebut, dateFin, granularite),
    ]);

    return {
      parLevel: parLevel.map((entry) => ({
        level: entry.level,
        count: entry._count._all,
      })),
      parCategorie: parCategorie.map((entry) => ({
        categorie: entry.categorie,
        count: entry._count._all,
      })),
      timeline: timelineRaw,
    };
  }

  async purger(anterieurA: Date): Promise<number> {
    const result = await this.prisma.application_log.deleteMany({
      where: { timestamp: { lt: anterieurA } },
    });
    return result.count;
  }

  private async construireTimeline(
    dateDebut: Date,
    dateFin: Date,
    granularite: Granularite,
  ): Promise<{ date: string; info: number; warn: number; error: number }[]> {
    const trunc = granularite === "heure" ? "hour" : granularite === "jour" ? "day" : "week";

    const result = await this.prisma.$queryRaw<
      { bucket: Date; level: string; count: bigint }[]
    >(
      Prisma.sql`
        SELECT date_trunc(${trunc}, timestamp) as bucket, level, count(*)::bigint as count
        FROM application_log
        WHERE timestamp >= ${dateDebut} AND timestamp <= ${dateFin}
        GROUP BY bucket, level
        ORDER BY bucket
      `,
    );

    const buckets = new Map<string, { info: number; warn: number; error: number }>();
    for (const row of result) {
      const key = row.bucket.toISOString();
      if (!buckets.has(key)) {
        buckets.set(key, { info: 0, warn: 0, error: 0 });
      }
      const entry = buckets.get(key)!;
      const level = row.level.toLowerCase();
      if (level === "info") entry.info = Number(row.count);
      else if (level === "warn") entry.warn = Number(row.count);
      else if (level === "error") entry.error = Number(row.count);
    }

    return [...buckets.entries()].map(([date, counts]) => ({ date, ...counts }));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository.ts
git commit -m "feat: add Prisma-based ApplicationLogSQLRepository"
```

---

## Task 7: Use cases

**Files:**
- Create: `src/server/application-log/usecases/ListerLogsUseCase.ts`
- Create: `src/server/application-log/usecases/ObtenirStatistiquesLogsUseCase.ts`
- Create: `src/server/application-log/usecases/PurgerLogsUseCase.ts`

- [ ] **Step 1: Create ListerLogsUseCase**

```typescript
import {
  type ApplicationLogFiltre,
  type ApplicationLogEntree,
  type ApplicationLogRepository,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";

export class ListerLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({ applicationLogRepository }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(
    filtres: ApplicationLogFiltre,
  ): Promise<{ logs: ApplicationLogEntree[]; total: number }> {
    return this.applicationLogRepository.lister(filtres);
  }
}
```

- [ ] **Step 2: Create ObtenirStatistiquesLogsUseCase**

```typescript
import {
  type ApplicationLogRepository,
  type Granularite,
  type StatistiquesLogs,
} from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";

export class ObtenirStatistiquesLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({ applicationLogRepository }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(input: {
    dateDebut: Date;
    dateFin: Date;
    granularite: Granularite;
  }): Promise<StatistiquesLogs> {
    return this.applicationLogRepository.obtenirStatistiques(
      input.dateDebut,
      input.dateFin,
      input.granularite,
    );
  }
}
```

- [ ] **Step 3: Create PurgerLogsUseCase**

```typescript
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository.interface";
import type { Inject } from "@/server/application-log/module";

const RETENTION_MINIMUM_JOURS = 7;

export class PurgerLogsUseCase {
  private readonly applicationLogRepository: ApplicationLogRepository;

  constructor({ applicationLogRepository }: Inject<"applicationLogRepository">) {
    this.applicationLogRepository = applicationLogRepository;
  }

  async execute(input: { anterieurA: Date }): Promise<{ nombreSupprime: number }> {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - RETENTION_MINIMUM_JOURS);

    if (input.anterieurA > dateLimite) {
      throw new Error(
        `Impossible de purger des logs de moins de ${RETENTION_MINIMUM_JOURS} jours`,
      );
    }

    const nombreSupprime = await this.applicationLogRepository.purger(
      input.anterieurA,
    );
    return { nombreSupprime };
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/server/application-log/usecases/
git commit -m "feat: add use cases for listing, statistics, and purging logs"
```

---

## Task 8: Awilix module + registration

**Files:**
- Create: `src/server/application-log/module.ts`
- Modify: `src/server/module-system/moduleNames.ts`
- Modify: `src/server/dependances.ts`

- [ ] **Step 1: Create the module definition**

```typescript
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { ApplicationLogRepository } from "@/server/application-log/domain/ApplicationLogRepository.interface";
import { ApplicationLogSQLRepository } from "@/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository";
import { ListerLogsUseCase } from "@/server/application-log/usecases/ListerLogsUseCase";
import { ObtenirStatistiquesLogsUseCase } from "@/server/application-log/usecases/ObtenirStatistiquesLogsUseCase";
import { PurgerLogsUseCase } from "@/server/application-log/usecases/PurgerLogsUseCase";

type ApplicationLogCradle = {
  applicationLogRepository: ApplicationLogRepository;
  listerLogsUseCase: ListerLogsUseCase;
  obtenirStatistiquesLogsUseCase: ObtenirStatistiquesLogsUseCase;
  purgerLogsUseCase: PurgerLogsUseCase;
};

export const applicationLogModule = defineModule<
  NoExports,
  ApplicationLogCradle
>()({
  name: "applicationLog",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      applicationLogRepository: asModuleClass(ApplicationLogSQLRepository),
      listerLogsUseCase: asModuleClass(ListerLogsUseCase),
      obtenirStatistiquesLogsUseCase: asModuleClass(ObtenirStatistiquesLogsUseCase),
      purgerLogsUseCase: asModuleClass(PurgerLogsUseCase),
    } satisfies VerifyCradle<ApplicationLogCradle>);
  },
});

type Scope = ExtractScope<typeof applicationLogModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

- [ ] **Step 2: Add module name to moduleNames.ts**

Add `"applicationLog"` to the `moduleNames` array in `src/server/module-system/moduleNames.ts`:

```typescript
export const moduleNames = [
  "shared",
  "authentification",
  // ... existing entries ...
  "legacy",
  "applicationLog",
] as const;
```

- [ ] **Step 3: Register module in dependances.ts**

In `src/server/dependances.ts`:

1. Add import:
```typescript
import { applicationLogModule } from "@/server/application-log/module";
```

2. Add to `allModules` array:
```typescript
const allModules = [
  // ... existing modules ...
  legacyModule,
  applicationLogModule,
];
```

3. Add to `registerContainer` return:
```typescript
applicationLog: getContainer("applicationLog"),
```

- [ ] **Step 4: Commit**

```bash
git add src/server/application-log/module.ts src/server/module-system/moduleNames.ts src/server/dependances.ts
git commit -m "feat: register applicationLog Awilix module"
```

---

## Task 9: tRPC router

**Files:**
- Create: `src/server/infrastructure/api/trpc/routes/applicationLog.ts`
- Modify: `src/server/infrastructure/api/trpc/routes/routes.ts`

- [ ] **Step 1: Create the applicationLog router**

```typescript
import { z } from "zod";
import {
  créerRouteurTRPC,
  procédureProtégée,
  vérifierSiLeCSRFEstValide,
} from "@/server/infrastructure/api/trpc/trpc";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { $Enums } from "@prisma/client";

const zodLogLevel = z.nativeEnum($Enums.log_level);
const zodGranularite = z.enum(["heure", "jour", "semaine"]);

export const applicationLogRouter = créerRouteurTRPC({
  lister: procédureProtégée
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        taillePage: z.number().int().min(1).max(100).default(50),
        filtreLevel: zodLogLevel.optional(),
        filtreCategorie: z.string().optional(),
        filtreRecherche: z.string().optional(),
        dateDebut: z.string().datetime().optional(),
        dateFin: z.string().datetime().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("listerLogsUseCase")
        .execute({
          page: input.page,
          taillePage: input.taillePage,
          filtreLevel: input.filtreLevel,
          filtreCategorie: input.filtreCategorie,
          filtreRecherche: input.filtreRecherche,
          dateDebut: input.dateDebut ? new Date(input.dateDebut) : undefined,
          dateFin: input.dateFin ? new Date(input.dateFin) : undefined,
        });
    }),

  statistiques: procédureProtégée
    .input(
      z.object({
        dateDebut: z.string().datetime(),
        dateFin: z.string().datetime(),
        granularite: zodGranularite,
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("obtenirStatistiquesLogsUseCase")
        .execute({
          dateDebut: new Date(input.dateDebut),
          dateFin: new Date(input.dateFin),
          granularite: input.granularite,
        });
    }),

  purger: procédureProtégée
    .input(
      z.object({
        csrf: z.string(),
        anterieurA: z.string().datetime(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      vérifierSiLeCSRFEstValide(ctx.csrfDuCookie, input.csrf);

      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }

      return getContainer("applicationLog")
        .resolve("purgerLogsUseCase")
        .execute({ anterieurA: new Date(input.anterieurA) });
    }),
});
```

- [ ] **Step 2: Register router in routes.ts**

In `src/server/infrastructure/api/trpc/routes/routes.ts`:

1. Add import:
```typescript
import { applicationLogRouter } from "./applicationLog";
```

2. Add to `appRouter`:
```typescript
applicationLog: applicationLogRouter,
```

- [ ] **Step 3: Commit**

```bash
git add src/server/infrastructure/api/trpc/routes/applicationLog.ts src/server/infrastructure/api/trpc/routes/routes.ts
git commit -m "feat: add applicationLog tRPC router with lister, statistiques, purger"
```

---

## Task 10: Admin page + menu entry

**Files:**
- Create: `src/pages/panel-administrateur/logs.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx`

- [ ] **Step 1: Create the Next.js page**

```typescript
import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { PagePanelAdministrateurLogs } from "@/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

const NextPagePanelAdministrateurLogs = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Logs applicatifs - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="logs">
        <PagePanelAdministrateurLogs />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurLogs;
```

- [ ] **Step 2: Add menu item in MenuLateralPanelAdministrateur.tsx**

Add the following entry to the `menuItems` array (before the closing `]`):

```typescript
{
  label: "Logs applicatifs",
  href: "/panel-administrateur/logs",
  pageKey: "logs",
},
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/panel-administrateur/logs.tsx src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx
git commit -m "feat: add logs admin page and menu entry"
```

---

## Task 11: Main component with DSFR tabs

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs.tsx`

- [ ] **Step 1: Create the main component with tabs**

```tsx
import { FunctionComponent, useState } from "react";
import { TableauLogs } from "./TableauLogs";
import { GraphesLogs } from "./GraphesLogs";

export const PagePanelAdministrateurLogs: FunctionComponent = () => {
  const [ongletActif, setOngletActif] = useState<"tableau" | "graphes">("tableau");

  return (
    <div className="fr-tabs">
      <ul
        className="fr-tabs__list"
        role="tablist"
      >
        <li role="presentation">
          <button
            aria-controls="panel-tableau"
            aria-selected={ongletActif === "tableau"}
            className={`fr-tabs__tab ${ongletActif === "tableau" ? "fr-tabs__tab--active" : ""}`}
            id="tab-tableau"
            onClick={() => setOngletActif("tableau")}
            role="tab"
            type="button"
          >
            Tableau des logs
          </button>
        </li>
        <li role="presentation">
          <button
            aria-controls="panel-graphes"
            aria-selected={ongletActif === "graphes"}
            className={`fr-tabs__tab ${ongletActif === "graphes" ? "fr-tabs__tab--active" : ""}`}
            id="tab-graphes"
            onClick={() => setOngletActif("graphes")}
            role="tab"
            type="button"
          >
            Graphes
          </button>
        </li>
      </ul>
      <div
        aria-labelledby="tab-tableau"
        className={`fr-tabs__panel ${ongletActif === "tableau" ? "fr-tabs__panel--selected" : ""}`}
        id="panel-tableau"
        role="tabpanel"
      >
        {ongletActif === "tableau" && <TableauLogs />}
      </div>
      <div
        aria-labelledby="tab-graphes"
        className={`fr-tabs__panel ${ongletActif === "graphes" ? "fr-tabs__panel--selected" : ""}`}
        id="panel-graphes"
        role="tabpanel"
      >
        {ongletActif === "graphes" && <GraphesLogs />}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs.tsx
git commit -m "feat: add main logs component with DSFR tabs"
```

---

## Task 12: Table hook (useTableauLogs)

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useTableauLogs.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useState, useCallback } from "react";
import { trpc } from "@/client/trpc";
import { $Enums } from "@prisma/client";

export function useTableauLogs() {
  const [page, setPage] = useState(1);
  const [filtreLevel, setFiltreLevel] = useState<$Enums.log_level | undefined>();
  const [filtreCategorie, setFiltreCategorie] = useState<string | undefined>();
  const [filtreRecherche, setFiltreRecherche] = useState<string | undefined>();
  const [dateDebut, setDateDebut] = useState<string | undefined>();
  const [dateFin, setDateFin] = useState<string | undefined>();
  const [logExpanduId, setLogExpanduId] = useState<string | null>(null);

  const taillePage = 50;

  const { data, isLoading } = trpc.applicationLog.lister.useQuery({
    page,
    taillePage,
    filtreLevel,
    filtreCategorie,
    filtreRecherche,
    dateDebut,
    dateFin,
  });

  const toggleExpansion = useCallback((id: string) => {
    setLogExpanduId((prev) => (prev === id ? null : id));
  }, []);

  const reinitialiserFiltres = useCallback(() => {
    setPage(1);
    setFiltreLevel(undefined);
    setFiltreCategorie(undefined);
    setFiltreRecherche(undefined);
    setDateDebut(undefined);
    setDateFin(undefined);
  }, []);

  const totalPages = data ? Math.ceil(data.total / taillePage) : 0;

  return {
    logs: data?.logs ?? [],
    total: data?.total ?? 0,
    isLoading,
    page,
    setPage,
    totalPages,
    filtreLevel,
    setFiltreLevel,
    filtreCategorie,
    setFiltreCategorie,
    filtreRecherche,
    setFiltreRecherche,
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    logExpanduId,
    toggleExpansion,
    reinitialiserFiltres,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useTableauLogs.ts
git commit -m "feat: add useTableauLogs hook with filters and pagination"
```

---

## Task 13: TableauLogs component

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/TableauLogs.tsx`

- [ ] **Step 1: Create the table component**

```tsx
import { FunctionComponent, useState } from "react";
import { $Enums } from "@prisma/client";
import { useTableauLogs } from "./useTableauLogs";
import { ModalePurge } from "./ModalePurge";

const CATEGORIES = [
  "auth", "import", "pva", "rapport", "api", "indicateur", "utilisateur", "systeme",
];

const BADGE_CLASSES: Record<$Enums.log_level, string> = {
  ERROR: "fr-badge fr-badge--error fr-badge--no-icon fr-badge--sm",
  WARN: "fr-badge fr-badge--warning fr-badge--no-icon fr-badge--sm",
  INFO: "fr-badge fr-badge--info fr-badge--no-icon fr-badge--sm",
  DEBUG: "fr-badge fr-badge--new fr-badge--no-icon fr-badge--sm",
};

function formaterDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const TableauLogs: FunctionComponent = () => {
  const {
    logs,
    total,
    isLoading,
    page,
    setPage,
    totalPages,
    filtreLevel,
    setFiltreLevel,
    filtreCategorie,
    setFiltreCategorie,
    filtreRecherche,
    setFiltreRecherche,
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    logExpanduId,
    toggleExpansion,
  } = useTableauLogs();

  const [modalePurgeOuverte, setModalePurgeOuverte] = useState(false);

  return (
    <div>
      {/* Filtres */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-level"
          >
            Niveau
          </label>
          <select
            className="fr-select"
            id="filtre-level"
            onChange={(event) =>
              setFiltreLevel(
                (event.target.value as $Enums.log_level) || undefined,
              )
            }
            value={filtreLevel ?? ""}
          >
            <option value="">Tous</option>
            {Object.values($Enums.log_level).map((level) => (
              <option
                key={level}
                value={level}
              >
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-categorie"
          >
            Catégorie
          </label>
          <select
            className="fr-select"
            id="filtre-categorie"
            onChange={(event) =>
              setFiltreCategorie(event.target.value || undefined)
            }
            value={filtreCategorie ?? ""}
          >
            <option value="">Toutes</option>
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-date-debut"
          >
            Date début
          </label>
          <input
            className="fr-input"
            id="filtre-date-debut"
            onChange={(event) =>
              setDateDebut(
                event.target.value
                  ? new Date(event.target.value).toISOString()
                  : undefined,
              )
            }
            type="date"
            value={dateDebut ? dateDebut.slice(0, 10) : ""}
          />
        </div>
        <div className="fr-col-3">
          <label
            className="fr-label"
            htmlFor="filtre-recherche"
          >
            Recherche
          </label>
          <input
            className="fr-input"
            id="filtre-recherche"
            onChange={(event) =>
              setFiltreRecherche(event.target.value || undefined)
            }
            placeholder="Rechercher dans les messages..."
            type="text"
            value={filtreRecherche ?? ""}
          />
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Niveau</th>
                  <th>Catégorie</th>
                  <th>Message</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr key={log.id}>
                      <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {formaterDate(log.timestamp)}
                      </td>
                      <td>
                        <span className={BADGE_CLASSES[log.level]}>{log.level}</span>
                      </td>
                      <td>{log.categorie}</td>
                      <td
                        style={{
                          maxWidth: "400px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.message}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85em" }}>
                        {log.source}
                      </td>
                      <td>
                        {log.contexte && (
                          <button
                            className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
                            onClick={() => toggleExpansion(log.id)}
                            type="button"
                          >
                            {logExpanduId === log.id ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {logExpanduId === log.id && log.contexte && (
                      <tr key={`${log.id}-ctx`}>
                        <td
                          colSpan={6}
                          style={{ background: "#1e1e2e", padding: "1rem" }}
                        >
                          <pre
                            style={{
                              color: "#cdd6f4",
                              fontFamily: "monospace",
                              fontSize: "0.85em",
                              margin: 0,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {JSON.stringify(log.contexte, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="fr-grid-row fr-grid-row--middle fr-mt-2w">
            <div className="fr-col">
              <p className="fr-text--sm fr-mb-0">
                {total} logs — Page {page} / {totalPages}
              </p>
            </div>
            <div className="fr-col-auto">
              <nav
                aria-label="Pagination"
                className="fr-pagination"
                role="navigation"
              >
                <ul className="fr-pagination__list">
                  <li>
                    <button
                      className="fr-pagination__link fr-pagination__link--prev"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      type="button"
                    >
                      Précédent
                    </button>
                  </li>
                  <li>
                    <button
                      className="fr-pagination__link fr-pagination__link--next"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      type="button"
                    >
                      Suivant
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="fr-col-auto">
              <button
                className="fr-btn fr-btn--secondary"
                onClick={() => setModalePurgeOuverte(true)}
                type="button"
              >
                Purger les logs
              </button>
            </div>
          </div>
        </>
      )}

      {modalePurgeOuverte && (
        <ModalePurge onFermer={() => setModalePurgeOuverte(false)} />
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/TableauLogs.tsx
git commit -m "feat: add filterable log table with pagination and expandable rows"
```

---

## Task 14: Purge modal

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/ModalePurge.tsx`

- [ ] **Step 1: Create the purge modal**

```tsx
import { FunctionComponent, useState } from "react";
import { trpc } from "@/client/trpc";

type ModalePurgeProps = {
  onFermer: () => void;
};

export const ModalePurge: FunctionComponent<ModalePurgeProps> = ({ onFermer }) => {
  const [dateStr, setDateStr] = useState("");
  const utils = trpc.useUtils();

  const mutation = trpc.applicationLog.purger.useMutation({
    onSuccess: () => {
      utils.applicationLog.lister.invalidate();
      onFermer();
    },
  });

  const handlePurger = () => {
    if (!dateStr) return;
    mutation.mutate({
      csrf: document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1] ?? "",
      anterieurA: new Date(dateStr).toISOString(),
    });
  };

  return (
    <dialog
      aria-labelledby="modale-purge-titre"
      className="fr-modal fr-modal--opened"
      open
      role="dialog"
    >
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  aria-controls="modale-purge"
                  className="fr-btn--close fr-btn"
                  onClick={onFermer}
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1
                  className="fr-modal__title"
                  id="modale-purge-titre"
                >
                  Purger les logs
                </h1>
                <p>
                  Supprimer tous les logs antérieurs à la date sélectionnée.
                  Minimum 7 jours de rétention.
                </p>
                <div className="fr-input-group">
                  <label
                    className="fr-label"
                    htmlFor="date-purge"
                  >
                    Supprimer les logs antérieurs au
                  </label>
                  <input
                    className="fr-input"
                    id="date-purge"
                    onChange={(event) => setDateStr(event.target.value)}
                    type="date"
                    value={dateStr}
                  />
                </div>
                {mutation.error && (
                  <p className="fr-error-text">{mutation.error.message}</p>
                )}
                {mutation.isSuccess && (
                  <p className="fr-valid-text">
                    {mutation.data.nombreSupprime} logs supprimés.
                  </p>
                )}
              </div>
              <div className="fr-modal__footer">
                <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                  <button
                    className="fr-btn fr-btn--secondary"
                    onClick={onFermer}
                    type="button"
                  >
                    Annuler
                  </button>
                  <button
                    className="fr-btn"
                    disabled={!dateStr || mutation.isPending}
                    onClick={handlePurger}
                    type="button"
                  >
                    {mutation.isPending ? "Suppression..." : "Confirmer la purge"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/ModalePurge.tsx
git commit -m "feat: add purge confirmation modal"
```

---

## Task 15: Graphs hook (useGraphesLogs)

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useGraphesLogs.ts`

- [ ] **Step 1: Create the graphs hook**

```typescript
import { useState, useMemo } from "react";
import { trpc } from "@/client/trpc";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

type Periode = "7j" | "30j";

function calculerDateDebut(periode: Periode): Date {
  const date = new Date();
  date.setDate(date.getDate() - (periode === "7j" ? 7 : 30));
  return date;
}

export function useGraphesLogs() {
  const [periode, setPeriode] = useState<Periode>("7j");
  const [granularite, setGranularite] = useState<Granularite>("jour");

  const dateDebut = useMemo(() => calculerDateDebut(periode), [periode]);
  const dateFin = useMemo(() => new Date(), []);

  const { data, isLoading } = trpc.applicationLog.statistiques.useQuery({
    dateDebut: dateDebut.toISOString(),
    dateFin: dateFin.toISOString(),
    granularite,
  });

  return {
    statistiques: data,
    isLoading,
    periode,
    setPeriode,
    granularite,
    setGranularite,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/useGraphesLogs.ts
git commit -m "feat: add useGraphesLogs hook"
```

---

## Task 16: GraphesLogs component with ECharts

**Files:**
- Create: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/GraphesLogs.tsx`

- [ ] **Step 1: Create the graphs component**

```tsx
import { FunctionComponent, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useGraphesLogs } from "./useGraphesLogs";
import type { Granularite } from "@/server/application-log/domain/ApplicationLogRepository.interface";

const COULEURS = {
  error: "#e3342f",
  warn: "#f6993f",
  info: "#3490dc",
};

export const GraphesLogs: FunctionComponent = () => {
  const { statistiques, isLoading, periode, setPeriode, granularite, setGranularite } =
    useGraphesLogs();

  const timelineRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statistiques || !timelineRef.current) return;

    const chart = echarts.init(timelineRef.current);
    const dates = statistiques.timeline.map((entry) =>
      new Date(entry.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    );

    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["ERROR", "WARN", "INFO"] },
      xAxis: { type: "category", data: dates },
      yAxis: { type: "value" },
      series: [
        { name: "ERROR", type: "bar", stack: "total", data: statistiques.timeline.map((entry) => entry.error), color: COULEURS.error },
        { name: "WARN", type: "bar", stack: "total", data: statistiques.timeline.map((entry) => entry.warn), color: COULEURS.warn },
        { name: "INFO", type: "bar", stack: "total", data: statistiques.timeline.map((entry) => entry.info), color: COULEURS.info },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  useEffect(() => {
    if (!statistiques || !donutRef.current) return;

    const chart = echarts.init(donutRef.current);
    chart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: statistiques.parLevel.map((entry) => ({
            name: entry.level,
            value: entry.count,
            itemStyle: { color: COULEURS[entry.level.toLowerCase() as keyof typeof COULEURS] ?? "#888" },
          })),
          label: { formatter: "{b}: {d}%" },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  useEffect(() => {
    if (!statistiques || !barRef.current) return;

    const chart = echarts.init(barRef.current);
    const sorted = [...statistiques.parCategorie].sort((a, b) => a.count - b.count);

    chart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: { type: "value" },
      yAxis: { type: "category", data: sorted.map((entry) => entry.categorie) },
      series: [
        {
          type: "bar",
          data: sorted.map((entry) => entry.count),
          color: COULEURS.info,
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [statistiques]);

  if (isLoading) return <p>Chargement...</p>;

  return (
    <div>
      {/* Filtres */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-auto">
          <label
            className="fr-label"
            htmlFor="periode-graphes"
          >
            Période
          </label>
          <select
            className="fr-select"
            id="periode-graphes"
            onChange={(event) => setPeriode(event.target.value as "7j" | "30j")}
            value={periode}
          >
            <option value="7j">7 jours</option>
            <option value="30j">30 jours</option>
          </select>
        </div>
        <div className="fr-col-auto">
          <label
            className="fr-label"
            htmlFor="granularite-graphes"
          >
            Granularité
          </label>
          <select
            className="fr-select"
            id="granularite-graphes"
            onChange={(event) => setGranularite(event.target.value as Granularite)}
            value={granularite}
          >
            <option value="heure">Heure</option>
            <option value="jour">Jour</option>
            <option value="semaine">Semaine</option>
          </select>
        </div>
      </div>

      {/* Timeline stacked bar */}
      <h3 className="fr-h6">Timeline des logs par niveau</h3>
      <div
        ref={timelineRef}
        style={{ width: "100%", height: "360px" }}
      />

      {/* Donut + Bar horizontal */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
        <div className="fr-col-6">
          <h3 className="fr-h6">Répartition par niveau</h3>
          <div
            ref={donutRef}
            style={{ width: "100%", height: "300px" }}
          />
        </div>
        <div className="fr-col-6">
          <h3 className="fr-h6">Répartition par catégorie</h3>
          <div
            ref={barRef}
            style={{ width: "100%", height: "300px" }}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/GraphesLogs.tsx
git commit -m "feat: add ECharts graphs for log statistics (timeline, donut, bar)"
```

---

## Task 17: Verify build and lint

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No new errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix: resolve lint/build issues for logs feature"
```
