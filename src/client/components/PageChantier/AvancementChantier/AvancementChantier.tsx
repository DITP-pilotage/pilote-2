import { FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementsTerritoire from '@/components/_commons/AvancementsTerritoire/AvancementsTerritoire';
import Titre from '@/components/_commons/Titre/Titre';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import Alerte from '@/components/_commons/Alerte/Alerte';
import SélecteurMaille
  from '@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille';
import INFOBULLE_CONTENUS from '@/client/constants/infobulles';
import { JaugeDeProgressionSmall } from '@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall';
import AvancementChantierStyled from './AvancementChantier.styled';

const classeÀPartirDeLaMaille = {
  'nationale': '',
  'départementale': 'layout--dept',
  'régionale': 'layout--reg',
};

interface AvancementChantierProps {
  territoireCode: string
  mailleSelectionnee: MailleInterne
  mailleQuery: MailleInterne
  estAutoriseAVoirLeSelecteurDeMaille: boolean
  avancements: {
    nationale: AvancementsStatistiques
    départementale: {
      global: {
        moyenne: number | null
      },
      annuel: {
        moyenne: number | null
      },
    }
    régionale: {
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
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const pathname = '/chantier/[id]/[territoireCode]';

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const territoireSélectionnéParent = territoireSélectionné.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;

  return (
    <AvancementChantierStyled className={classeÀPartirDeLaMaille[territoireSélectionné.maille]}>
      {
        territoireCode !== 'NAT-FR' && mailleSelectionnee === 'départementale' ? (
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.départementale.annuel.moyenne}
                avancementGlobal={avancements.départementale.global.moyenne}
                territoireNom={territoireSélectionné.nom}
              />
              {
                mailleSourceDonnees === 'régionale' &&
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
        territoireCode !== 'NAT-FR' && (mailleSelectionnee === 'régionale' || mailleSelectionnee === 'départementale') ? (
          <Bloc
            titre={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
          >
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.régionale.annuel.moyenne}
                avancementGlobal={avancements.régionale.global.moyenne}
                territoireNom={territoireSélectionnéParent ? territoireSélectionnéParent.nomAffiché : territoireSélectionné.nomAffiché}
              />
            </div>
          </Bloc>
        ) : null
      }   
      <Bloc
        contenuClassesSupplémentaires='fr-p-1w fr-p-lg-2w'
        titre='National'
      >
        <Titre
          baliseHtml='h3'
          className='fr-text--md fr-mb-1w fr-py-1v texte-centre break-keep flex justify-center w-full'
        >
          Taux d’avancement national
        </Titre>
        <div className='flex w-full justify-center'>
          <JaugeDeProgression
            couleur='bleu'
            libellé='Taux d’avancement moyen pour le territoire '
            pourcentage={avancements.nationale ? avancements.nationale.global.moyenne : null}
            taille='lg'
          />
        </div>
        <div className='fr-grid-row border-t fr-mt-1w '>
          <div className='fr-mt-1w w-full'>
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
              variante='secondaire'
            />
            <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
              Moyenne de l'année en cours
            </p>
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
