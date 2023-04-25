import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { ExportCsvUseCase } from '@/server/usecase/export/ExportCsvUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';

const NON_APPLICABLE = 'N/A';
const OUI = 'Oui';
const NON = 'Non';

const COLONNES = [
  'Id',
  'Maille',
  'Région',
  'Département',
  'Chantier du baromètre',
  'Chantier territorialisé',
  'Taux d\'avancement national',
  'Taux d\'avancement régional',
  'Taux d\'avancement départemental',
  'Météo',
];

/**
 Ministère <-- on a la desc dans les lignes chantier normalement
 Chantier
 Taux d’avancement départemental
 Taux d’avancement région
 Taux d’avancement national
 Méthodologie du calcul du taux d’avancement <-- c'est ou ?
 Synthèse des résultats
 Objectifs
 Freins à lever <-- typologie de commentaire
 Actions à venir <-- typologie de commentaire
 Actions à valoriser <-- ??
 Autres résultats obtenus <-- ??
 Plus deux autres types ? pas pour le 5 mai.
 */

function asCsvRow(chantierPourExport: ChantierPourExport): string[] {
  return [
    chantierPourExport.chantierId,
    chantierPourExport.maille,
    chantierPourExport.codeRégion || NON_APPLICABLE,
    chantierPourExport.codeDépartement || NON_APPLICABLE,
    chantierPourExport.estBaromètre ? OUI : NON,
    chantierPourExport.estTerritorialisé ? OUI : NON,
    chantierPourExport.tauxDAvancementNational?.toString() || NON_APPLICABLE,
    chantierPourExport.tauxDAvancementRégional?.toString() || NON_APPLICABLE,
    chantierPourExport.tauxDAvancementDépartemental?.toString() || NON_APPLICABLE,
    chantierPourExport.météo,
  ];
}

export default async function handleExportCsv(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvUseCase = new ExportCsvUseCase();
  const chantiersPourExport = await exportCsvUseCase.run(session.habilitation);

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="chantiers.csv"');

  const stringifier = stringify({ header: true, columns: COLONNES });
  stringifier.pipe(response);
  for (const chantierPourExport of chantiersPourExport) {
    const csvRow = asCsvRow(chantierPourExport);
    stringifier.write(csvRow);
  }
  stringifier.end();
}
