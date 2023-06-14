import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import SaisieDesInformationsUtilisateur from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur';
import { UtilisateurFormInputs } from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import { validationInfosBaseUtilisateur } from '@/validation/utilisateur';
import UtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import useUtilisateurFormulaire
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/useUtilisateurFormulaire';
import RécapitulatifUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/RécapitulatifUtilisateur';

export default function UtilisateurFormulaire({ profils }: UtilisateurFormulaireProps) {
  const { créerUtilisateur } = useUtilisateurFormulaire();
  const étapes = ['Identifier l\'utilisateur', 'vérifier les droits attribués au compte'];
  const [etapeCourante, setEtapeCourante] = useState(1);

  const reactHookForm = useForm<UtilisateurFormInputs>({
    resolver: zodResolver(validationInfosBaseUtilisateur),
  });

  const validerLeFormulaire = async () => {
    const estValide = await reactHookForm.trigger();
    if (estValide)
      setEtapeCourante(2);
  };

  

  

  return (
    <>
      <IndicateurDEtapes
        étapeCourante={etapeCourante}
        étapes={étapes}
      />
      <FormProvider {...reactHookForm}>
        <form onSubmit={reactHookForm.handleSubmit(créerUtilisateur)}>
          {
            etapeCourante === 1 &&
              <SaisieDesInformationsUtilisateur
                profils={profils}
                soumissionCallback={() => validerLeFormulaire()}
              />
          }
          {etapeCourante === 2 && <RécapitulatifUtilisateur />}
        </form>
      </FormProvider>
    </>
  );
}
