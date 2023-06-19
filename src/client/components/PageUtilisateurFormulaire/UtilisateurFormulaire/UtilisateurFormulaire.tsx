import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import { UtilisateurFormInputs } from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import { validationInfosBaseUtilisateur } from '@/validation/utilisateur';
import UtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface';
import RécapitulatifUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/RécapitulatifUtilisateur';
import SaisieDesInformationsUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur';

export default function UtilisateurFormulaire({ profils }: UtilisateurFormulaireProps) {
  const étapes = ['Identifier l\'utilisateur', 'Vérifier les droits attribués au compte'];
  const [etapeCourante, setEtapeCourante] = useState(1);

  const reactHookForm = useForm<UtilisateurFormInputs>({
    resolver: zodResolver(validationInfosBaseUtilisateur),
  });

  const passerAuRécapitulatif = async () => {
    setEtapeCourante(2);
  };

  return (
    <>
      <IndicateurDEtapes
        étapeCourante={etapeCourante}
        étapes={étapes}
      />
      <FormProvider {...reactHookForm}>
        <form onSubmit={reactHookForm.handleSubmit(passerAuRécapitulatif)}>
          {
            etapeCourante === 1 &&
              <SaisieDesInformationsUtilisateur
                profils={profils}
              />
          }
          {etapeCourante === 2 && <RécapitulatifUtilisateur />}
        </form>
      </FormProvider>
    </>
  );
}
