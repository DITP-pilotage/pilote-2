import { FunctionComponent, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import { donneValidationInfosBaseUtilisateur } from '@/validation/utilisateur';
import RécapitulatifUtilisateur
  from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/RécapitulatifUtilisateur';
import { UtilisateurFormInputs, UtilisateurFormulaireProps } from './UtilisateurFormulaire.interface';
import SaisieDesInformationsUtilisateur from './SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur';

const UtilisateurFormulaire: FunctionComponent<UtilisateurFormulaireProps> = ({ utilisateur }) => {
  const étapes = ['Identifier l\'utilisateur', 'Vérifier les droits attribués au compte'];
  const [etapeCourante, setEtapeCourante] = useState(1);
  const { data: session } = useSession();

  const reactHookForm = useForm<UtilisateurFormInputs>({
    resolver: zodResolver(donneValidationInfosBaseUtilisateur(session!.profil)),
    defaultValues: {
      email: utilisateur?.email,
      nom: utilisateur?.nom,
      prénom: utilisateur?.prénom,
      fonction: utilisateur?.fonction,
      profil: utilisateur?.profil,
      gestionUtilisateur: utilisateur?.gestionUtilisateur,
      saisieCommentaire: utilisateur?.saisieCommentaire,
      saisieIndicateur: utilisateur?.saisieIndicateur,
      habilitations: {
        lecture: {
          chantiers: utilisateur?.habilitations.lecture.chantiers,
          périmètres: utilisateur?.habilitations.lecture.périmètres,
          territoires: utilisateur?.habilitations.lecture.territoires,
        },
        responsabilite: {
          chantiers: utilisateur?.habilitations.responsabilite.chantiers,
        },
      },
    },
  });

  const passerAuRécapitulatif = async () => {
    setEtapeCourante(2);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [etapeCourante]);

  return (
    <>
      {
        etapeCourante === 1 ?
          <Link
            aria-label='Retour à la liste des utilisateurs'
            className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour'
            href='/admin/utilisateurs'
          >
            Retour
          </Link> 
          : 
          <button
            className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour'
            onClick={() => setEtapeCourante(1)}
            type='button'
          >
            Retour
          </button>
      }
      <Titre
        baliseHtml='h1'
        className='fr-h1 fr-mt-4w'
      >
        { utilisateur ? 'Modifier un compte' : 'Créer un compte' }
      </Titre>
      <Bloc>
        <div className='fr-px-10w fr-py-6w'>
          <IndicateurDEtapes
            étapeCourante={etapeCourante}
            étapes={étapes}
          />
          <FormProvider {...reactHookForm}>
            <form onSubmit={reactHookForm.handleSubmit(passerAuRécapitulatif)}>
              {
                etapeCourante === 1 &&
                  <SaisieDesInformationsUtilisateur utilisateur={utilisateur} />
              }
              {
                etapeCourante === 2 && 
                  <RécapitulatifUtilisateur 
                    auClicBoutonRetourCallback={() => setEtapeCourante(1)} 
                    utilisateurExistant={Boolean(utilisateur)}
                  />
              }
            </form>
          </FormProvider>
        </div>
      </Bloc>
    </>
  );
};

export default UtilisateurFormulaire;
