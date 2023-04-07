import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LIMITE_CARACTÈRES_COMMENTAIRE, validationCommentaireFormulaire } from 'validation/commentaire';
import CompteurCaractères from '@/components/_commons/FormulaireDePublication/CompteurCaractères/CompteurCaractères';
import Titre from '@/components/_commons/Titre/Titre';
import Alerte from '@/components/_commons/Alerte/Alerte';
import CommentaireFormulaireStyled from './CommentaireFormulaire.styled';
import CommentaireFormulaireProps, { CommentaireFormulaireInputs } from './CommentaireFormulaire.interface';
import useCommentaireFormulaire from './useCommentaireFormulaire';

export default function CommentaireFormulaire({ contenuInitial, type, commentaireCrééCallback, annulationCallback }: CommentaireFormulaireProps) {
  const { créerCommentaire, alerte } = useCommentaireFormulaire(commentaireCrééCallback);
  
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm<CommentaireFormulaireInputs>({
    mode: 'all',
    resolver: zodResolver(validationCommentaireFormulaire),
    defaultValues: {
      contenu: contenuInitial,
      type: type,
    },
  });

  return (
    <CommentaireFormulaireStyled
      method="post"
      onSubmit={handleSubmit(créerCommentaire)}
    >
      <Titre
        baliseHtml='h3'
        className='fr-h5 fr-mb-1v'
      >
        Modifier le commentaire
      </Titre>
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
        <div className="flex justifyBetween">
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
            limiteDeCaractères={LIMITE_CARACTÈRES_COMMENTAIRE}
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
      {
        !!alerte && (
        <div className="fr-mt-2w">
          <Alerte
            message={alerte.message}
            type={alerte.type}
          />
        </div>
        )
      }
    </CommentaireFormulaireStyled>
  );
}
