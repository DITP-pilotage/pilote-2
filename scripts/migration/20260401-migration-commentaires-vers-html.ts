import { loadEnvConfig } from "@next/env";
import process from "node:process";
import logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";
import { SanitizerHTML } from "@/server/app/domain/SanitizerHTML";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

function convertirPlainTextVersHtml(plainText: string): string {
  const escaped = plainText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const html = escaped
    .split(/\n\n/)
    .map((paragraphe) => `<p>${paragraphe.replaceAll("\n", "<br>")}</p>`)
    .join("");

  return SanitizerHTML.sanitize(html);
}

const BATCH_SIZE = 500;

async function migrerTable<T extends { id: string }>(
  params: {
    nomTable: string,
    findMany: (skip: number, take: number) => Promise<T[]>,
    update: (id: string, html: string) => Promise<void>,
    getContenu: (ligne: T) => string | null,
  }
): Promise<void> {
  let skip = 0;
  let traites = 0;
  let erreurs = 0;

  while (true) {
    const lignes = await params.findMany(skip, BATCH_SIZE);
    if (lignes.length === 0) break;

    for (const ligne of lignes) {
      const contenuOriginal = params.getContenu(ligne);
      if (contenuOriginal === null) continue;

      try {
        await params.update(ligne.id, convertirPlainTextVersHtml(contenuOriginal));
        traites++;
      } catch (error) {
        logger.error(`[${params.nomTable}] Erreur sur id=${ligne.id}`, error);
        erreurs++;
      }
    }

    skip += lignes.length;
    logger.info(`[${params.nomTable}] Batch traité`, { skip, traites, erreurs });

    if (lignes.length < BATCH_SIZE) break;
  }

  logger.info(`[${params.nomTable}] Migration terminée`, { traites, erreurs });
}

async function main() {
  await migrerTable(
    {
      nomTable: "commentaire",
      findMany: (skip, take) =>
        prisma.commentaire.findMany({
          select: { id: true, contenu: true },
          skip,
          take,
        }),
      update: (id, html) => prisma.commentaire.update({ where: { id }, data: { contenu: html } }).then(),
      getContenu: (ligne) => ligne.contenu
    },
  );

  await migrerTable(
    {
      nomTable: "decision_strategique",
      findMany: (skip, take) =>
        prisma.decision_strategique.findMany({
          select: { id: true, contenu: true },
          skip,
          take,
        }),
      update: (id, html) =>
        prisma.decision_strategique.update({ where: { id }, data: { contenu: html } }).then(),
      getContenu: (ligne) => ligne.contenu
    },
  );

  await migrerTable(
    {
      nomTable: "objectif",
      findMany: (skip, take) =>
        prisma.objectif.findMany({
          select: { id: true, contenu: true },
          skip,
          take,
        }),
      update: (id, html) => prisma.objectif.update({ where: { id }, data: { contenu: html } }).then(),
      getContenu: (ligne) => ligne.contenu,
    }
  );

  await migrerTable(
    {
      nomTable: "synthese_des_resultats",
      findMany: (skip, take) =>
        prisma.synthese_des_resultats.findMany({
          where: { commentaire: { not: null } },
          select: { id: true, commentaire: true },
          skip,
          take,
        }),
      update: (id, html) =>
        prisma.synthese_des_resultats.update({ where: { id }, data: { commentaire: html } }).then(),
      getContenu: (ligne) => ligne.commentaire,
    }
  );
}

main()
  .then(() => {
    logger.info("Script de migration commentaires → HTML exécuté avec succès");
  })
  .catch((error) => {
    logger.error("Échec du script de migration :", error);
    throw error;
  });
