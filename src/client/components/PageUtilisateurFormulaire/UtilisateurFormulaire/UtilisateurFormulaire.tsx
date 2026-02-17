import { FunctionComponent, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { $Enums } from "@prisma/client";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import IndicateurDEtapes from "@/components/_commons/IndicateurDEtapes/IndicateurDEtapes";
import { donneValidationInfosBaseUtilisateur } from "@/validation/utilisateur";
import RécapitulatifUtilisateur from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/RécapitulatifUtilisateur/RécapitulatifUtilisateur";
import api from "@/server/infrastructure/api/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import {
  UtilisateurFormInputs,
  UtilisateurFormulaireProps,
} from "./UtilisateurFormulaire.interface";
import SaisieDesInformationsUtilisateur from "./SaisieDesInformationsUtilisateur/SaisieDesInformationsUtilisateur";

const UtilisateurFormulaire: FunctionComponent<UtilisateurFormulaireProps> = ({
  utilisateur,
  estAutoriseAVoirLeSelecteurApplication,
  creationCompteArsActive,
}) => {
  const étapes = [
    "Identifier l'utilisateur",
    "Vérifier les droits attribués au compte",
  ];
  const [etapeCourante, setEtapeCourante] = useState(1);
  const { data: session } = useSession();
  const { data: chantiers } =
    api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(
      undefined,
      { staleTime: Number.POSITIVE_INFINITY },
    );
  const { data: territoires } = api.territoire.récupérerListe.useQuery(
    { territoireCodes: null },
    { staleTime: Number.POSITIVE_INFINITY },
  );

  const reactHookForm = useForm<UtilisateurFormInputs>({
    resolver: zodResolver(
      donneValidationInfosBaseUtilisateur(
        session!.profil,
        creationCompteArsActive,
      ),
      // il faut split des schemas en 3, la on a des if dans les schema zod s'y perd
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
    defaultValues: {
      email: utilisateur?.email,
      nom: utilisateur?.nom,
      prénom: utilisateur?.prénom,
      fonction: utilisateur?.fonction,
      service: utilisateur?.service ?? null,
      serviceAutre: utilisateur?.serviceAutre ?? null,
      profil: utilisateur?.profil,
      gestionUtilisateur: utilisateur?.gestionUtilisateur,
      saisieIndicateur: utilisateur?.saisieIndicateur,
      applicationsAccessibles: utilisateur
        ? utilisateur?.applicationsAccessibles
        : [$Enums.application_accessible.PILOTE],
      habilitations: {
        lecture: {
          chantiers: utilisateur?.habilitations.lecture.chantiers,
          périmètres: utilisateur?.habilitations.lecture.périmètres,
          territoires: utilisateur?.habilitations.lecture.territoires,
        },
        responsabilite: {
          chantiers: utilisateur?.habilitations.responsabilite.chantiers,
        },
        saisieCommentaire: {
          chantiers: utilisateur?.habilitations.saisieCommentaire.chantiers,
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

  // FIXME - il y a une race condition dans le multi select qui fait que le formulaire ne s'initialise pas
  //  avec les bons chantiers. Ici, on s'assure quel les données sont chargées avant de rendre le formulaire.
  if (chantiers == null || territoires == null) return null;

  return (
    <>
      <div className="flex">
        {etapeCourante === 1 ? (
          <Link
            aria-label="Retour à l'accueil"
            className="flex items-center gap-2 !text-primary"
            href="/admin/utilisateurs"
          >
            <Icone className="w-4 h-4" icone={ArrowLine3Icon} />
            Retour
          </Link>
        ) : (
          <button
            className="flex items-center gap-2 !text-primary border-b !border-b-primary"
            onClick={() => setEtapeCourante(1)}
            type="button"
          >
            <Icone className="w-4 h-4" icone={ArrowLine3Icon} />
            Retour
          </button>
        )}
      </div>
      <Titre baliseHtml="h1" className="fr-h1 fr-mt-4w">
        {utilisateur ? "Modifier un compte" : "Créer un compte"}
      </Titre>
      <Bloc>
        <div className="fr-px-10w fr-py-6w">
          <IndicateurDEtapes étapeCourante={etapeCourante} étapes={étapes} />
          <FormProvider {...reactHookForm}>
            <form onSubmit={reactHookForm.handleSubmit(passerAuRécapitulatif)}>
              {etapeCourante === 1 && (
                <SaisieDesInformationsUtilisateur
                  creationCompteArsActive={creationCompteArsActive}
                  estAutoriseAVoirLeSelecteurApplication={
                    estAutoriseAVoirLeSelecteurApplication
                  }
                  utilisateur={utilisateur}
                />
              )}
              {etapeCourante === 2 && (
                <RécapitulatifUtilisateur
                  auClicBoutonRetourCallback={() => setEtapeCourante(1)}
                  utilisateurExistant={Boolean(utilisateur)}
                />
              )}
            </form>
          </FormProvider>
        </div>
      </Bloc>
    </>
  );
};

export default UtilisateurFormulaire;
