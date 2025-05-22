import { parseAsStringLiteral, useQueryState } from 'nuqs';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteursMaillesEtTerritoires';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import SélecteurMaille from '@/client/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import Infobulle from '@/client/components/_commons/Infobulle/Infobulle';

type PanelMenuNavigationProps = {
  pathname: string;
  territoireCode: string;
  mailleQuery: MailleInterne;
  estAutoriseAVoirLeSelecteurDeMaille: boolean;
  setEstOuverteBarreLatérale: (estOuverte: boolean) => void;
  libelleMenuNavigation?: string;
};

export const PanelMenuNavigation = ({ pathname, territoireCode, mailleQuery, estAutoriseAVoirLeSelecteurDeMaille, setEstOuverteBarreLatérale, libelleMenuNavigation = 'Filtrer' }: PanelMenuNavigationProps) => {
  const [jalon, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2025').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));
  
  return (
    <>
      <div className='fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w'>
        <SélecteursMaillesEtTerritoires
          direction='horizontal'
          pathname={pathname}
          territoireCode={territoireCode}
        />
      </div>
      <div className='fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w'>
        <div className='flex align-center'>
          <label
            className='fr-label fr-mr-1w no-wrap'
            htmlFor='jalon'
          >
            Jalon :
          </label>
          <select 
            className='fr-select fr-mt-0 fr-mr-1w'
            id='jalon'
            onChange={(e) => setJalon(e.target.value as '2024' | '2025')}
            value={jalon}
          >
            <option value='2024'>
              2024
            </option>
            <option value='2025'>
              2025
            </option>
          </select>
          <Infobulle
            idHtml='infobulle-selecteur-jalon'
          >
            {INFOBULLE_CONTENUS.chantiers.jalon}
          </Infobulle>
        </div>
      </div>
      {
      estAutoriseAVoirLeSelecteurDeMaille ? (
        <div className='fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w flex align-center'>
          <SélecteurMaille
            mailleQuery={mailleQuery}
            pathname={pathname}
          />
        </div>
      ) : null
    }
      <div className='fr-hidden-lg fr-py-1w fr-background-blue-france-975 w-full'>
        <button
          className='fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france'
          onClick={() => {
            setEstOuverteBarreLatérale(true);
          }}
          title='Filtrer'
          type='button'
        >
          {libelleMenuNavigation}
        </button>
      </div>
    </>
  );
};
