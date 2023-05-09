import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersSansFiltreUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import { NON, NON_APPLICABLE, OUI } from '@/server/constants/csv';

const COLONNES = [
  'Maille',
  'Région',
  'Département',
  'Ministère',
  'Chantier',
  'Chantier du baromètre',
  'Chantier territorialisé',
  'Taux d\'avancement départemental',
  'Taux d\'avancement régional',
  'Taux d\'avancement national',
  'Météo',
  'Synthèse des résultats',
  'Notre ambition',
  'Déjà fait',
  'À faire',
  'Suivi des décisions',
  'Actions à venir',
  'Actions à valoriser',
  'Freins à lever',
  'Commentaires sur les données',
  'Autres résultats',
  'Autres résultats (non corrélés aux indicateurs)',
];

/**
 Méthodologie du calcul du taux d’avancement <-- c'est ou ?
 Plus deux autres types ? pas pour le 5 mai.
 */

// eslint-disable-next-line sonarjs/cognitive-complexity
function asCsvRow(chantierPourExport: ChantierPourExport): string[] {
  return [
    chantierPourExport.maille,
    chantierPourExport.codeRégion || NON_APPLICABLE,
    chantierPourExport.codeDépartement || NON_APPLICABLE,
    chantierPourExport.ministère || NON_APPLICABLE,
    chantierPourExport.nom || NON_APPLICABLE,
    chantierPourExport.estBaromètre ? OUI : NON,
    chantierPourExport.estTerritorialisé ? OUI : NON,
    chantierPourExport.tauxDAvancementDépartemental?.toString() || NON_APPLICABLE,
    chantierPourExport.tauxDAvancementRégional?.toString() || NON_APPLICABLE,
    chantierPourExport.tauxDAvancementNational?.toString() || NON_APPLICABLE,
    chantierPourExport.météo || NON_APPLICABLE,
    chantierPourExport.synthèseDesRésultats || NON_APPLICABLE,
    chantierPourExport.objNotreAmbition || NON_APPLICABLE,
    chantierPourExport.objDéjàFait || NON_APPLICABLE,
    chantierPourExport.objÀFaire || NON_APPLICABLE,
    chantierPourExport.decStratSuiviDesDécisions || NON_APPLICABLE,
    chantierPourExport.commActionsÀVenir || NON_APPLICABLE,
    chantierPourExport.commActionsÀValoriser || NON_APPLICABLE,
    chantierPourExport.commFreinsÀLever || NON_APPLICABLE,
    chantierPourExport.commCommentairesSurLesDonnées || NON_APPLICABLE,
    chantierPourExport.commAutresRésultats || NON_APPLICABLE,
    chantierPourExport.commAutresRésultatsNonCorrélésAuxIndicateurs || NON_APPLICABLE,
  ];
}

export default async function handleExportDesChantiersSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersSansFiltreUseCase();
  const chantiersPourExport = await exportCsvDesChantiersSansFiltreUseCase.run(session.habilitations);

  const now = new Date();
  const horodatage = now.getFullYear() + '-'
    + now.getMonth().toString().padStart(2, '0') + '-'
    + now.getDay().toString().padStart(2, '0') + '-'
    + now.getHours().toString().padStart(2, '0') + '-'
    + now.getMinutes().toString().padStart(2, '0') + '-'
    + now.getSeconds().toString().padStart(2, '0');

  const csvFilename = `PILOTE-Chantiers-sans-filtre-${horodatage}.csv`;

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);

  const stringifier = stringify({
    header: true,
    columns: COLONNES,
    delimiter: ';',
    bom: true,
  });

  stringifier.pipe(response);
  for (const chantierPourExport of chantiersPourExport) {
    const csvRow = asCsvRow(chantierPourExport);
    stringifier.write(csvRow);
  }
  stringifier.end();
}
