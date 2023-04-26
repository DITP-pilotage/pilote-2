import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import router from 'next/router';
import { LIMITE_CARACTÈRES_PUBLICATION, validationPublicationFormulaire } from 'validation/publication';
import CompteurCaractères from '@/components/_commons/CompteurCaractères/CompteurCaractères';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import PublicationFormulaireStyled from './PublicationFormulaire.styled';
import PublicationFormulaireProps, { PublicationFormulaireInputs } from './PublicationFormulaire.interface';
import usePublicationFormulaire from './usePublicationFormulaire';

export default function PublicationFormulaire({ contenuInitial, type, entité, succèsCallback, erreurCallback, annulationCallback }: PublicationFormulaireProps) {
  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { créerPublication } = usePublicationFormulaire(succèsCallback, erreurCallback);
  
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm<PublicationFormulaireInputs>({
    mode: 'all',
    resolver: zodResolver(validationPublicationFormulaire),
    defaultValues: {
      contenu: contenuInitial,
      type: type,
      entité: entité,
      maille: mailleSélectionnée,
      codeInsee: territoireSélectionné.codeInsee,
      chantierId: router.query.id as string,
    },
  });

  return (
    <PublicationFormulaireStyled
      method="post"
      onSubmit={handleSubmit(créerPublication)}
    >
      <div className={`fr-mb-0 fr-input-group ${errors.contenu && 'fr-input-group--error'}`}>
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          rows={6}
          {...register('contenu')}
        />
        <input
          type="hidden"
          {...register('type')}
        />
        <input
          type="hidden"
          {...register('entité')}
        />
        <input
          type="hidden"
          {...register('maille')}
        />
        <input
          type="hidden"
          {...register('codeInsee')}
        />
        <input
          type="hidden"
          {...register('chantierId')}
        />
        <div className="flex justify-between">
          <div>
            {
              !!errors.contenu &&
                <p className="fr-error-text fr-mt-0 fr-mr-2w">
                  {errors.contenu.message}
                </p>
            }
          </div>
          <CompteurCaractères
            compte={watch('contenu')?.length ?? 0}
            limiteDeCaractères={LIMITE_CARACTÈRES_PUBLICATION}
          />
        </div>
      </div>
      <div className="fr-mt-1v flex partie-basse">
        <div className='actions'>
          <button
            className='fr-btn fr-mr-3w'
            disabled={!isValid}
            type='submit'
          >
            Publier
          </button>
          <button
            className='fr-btn fr-btn--secondary'
            onClick={annulationCallback}
            type='button'
          >
            Annuler
          </button>
        </div>
      </div>
    </PublicationFormulaireStyled>
  );
}
