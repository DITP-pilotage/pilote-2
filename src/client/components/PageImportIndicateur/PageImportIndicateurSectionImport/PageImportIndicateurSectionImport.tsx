import { useRouter } from 'next/router';
import { useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import { wording } from '@/client/utils/i18n/i18n';
import {
  EtapeSelectionIndicateur,
} from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/EtapeSelectionIndicateur';
import {
  EtapeChargerFichier,
} from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/EtapeChargerFichier';
import {
  EtapePublierFichier,
} from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/EtapePublierFichier';
import { EtapesImport } from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/EtapesImport';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

const étapes = [
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.SOUS_TITRE_SELECTEUR,
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.SOUS_TITRE_SELECTEUR,
  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.SOUS_TITRE_SELECTEUR,
];

export default function PageImportIndicateurSectionImport({
  indicateurs,
  informationsIndicateur,
  rapport: rapportImport,
}: PageImportIndicateurSectionImportProps) {
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);
  const [estFichierPublie, setEstFichierPublie] = useState<boolean>(false);


  const optionsSélecteur = indicateurs.map(elem => ({
    libellé: elem.nom,
    valeur: elem.id,
  }));


  const { query } = useRouter();
  const etapeCourante = (query.etapeCourante || 1) as number;
  const indicateur = indicateurs.find(indic => indic.id === query.indicateurId) as Indicateur;
  const chantierId = query.id as string;
  const indicateurId = query.indicateurId as string;
  const rapportId = query.rapportId as string;
  const [indicateurSelectionné, setIndicateurSelectionné] = useState<string>(optionsSélecteur[0]?.valeur || '');

  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.TITRE}
        </Titre>
        <Bloc>
          <IndicateurDEtapes
            étapeCourante={etapeCourante}
            étapes={étapes}
          />
          <div className={`${etapeCourante != EtapesImport.SELECTION_INDICATEUR && 'fr-hidden'}`}>
            <EtapeSelectionIndicateur
              informationsIndicateur={informationsIndicateur}
              options={optionsSélecteur}
              valeurModifiéeCallback={setIndicateurSelectionné}
              valeurSélectionnée={indicateurSelectionné}
            />
          </div>
          <div className={`${etapeCourante != EtapesImport.VERIFIER_FICHIER && 'fr-hidden'}`}>
            <EtapeChargerFichier
              chantierId={chantierId}
              indicateur={indicateur}
              indicateurId={indicateurId}
              rapport={rapport}
              setRapport={setRapport}
            />
          </div>
          <div className={`${etapeCourante != EtapesImport.IMPORT_FICHIER && 'fr-hidden'}`}>
            <EtapePublierFichier
              chantierId={chantierId}
              estFichierPublie={estFichierPublie}
              indicateurId={indicateurId}
              rapportId={rapportId}
              rapportImport={rapportImport}
              setEstFichierPublie={setEstFichierPublie}
            />
          </div>
        </Bloc>
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
