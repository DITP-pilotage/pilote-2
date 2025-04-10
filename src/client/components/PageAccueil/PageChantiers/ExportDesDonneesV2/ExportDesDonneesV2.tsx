import '@gouvfr/dsfr/dist/component/radio/radio.min.css';
import { FunctionComponent } from 'react';
import {
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import Modale from '@/components/_commons/Modale/Modale';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import { EtapeContenuAExporter } from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapeContenuAExporter';
import {
  EtapeDonneeChantierACollecter,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapeDonneeChantierACollecter';
import { EtapePerimetreExport } from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapePerimetreExport';
import { EtapeRecapitulatif } from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapeRecapitulatif';
import {
  EtapeDonneeIndicateurACollecter,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapeDonneeIndicateurACollecter';
import {
  EtapeDonneeHistoriqueIndicateurACollecter,
} from '@/components/PageAccueil/PageChantiers/ExportDesDonneesV2/EtapeDonneeHistoriqueIndicateurACollecter';
import { EtapeDonneeEnCoursDeTelechargement } from './EtapeDonneeEnCoursDeTelechargement';

const Stepper = {
  'ETAPE_CONTENU_A_EXPORTER': {
    numeroEtape: 1,
    titreEtape: 'Contenus à exporter',
  },
  'ETAPE_PERIMETRE_EXPORT': {
    numeroEtape: 2,
    titreEtape: 'Périmètre de l\'export',
  },
  'ETAPE_DONNEE_A_COLLECTER': {
    numeroEtape: 3,
    titreEtape: 'Données à collecter',
  },
  'ETAPE_RECAPITULATIF': {
    numeroEtape: 4,
    titreEtape: 'Récapitulatif et validation',
  },
  'ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT': {
    numeroEtape: 5,
    titreEtape: 'Donnée en cours de téléchargement',
  },
};

export const ID_HTML_MODALE_EXPORT_V2 = 'modale-exporter-les-données-v2';

export const ExportDesDonneesV2: FunctionComponent<{
  fermetureCallback: () => void
  territoireCodeSelectionne: string
}> = ({ fermetureCallback, territoireCodeSelectionne }) => {
  const étapes = [Stepper.ETAPE_CONTENU_A_EXPORTER.titreEtape, Stepper.ETAPE_PERIMETRE_EXPORT.titreEtape, Stepper.ETAPE_DONNEE_A_COLLECTER.titreEtape, Stepper.ETAPE_RECAPITULATIF.titreEtape, Stepper.ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT.titreEtape];

  const [etapeCourante] = useQueryState('etapeCourante', parseAsInteger.withDefault(Stepper.ETAPE_CONTENU_A_EXPORTER.numeroEtape).withOptions({
    shallow: false,
    history: 'push',
  }));

  const [typeExport] = useQueryState('typeExport', parseAsStringLiteral(['chantiers', 'indicateurs', 'historique-indicateurs']).withDefault('chantiers'));

  return (
    <Modale
      fermetureCallback={fermetureCallback}
      idHtml={ID_HTML_MODALE_EXPORT_V2}
      tailleModale='lg'
    >
      <IndicateurDEtapes
        sousTitreEtape='Exporter les données'
        étapeCourante={etapeCourante}
        étapes={étapes}
      />
      {
        etapeCourante === Stepper.ETAPE_CONTENU_A_EXPORTER.numeroEtape ? (
          <EtapeContenuAExporter />
        ) : etapeCourante === Stepper.ETAPE_PERIMETRE_EXPORT.numeroEtape ? (
          <EtapePerimetreExport />
        ) : etapeCourante === Stepper.ETAPE_DONNEE_A_COLLECTER.numeroEtape ? (
          typeExport === 'chantiers' ? <EtapeDonneeChantierACollecter />
            : typeExport === 'indicateurs'
              ? <EtapeDonneeIndicateurACollecter />
              : <EtapeDonneeHistoriqueIndicateurACollecter />
        ) : etapeCourante === Stepper.ETAPE_RECAPITULATIF.numeroEtape ? (
          <EtapeRecapitulatif territoireCodeSelectionne={territoireCodeSelectionne} />
        ) : etapeCourante === Stepper.ETAPE_DONNEE_EN_COURS_DE_TELECHARGEMENT.numeroEtape ? (
          <EtapeDonneeEnCoursDeTelechargement />
        ) : null
      }
    </Modale>
  );
};
