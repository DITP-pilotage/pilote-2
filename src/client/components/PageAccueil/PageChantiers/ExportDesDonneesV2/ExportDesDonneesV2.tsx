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
};

export const ID_HTML_MODALE_EXPORT_V2 = 'modale-exporter-les-données-v2';

export const ExportDesDonneesV2: FunctionComponent<{
  fermetureCallback: () => void
}> = ({ fermetureCallback }) => {
  const étapes = [Stepper.ETAPE_CONTENU_A_EXPORTER.titreEtape, Stepper.ETAPE_PERIMETRE_EXPORT.titreEtape, Stepper.ETAPE_DONNEE_A_COLLECTER.titreEtape, Stepper.ETAPE_RECAPITULATIF.titreEtape];

  const [etapeCourante] = useQueryState('etapeCourante', parseAsInteger.withDefault(Stepper.ETAPE_CONTENU_A_EXPORTER.numeroEtape).withOptions({
    shallow: false,
    history: 'push',
  }));

  const [typeExport] = useQueryState('typeExport', parseAsStringLiteral(['ppg', 'indicateurs']).withDefault('ppg'));

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
          typeExport === 'ppg' ? <EtapeDonneeChantierACollecter /> : <EtapeDonneeIndicateurACollecter />
        ) : etapeCourante === Stepper.ETAPE_RECAPITULATIF.numeroEtape ? (
          <EtapeRecapitulatif />
        ) : null
      }
    </Modale>
  );
};
