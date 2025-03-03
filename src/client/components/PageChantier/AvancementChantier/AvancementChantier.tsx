import { FunctionComponent } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementsTerritoire from '@/components/_commons/AvancementsTerritoire/AvancementsTerritoire';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SélecteurMaille
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import { JaugeDeProgressionSmall } from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import Infobulle from '@/components/_commons/InfobulleNew/Infobulle';
import AvancementChantierStyled from './AvancementChantier.styled';

const classeÀPartirDeLaMaille = {
  'nationale': 'layout--nat',
  'departementale': 'layout--dept',
  'regionale': 'layout--reg',
};

interface AvancementChantierProps {
  territoireCode: string
  mailleSelectionnee: MailleInterne
  jalon: number
  mailleQuery: MailleInterne
  estAutoriseAVoirLeSelecteurDeMaille: boolean
  avancements: {
    nationale: AvancementsStatistiques
    departementale: {
      global: {
        moyenne: number | null
      },
      annuel: {
        moyenne: number | null
      },
    }
    regionale: {
      global: {
        moyenne: number | null
      },
      annuel: {
        moyenne: number | null
      },
    }
  }
  mailleSourceDonnees?: Maille | null
}

const AvancementChantier: FunctionComponent<AvancementChantierProps> = ({
  avancements,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  estAutoriseAVoirLeSelecteurDeMaille,
  mailleSourceDonnees,
  jalon,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [, setJalon] = useQueryState('jalon', parseAsStringLiteral(['2024', '2025']).withDefault('2024').withOptions({
    shallow: false,
    history: 'push',
  }));

  const auClickSelecteurJalon = (valeur: '2024' | '2025') => {
    sauvegarderFiltres({ jalon: valeur });
    setJalon(valeur);
  };

  const pathname = '/chantier/[id]/[territoireCode]';

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const territoireSélectionnéParent = territoireSélectionné.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;

  return (
    <AvancementChantierStyled className={classeÀPartirDeLaMaille[territoireSélectionné.maille]}>
      {
        territoireCode !== 'NAT-FR' && mailleSelectionnee === 'departementale' ? (
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.departementale.annuel.moyenne}
                avancementGlobal={avancements.departementale.global.moyenne}
                couleurBarreDeProgression='secondaire'
                couleurJaugeDeProgression='bleu'
                doitAfficherLeSelecteur={territoireCode.startsWith('DEPT')}
                jalon={jalon}
                territoireNom={territoireSélectionné.nom}
              />
              {
                mailleSourceDonnees === 'regionale' &&
                <Alerte
                  classesMessagePolice='fr-text fr-text--xs'
                  classesSupplementaires='fr-mt-2w'
                  message='Données régionales'
                  type='info'
                />
              }
            </div>
          </Bloc>
        ) : null
      }
      {
        territoireCode !== 'NAT-FR' && (mailleSelectionnee === 'regionale' || mailleSelectionnee === 'departementale') ? (
          <Bloc
            titre={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
          >
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.regionale.annuel.moyenne}
                avancementGlobal={avancements.regionale.global.moyenne}
                couleurBarreDeProgression={mailleSelectionnee === 'regionale' ? 'secondaire' : 'secondaire-light'}
                couleurJaugeDeProgression={mailleSelectionnee === 'regionale' ? 'bleu' : 'bleu-clair'}
                doitAfficherLeSelecteur={territoireCode.startsWith('REG')}
                jalon={jalon}
                territoireNom={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
              />
            </div>
          </Bloc>
        ) : null
      }
      <Bloc
        titre='France'
      >
        <div className='fr-py-1w jauge'>
          <JaugeDeProgression
            couleur={territoireCode !== 'NAT-FR' ? 'bleu-clair' : 'bleu'}
            libellé='France'
            pourcentage={avancements.nationale ? avancements.nationale.global.moyenne : null}
            taille='lg'
          />
          <div className='fr-mt-2w'>
            <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
              {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale?.annuel.moyenne?.toFixed(0) : null) ?? '- '}%`}
            </p>
            <BarreDeProgression
              afficherTexte={false}
              bordure={null}
              fond='gris-clair'
              positionTexte='dessus'
              taille='xxs'
              valeur={!!avancements.nationale && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale.annuel.moyenne : null}
              variante='secondaire-light'
            />
            <div className='flex align-center justify-center fr-text--xs  w-full relative'>
              <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
                {`Avancement à échéance${!territoireCode.startsWith('NAT') ? ` ${jalon}` : ''}`}
              </p>
              {
                territoireCode.startsWith('NAT') ? (
                  <div className='flex flex-wrap justify-center'>
                    <div
                      className='select-sm flex align-center justify-center'
                    >
                      <Sélecteur<'2024' | '2025'>
                        htmlName='jalon'
                        options={[{ libellé: '2024', valeur: '2024' }, { libellé: '2025', valeur: '2025' }]}
                        texteFantôme='Sélectionner un jalon'
                        valeurModifiéeCallback={auClickSelecteurJalon}
                        valeurSélectionnée={`${jalon}` as '2024' | '2025'}
                      />
                      <Infobulle
                        idHtml='infobulle-selecteur-jalon'
                      >
                        {INFOBULLE_CONTENUS.chantiers.jalon}
                      </Infobulle>
                    </div>
                  </div>
                ) : null
              }
            </div>
          </div>
        </div>
      </Bloc>
      <Bloc
        className='h-full'
        contenuClassesSupplémentaires='fr-p-1w fr-p-lg-2w'
        contenuInfobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
        titre='Répartition territoriale'
      >
        <div className='fr-container fr-px-md-1w fr-px-lg-2w'>
          {
            estAutoriseAVoirLeSelecteurDeMaille ? (
              <div className='fr-grid-row fr-py-1w fr-text--sm'>
                <SélecteurMaille
                  mailleQuery={mailleQuery}
                  pathname={pathname}
                />
              </div>
            ) : null
          }
          <div className='flex flex-column justify-center'>
            <JaugeDeProgressionSmall
              couleur='vert'
              libellé='Maximum'
              pourcentage={avancements.nationale ? avancements.nationale.global.maximum : null}
            />
            <JaugeDeProgressionSmall
              couleur='violet'
              libellé='Médiane'
              pourcentage={avancements.nationale ? avancements.nationale.global.médiane : null}
            />
            <JaugeDeProgressionSmall
              couleur='orange'
              libellé='Minimum'
              pourcentage={avancements.nationale ? avancements.nationale.global.minimum : null}
            />
          </div>
        </div>
      </Bloc>
    </AvancementChantierStyled>
  );
};

export default AvancementChantier;
