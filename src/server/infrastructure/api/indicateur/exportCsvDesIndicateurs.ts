import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { IndicateurPourExport } from '@/server/domain/indicateur/IndicateurPourExport';
import ExportCsvDesIndicateursUseCase from '@/server/usecase/indicateur/ExportCsvDesIndicateursUseCase';

const NON_APPLICABLE = 'N/A';
const OUI = 'Oui';
const NON = 'Non';

const COLONNES = [
  'Maille',
  'Région',
  'Département',
  'Ministère',
  'Chantier',
  'Chantier du baromètre',
  'Taux d\'avancement (chantier)',
  'Météo',
  'Valeur initiale',
  'Date valeur initiale',
  'Valeur actuelle',
  'Date valeur actuelle',
  'Valeur cible',
  'Taux d\'avancement (indicateur)',
];

function asCsvRow(indicateurPourExport: IndicateurPourExport): string[] {
  return [
    indicateurPourExport.maille,
    indicateurPourExport.codeRégion || NON_APPLICABLE,
    indicateurPourExport.codeDépartement || NON_APPLICABLE,
    indicateurPourExport.chantierMinistèreNom,
    indicateurPourExport.chantierNom,
    indicateurPourExport.chantierEstBaromètre ? OUI : NON,
    indicateurPourExport.chantierAvancementGlobal?.toString() || NON_APPLICABLE,
    indicateurPourExport.météo,
    indicateurPourExport.nom,
    indicateurPourExport.valeurInitiale?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurInitiale || NON_APPLICABLE,
    indicateurPourExport.valeurActuelle?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurActuelle,
    indicateurPourExport.valeurCible?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurCible || NON_APPLICABLE,
    indicateurPourExport.avancementGlobal?.toString() || NON_APPLICABLE,
  ];
}

export default async function handleExportCsvDesIndicateurs(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesIndicateursUseCase = new ExportCsvDesIndicateursUseCase();
  const indicateursPourExport = await exportCsvDesIndicateursUseCase.run(session.habilitations);

  const now = new Date();
  const horodatage = now.toISOString().replaceAll(/[:T]/g, '-').replace(/\..*/, '');
  const csvFilename = `PILOTE-Indicateurs-sans-filtre-${horodatage}.csv`;

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);

  const stringifier = stringify({
    header: true,
    columns: COLONNES,
    delimiter: ';',
    bom: true,
  });

  stringifier.pipe(response);
  for (const indicateurPourExport of indicateursPourExport) {
    const csvRow = asCsvRow(indicateurPourExport);
    stringifier.write(csvRow);
  }
  stringifier.end();
}
