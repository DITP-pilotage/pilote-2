import Bloc from '@/components/_commons/Bloc/Bloc';
import Avancements from '@/components/_commons/Avancements/Avancements';
import {
  actionsTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementsTerritoire from '@/components/_commons/AvancementsTerritoire/AvancementsTerritoire';
import AvancementChantierProps from './AvancementChantier.interface';
import AvancementChantierStyled from './AvancementChantier.styled';

const classeÀPartirDeLaMaille = {
  'nationale': '',
  'départementale': 'layout--dept',
  'régionale': 'layout--reg',
};

export default function AvancementChantier({ avancements }: AvancementChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  return (
    <AvancementChantierStyled className={classeÀPartirDeLaMaille[territoireSélectionné!.maille]}>
      {
        (avancements.départementale.global.moyenne !== undefined && avancements.départementale.annuel.moyenne !== undefined) &&
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.départementale.annuel.moyenne}
                avancementGlobal={avancements.départementale.global.moyenne}
                territoireNom={territoireSélectionné!.nom}
              />
            </div>
          </Bloc>
      }
      {
        (avancements.régionale.global.moyenne !== undefined && avancements.régionale.annuel.moyenne !== undefined) &&
          <Bloc titre={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.régionale.annuel.moyenne}
                avancementGlobal={avancements.régionale.global.moyenne}
                territoireNom={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}
              />
            </div>
          </Bloc>
      }
      <div className='avancement-national'>
        <Bloc titre='National'>
          <div className='fr-py-1w'>
            <Avancements avancements={avancements.nationale ?? null} />
          </div>
        </Bloc>
      </div>
    </AvancementChantierStyled>
  );
}
