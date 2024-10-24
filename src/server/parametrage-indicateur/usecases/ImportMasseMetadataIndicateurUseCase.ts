import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { ImportMetadataIndicateur } from '@/server/parametrage-indicateur/domain/ImportMetadataIndicateur';
import logger from '@/server/infrastructure/Logger';
import { supprimerLeFichier } from '@/server/import-indicateur/infrastructure/adapters/FichierService';
import {
  validationImportMetadataIndicateurFormulaire,
  validationMetadataIndicateurContexte,
} from '@/validation/metadataIndicateur';

type RecordCSVImport = Record<typeof AvailableHeaderCSVImport[number], string>;

const convertirEnImportMetadataIndicateur = (record: RecordCSVImport): ImportMetadataIndicateur => ({
  indicId: record.indic_id,
  indicParentIndic: record.indic_parent_indic || null,
  indicParentCh: record.indic_parent_ch,
  indicNom: record.indic_nom,
  indicNomBaro: record.indic_nom_baro || null,
  indicDescr: record.indic_descr,
  indicDescrBaro: record.indic_descr_baro || null,
  indicIsPerseverant: record.indic_is_perseverant === 'true' || record.indic_is_perseverant === 'True',
  indicIsPhare: record.indic_is_phare === 'true' || record.indic_is_phare === 'True',
  indicIsBaro: record.indic_is_baro === 'true' || record.indic_is_baro === 'True',
  indicType: record.indic_type,
  indicSource: record.indic_source,
  indicSourceUrl: record.indic_source_url || null,
  indicMethodeCalcul: record.indic_methode_calcul,
  indicUnite: record.indic_unite || null,
  indicHiddenPilote: record.indic_hidden_pilote === 'true' || record.indic_hidden_pilote === 'True',
  indicSchema: record.indic_schema,
  zgApplicable: record.zg_applicable || null,
  viDeptFrom: record.vi_dept_from,
  viDeptOp: record.vi_dept_op,
  vaDeptFrom: record.va_dept_from,
  vaDeptOp: record.va_dept_op,
  vcDeptFrom: record.vc_dept_from,
  vcDeptOp: record.vc_dept_op,
  viRegFrom: record.vi_reg_from,
  viRegOp: record.vi_reg_op,
  vaRegFrom: record.va_reg_from,
  vaRegOp: record.va_reg_op,
  vcRegFrom: record.vc_reg_from,
  vcRegOp: record.vc_reg_op,
  viNatFrom: record.vi_nat_from,
  viNatOp: record.vi_nat_op,
  vaNatFrom: record.va_nat_from,
  vaNatOp: record.va_nat_op,
  vcNatFrom: record.vc_nat_from,
  vcNatOp: record.vc_nat_op,
  paramVacaDecumulFrom: record.param_vaca_decumul_from,
  paramVacaPartitionDate: record.param_vaca_partition_date,
  paramVacaOp: record.param_vaca_op,
  paramVacgDecumulFrom: record.param_vacg_decumul_from,
  paramVacgPartitionDate: record.param_vacg_partition_date,
  paramVacgOp: record.param_vacg_op,
  poidsPourcentDept: record.poids_pourcent_dept_declaree || '0',
  poidsPourcentReg: record.poids_pourcent_reg_declaree || '0',
  poidsPourcentNat: record.poids_pourcent_nat_declaree || '0',
  tendance: record.tendance,
  reformePrioritaire: record.reforme_prioritaire || null,
  projetAnnuelPerf: record.projet_annuel_perf === 'true' || record.projet_annuel_perf === 'True',
  detailProjetAnnuelPerf: record.detail_projet_annuel_perf || null,
  periodicite: record.periodicite,
  delaiDisponibilite: !Number.isNaN(record.delai_disponibilite) ? Number(record.delai_disponibilite) : 0,
  indicTerritorialise: record.indic_territorialise === 'true' || record.indic_territorialise === 'True',
  frequenceTerritoriale: !Number.isNaN(record.frequence_territoriale) ? Number(record.frequence_territoriale) : 0,
  mailles: record.mailles || null,
  adminSource: record.admin_source,
  methodeCollecte: record.methode_collecte,
  siSource: record.si_source || null,
  donneeOuverte: record.donnee_ouverte === 'true' || record.donnee_ouverte === 'True',
  modalitesDonneeOuverte: record.modalites_donnee_ouverte || null,
  respDonnees: record.resp_donnees || null,
  respDonneesEmail: record.resp_donnees_email || null,
  contactTechnique: record.contact_technique || null,
  contactTechniqueEmail: record.contact_technique_email,
  commentaire: record.commentaire || null,
});


const AvailableHeaderCSVImport = [
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
  'zg_applicable',
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
  'poids_pourcent_dept_declaree',
  'poids_pourcent_reg_declaree',
  'poids_pourcent_nat_declaree',
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
] as const;

const TEXT_LABEL_CREATION_ID = 'CREATE-ID';
export default class ImportMasseMetadataIndicateurUseCase {
  private _metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository;

  constructor({ 
    metadataParametrageIndicateurRepository,
  } : {
    metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository
  }) {
    this._metadataParametrageIndicateurRepository = metadataParametrageIndicateurRepository;
  }

  async run({ nomDuFichier }: { nomDuFichier: string }) {

    const csvParserOptions = {
      columns: true,
      skipEmptyLines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      delimiter: ';',
      bom: true,
    };
    const contents = fs.readFileSync(nomDuFichier as string, 'utf8');
    const listeRecordCsvImport: RecordCSVImport[] = parse(contents, csvParserOptions);
    supprimerLeFichier(nomDuFichier);
    
    logger.info('Import de masse en cours');

    if (listeRecordCsvImport.length > 0) {
      if (Object.keys(listeRecordCsvImport[0]).sort().toString() === Object.values(AvailableHeaderCSVImport).sort().toString()) {
        let identifiants: Set<number> = new Set();
        let identifiantsFichier: Set<number> = new Set();
        if (listeRecordCsvImport.some(record => record.indic_id === TEXT_LABEL_CREATION_ID)) {
          const listeMetadataParametrageIndicateur = await this._metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurEnFonctionDesFiltres([], [], false, false);
          const sortedListeMetadataParametrageIndicateur = listeMetadataParametrageIndicateur.sort((metadataParametrageIndicateur1, metadataParametrageIndicateur2) => metadataParametrageIndicateur1.indicId.localeCompare(metadataParametrageIndicateur2.indicId));
          identifiants = new Set(sortedListeMetadataParametrageIndicateur.map(metadataParametrageIndicateur => Number(metadataParametrageIndicateur.indicId.split('-')[1])));
          identifiantsFichier = new Set(listeRecordCsvImport.map(recordFichier => Number((recordFichier.indic_id || '').split('-')[1])));
        }
        let currentId = 1;
        const listeMetadataIndicateur: ImportMetadataIndicateur[] = listeRecordCsvImport.map(record => {
          let indicId = record.indic_id;

          if (indicId === TEXT_LABEL_CREATION_ID) {
            while (identifiants.has(currentId) || identifiantsFichier.has(currentId)) {
              currentId++;
            }
            indicId = `IND-${currentId.toString().padStart(3, '0')}`;
            identifiants.add(currentId);
          }

          const importMetadataIndicateur = convertirEnImportMetadataIndicateur({
            ...record,
            indic_id: indicId,
          });

          validationImportMetadataIndicateurFormulaire.and(validationMetadataIndicateurContexte).parse(importMetadataIndicateur);

          return importMetadataIndicateur;
        });
        await this._metadataParametrageIndicateurRepository.importerEnMasseLesMetadataIndicateurs(listeMetadataIndicateur);
      } else {
        throw new Error('Les entêtes ne sont pas correct');
      }
    } else {
      throw new Error('Il n\'y a aucune données dans le fichier');
    }
  }
}
