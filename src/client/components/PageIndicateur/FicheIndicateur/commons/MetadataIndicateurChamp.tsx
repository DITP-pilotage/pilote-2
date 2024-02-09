import { PropsWithChildren } from 'react';
import { InformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { ChampObligatoire } from '@/components/PageIndicateur/ChampObligatoire';
import Infobulle from '@/components/_commons/Infobulle/Infobulle';

export const MetadataIndicateurChamp = ({
  children,
  informationMetadataIndicateur,
  estEnCoursDeModification,
  valeurAffiché,
}: PropsWithChildren<{
  informationMetadataIndicateur: InformationMetadataIndicateurContrat,
  estEnCoursDeModification: boolean,
  valeurAffiché: string,
}>) => {
  return (
    <>
      <div className='fr-text--md bold fr-mb-1v relative flex'>
        <p className='titre-input-metadata overflow-ellipsis'>
          {informationMetadataIndicateur.metaPiloteAlias}
        </p>
        {estEnCoursDeModification ? (
          <>
            {
              informationMetadataIndicateur.metaPiloteMandatory
                ? (
                  <ChampObligatoire />
                ) : null
            }
            {
              informationMetadataIndicateur.metaPiloteDispDispDesc ? (
                <Infobulle idHtml='indicParentCh'>
                  {informationMetadataIndicateur.description}
                </Infobulle>
              ) : null
            }
          </>
        ) : null}
      </div>
      {
        estEnCoursDeModification
          ? (
            <div>
              { children }
            </div>
          )
          : (
            <span>
              {valeurAffiché}
            </span>
          )
      }
    </>
  );
};
