import { FunctionComponent } from 'react';
import Link from 'next/dist/client/link';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IcôneEmail from '@/components/_commons/IcôneEmail/IcôneEmail';
import api from '@/server/infrastructure/api/trpc/api';
import IndicateurSpécificationsStyled from './IndicateurSpécifications.styled';

interface IndicateurSpécificationsProps {
  description: Indicateur['description']
  modeDeCalcul: Indicateur['modeDeCalcul']
  source: Indicateur['source']
  periodicite: Indicateur['periodicite']
  delaiDisponibilite: Indicateur['delaiDisponibilite']
  dateValeurActuelle: string | null
  dateProchaineDateMaj: string | null
  dateProchaineDateValeurActuelle: string | null
  indicateurEstAjour: boolean
  indicateurEstApplicable: boolean | null
  responsablesMails: string[]
  indicateurId: string
  indicateurNom: string
}

const IndicateurSpécifications: FunctionComponent<IndicateurSpécificationsProps> = ({
  description,
  modeDeCalcul,
  source,
  periodicite,
  delaiDisponibilite,
  dateProchaineDateMaj,
  dateProchaineDateValeurActuelle,
  dateValeurActuelle,
  indicateurEstAjour,
  indicateurEstApplicable,
  responsablesMails,
  indicateurId,
  indicateurNom,
}) => {
  const libelléValeurNull = 'Non renseignée';
  const objectMail = `PILOTE - Indicateur ${indicateurNom} (${indicateurId})`;
  const { data: variableContenuFFPoserUneQuestion } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR' });


  return (
    <IndicateurSpécificationsStyled>
      <p className='fr-text--md sous-titre'>
        Description de l'indicateur
      </p>
      <p className='fr-text--sm'>
        {description ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Méthode de calcul
      </p>
      <p className='fr-text--sm'>
        {modeDeCalcul ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Source
      </p>
      <p className='fr-text--sm'>
        {source ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Mise à jour
      </p>
      {
        !!!indicateurEstApplicable ? (
          <p className='fr-text--sm'>
            L'indicateur n’est pas applicable sur le territoire.
          </p>            
        ) : !!dateProchaineDateMaj ? (
          <>
            <p className='fr-text--sm'>
              La période de mise à jour pour cet indicateur est :
              {' '}
              <span className='fr-text--bold'>
                {periodicite ?? libelléValeurNull}
              </span>
            </p>
            <p className='fr-text--sm'>
              La date de valeur actuelle de cet indicateur est :
              {' '}
              <span className='fr-text--bold'>
                {`${dateValeurActuelle ?? libelléValeurNull}.`}
              </span>
              {' '}
              La date de la prochaine valeur actuelle sera donc :
              {' '}
              <span className='fr-text--bold'>
                {`${dateProchaineDateValeurActuelle ?? libelléValeurNull}.`}
              </span>
            </p>
            <p className='fr-text--sm'>
              La mise à disposition d’une nouvelle valeur pour cet indicateur nécessite un délai de disponibilité de
              {' '}
              <span className='fr-text--bold'>
                {delaiDisponibilite ? `${delaiDisponibilite} mois.` : 'Non renseigné'}
              </span>
              {' '}
              {`De ce fait, la mise à jour de la prochaine valeur actuelle est requise ${indicateurEstAjour ? 'au plus tard à' : 'depuis'} la date :`}
              {' '}
              <span className='fr-text--bold'>
                {`${dateProchaineDateMaj ?? libelléValeurNull}.`}
              </span>
            </p>
          </>
        ) : (
          <>
            {
              !!dateValeurActuelle ? (
                <p className='fr-text--sm'>
                  La période de mise à jour pour cet indicateur et/ou le délai de disponibilité ne sont pas renseignés.
                </p>
              ) : (
                <p className='fr-text--sm'>
                  La valeur actuelle de cet indicateur est non renseignée.
                </p>                
              )
            }
            <p className='fr-text--sm'>
              De ce fait, la mise à jour de la prochaine valeur actuelle ne peut être calculée.
            </p>
          </>
        )
      }
      {
        !!variableContenuFFPoserUneQuestion && (
          <div className='fr-mt-3w fr-ml-7w fr-p-2w bloc-question'>
            <div className='flex'>
              <span
                aria-hidden='true'
                className='fr-icon-question-fill icone-question fr-mr-2w'
              />
              <div>
                <p className='fr-text--md sous-titre'>
                  Poser une question sur cet indicateur
                </p>
                <p className='fr-text fr-text--sm fr-mb-0'>
                  Des questions ou des remarques sur cet indicateur (définition de l’indicateur, données source, méthode de calcul, mise à jour, etc.) ? Contactez le responsable des données de la politique prioritaire désigné par le directeur de projet pour obtenir plus d’informations.
                </p>
              </div>

            </div>
            <div className='flex align-end justify-end'>
              <IcôneEmail className='fr-mr-1v fr-text-title--blue-france fr-mt-2w fr-mt-lg-0' />
              <Link
                className='fr-link'
                href={`mailto:${responsablesMails.join(', ')}?subject=${objectMail}`}
                title={`Contacter ${responsablesMails.join(', ')}`}
              >  
                Contacter
              </Link> 
            </div>
          </div>
        )
      }


    </IndicateurSpécificationsStyled>
  );
};

export default IndicateurSpécifications;
