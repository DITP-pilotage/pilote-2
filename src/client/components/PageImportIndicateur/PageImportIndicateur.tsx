import { FunctionComponent } from 'react';
import PageImportIndicateurSectionRessource
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionRessource/PageImportIndicateurSectionRessource';
import { RapportContrat } from '@/server/app/contrats/RapportContrat';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { InformationIndicateurContrat } from '@/server/app/contrats/InformationIndicateurContrat';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurExplicationEtapeImport
  from './PageImportIndicateurExplicationEtapeImport/PageImportIndicateurExplicationEtapeImport';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';
import { ChantierInformations } from './ChantierInformation.interface';

interface PageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[];
  rapport: RapportContrat | null
  informationsIndicateur: InformationIndicateurContrat[],
  hrefBoutonRetour: string
}

const PageImportIndicateur: FunctionComponent<PageImportIndicateurProps> = ({
  chantierInformations,
  indicateurs,
  informationsIndicateur,
  rapport,
  hrefBoutonRetour,
}) => {
  return (
    <main>
      <PageImportIndicateurEnTête
        chantierInformations={chantierInformations}
        hrefBoutonRetour={hrefBoutonRetour}
      />
      <PageImportIndicateurExplicationEtapeImport />
      <PageImportIndicateurSectionImport
        indicateurs={indicateurs}
        informationsIndicateur={informationsIndicateur}
        rapport={rapport}
      />
      <PageImportIndicateurSectionRessource />
    </main>
  );
};

export default PageImportIndicateur;

