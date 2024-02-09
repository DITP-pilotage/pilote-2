import { NextApiRequest, NextApiResponse } from 'next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/sync';
import RécupérerListeMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerListeMetadataIndicateurUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';

const EXPORT_METADATA_INDICATEURS_COLUMN = [
  'indic_id',
  'indic_parent_indic',
  'indic_parent_ch',
  'indic_nom',
  'indic_nom_baro',
  'indic_descr',
  'indic_descr_baro',
  'indic_is_perseverant',
  'indic_is_phare',
  'indic_is_baro',
  'indic_type',
  'indic_source',
  'indic_source_url',
  'indic_methode_calcul',
  'indic_unite',
  'indic_hidden_pilote',
  'indic_schema',
  'vi_dept_from',
  'vi_dept_op',
  'va_dept_from',
  'va_dept_op',
  'vc_dept_from',
  'vc_dept_op',
  'vi_reg_from',
  'vi_reg_op',
  'va_reg_from',
  'va_reg_op',
  'vc_reg_from',
  'vc_reg_op',
  'vi_nat_from',
  'vi_nat_op',
  'va_nat_from',
  'va_nat_op',
  'vc_nat_from',
  'vc_nat_op',
  'param_vaca_decumul_from',
  'param_vaca_partition_date',
  'param_vaca_op',
  'param_vacg_decumul_from',
  'param_vacg_partition_date',
  'param_vacg_op',
  'poids_pourcent_dept',
  'poids_pourcent_reg',
  'poids_pourcent_nat',
  'tendance',
  'reforme_prioritaire',
  'projet_annuel_perf',
  'detail_projet_annuel_perf',
  'periodicite',
  'delai_disponibilite',
  'indic_territorialise',
  'frequence_territoriale',
  'mailles',
  'admin_source',
  'methode_collecte',
  'si_source',
  'donnee_ouverte',
  'modalites_donnee_ouverte',
  'resp_donnees',
  'resp_donnees_email',
  'contact_technique',
  'contact_technique_email',
  'commentaire',
];

export async function handleExportMetadataIndicateurs(request: NextApiRequest, response: NextApiResponse) {
  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: EXPORT_METADATA_INDICATEURS_COLUMN,
    delimiter: ';',
    bom: true,
  } satisfies Options);
  stringifier.pipe(response);

  const listeMetadataIndicateur = await new RécupérerListeMetadataIndicateurUseCase(dependencies.getMetadataParametrageIndicateurRepository()).run((request.query?.chantierIds as string[]) || []);
  listeMetadataIndicateur.forEach((metadataIndicateur) => {
    stringifier.write([
      metadataIndicateur.indicId,
      metadataIndicateur.indicParentIndic,
      metadataIndicateur.indicParentCh,
      metadataIndicateur.indicNom,
      metadataIndicateur.indicNomBaro,
      metadataIndicateur.indicDescr,
      metadataIndicateur.indicDescrBaro,
      metadataIndicateur.indicIsPerseverant ? 'true' : 'false',
      metadataIndicateur.indicIsPhare ? 'true' : 'false',
      metadataIndicateur.indicIsBaro ? 'true' : 'false',
      metadataIndicateur.indicType,
      metadataIndicateur.indicSource,
      metadataIndicateur.indicSourceUrl,
      metadataIndicateur.indicMethodeCalcul,
      metadataIndicateur.indicUnite,
      metadataIndicateur.indicHiddenPilote,
      metadataIndicateur.indicSchema,
      metadataIndicateur.viDeptFrom,
      metadataIndicateur.viDeptOp,
      metadataIndicateur.vaDeptFrom,
      metadataIndicateur.vaDeptOp,
      metadataIndicateur.vcDeptFrom,
      metadataIndicateur.vcDeptOp,
      metadataIndicateur.viRegFrom,
      metadataIndicateur.viRegOp,
      metadataIndicateur.vaRegFrom,
      metadataIndicateur.vaRegOp,
      metadataIndicateur.vcRegFrom,
      metadataIndicateur.vcRegOp,
      metadataIndicateur.viNatFrom,
      metadataIndicateur.viNatOp,
      metadataIndicateur.vaNatFrom,
      metadataIndicateur.vaNatOp,
      metadataIndicateur.vcNatFrom,
      metadataIndicateur.vcNatOp,
      metadataIndicateur.paramVacaDecumulFrom,
      metadataIndicateur.paramVacaPartitionDate,
      metadataIndicateur.paramVacaOp,
      metadataIndicateur.paramVacgDecumulFrom,
      metadataIndicateur.paramVacgPartitionDate,
      metadataIndicateur.paramVacgOp,
      metadataIndicateur.poidsPourcentDept,
      metadataIndicateur.poidsPourcentReg,
      metadataIndicateur.poidsPourcentNat,
      metadataIndicateur.tendance,
      metadataIndicateur.reformePrioritaire,
      metadataIndicateur.projetAnnuelPerf ? 'true' : 'false',
      metadataIndicateur.detailProjetAnnuelPerf,
      metadataIndicateur.periodicite,
      metadataIndicateur.delaiDisponibilite,
      metadataIndicateur.indicTerritorialise ? 'true' : 'false',
      metadataIndicateur.frequenceTerritoriale,
      metadataIndicateur.mailles,
      metadataIndicateur.adminSource,
      metadataIndicateur.methodeCollecte,
      metadataIndicateur.siSource,
      metadataIndicateur.donneeOuverte ? 'true' : 'false',
      metadataIndicateur.modalitesDonneeOuverte,
      metadataIndicateur.respDonnees,
      metadataIndicateur.respDonneesEmail,
      metadataIndicateur.contactTechnique,
      metadataIndicateur.contactTechniqueEmail,
      metadataIndicateur.commentaire,
    ]);
  });

  stringifier.end();
}
