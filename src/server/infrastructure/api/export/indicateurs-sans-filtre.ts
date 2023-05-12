import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { IndicateurPourExport } from '@/server/domain/indicateur/IndicateurPourExport';
import ExportCsvDesIndicateursSansFiltreUseCase from '@/server/usecase/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import { formaterMétéo, horodatage, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';

const COLONNES = [
  'Maille',
  'Région',
  'Département',
  'Ministère',
  'Chantier',
  'Chantier du baromètre',
  'Taux d\'avancement (chantier)',
  'Météo',
  'Indicateur',
  'Valeur initiale',
  'Date valeur initiale',
  'Valeur actuelle',
  'Date valeur actuelle',
  'Valeur cible',
  'Date valeur cible',
  'Taux d\'avancement (indicateur)',
];

function asCsvRow(indicateurPourExport: IndicateurPourExport): string[] {
  return [
    indicateurPourExport.maille || NON_APPLICABLE,
    indicateurPourExport.régionNom || NON_APPLICABLE,
    indicateurPourExport.départementNom || NON_APPLICABLE,
    indicateurPourExport.chantierMinistèreNom || NON_APPLICABLE,
    indicateurPourExport.chantierNom || NON_APPLICABLE,
    indicateurPourExport.chantierEstBaromètre ? OUI : NON,
    indicateurPourExport.chantierAvancementGlobal?.toString() || NON_APPLICABLE,
    formaterMétéo(indicateurPourExport.météo),
    indicateurPourExport.nom || NON_APPLICABLE,
    indicateurPourExport.valeurInitiale?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurInitiale || NON_APPLICABLE,
    indicateurPourExport.valeurActuelle?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurActuelle || NON_APPLICABLE,
    indicateurPourExport.valeurCible?.toString() || NON_APPLICABLE,
    indicateurPourExport.dateValeurCible || NON_APPLICABLE,
    indicateurPourExport.avancementGlobal?.toString() || NON_APPLICABLE,
  ];
}

export default async function handleExportDesIndicateursSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase();
  const indicateursPourExport = await exportCsvDesIndicateursSansFiltreUseCase.run(session.habilitations);

  const csvFilename = `PILOTE-Indicateurs-sans-filtre-${horodatage()}.csv`;

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
