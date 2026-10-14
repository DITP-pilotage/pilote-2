import { FunctionComponent } from "react";
import { Button } from "@/components/shared/Button";
import Link from "next/link";
import { DescriptionEtapes } from "./DescriptionEtapes/DescriptionEtapes";

export const PageCréerUtilisateurAide: FunctionComponent = () => {
  const etapes = [
    {
      titre: "Saisie des informations de l'utilisateur",
      texte:
        "Remplissez le formulaire de demande de compte en cliquant sur le bouton “Créer un compte” ci-dessous.",
    },
    {
      titre: "Validation du compte",
      texte:
        "Une fois le compte validé par vos soins, l'utilisateur reçoit automatiquement un mail. Vous n'avez pas d'autres actions à effectuer.",
    },
    {
      titre: "Gestion du comptes",
      texte:
        "Vous pouvez modifier et désactiver en continu les comptes des utilisateurs de votre territoire.",
    },
  ];

  return (
    <div className="bg-dsfr-alt-blue-france">
      <main className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] py-12">
        <h3 className="mb-0 flex justify-center items-center">
          Coordinateurs PILOTE
        </h3>
        <h3 className="flex justify-center items-center">
          Créer un compte pour un utilisateur sur votre territoire
        </h3>
        <p className="text-sm print:text-base">
          PILOTE est un outil réservé aux agents de l'Etat habilités à
          travailler sur les Politiques Prioritaires du Gouvernement. Seuls ces
          agents peuvent y avoir accès. Au niveau territorial, les coordinateurs
          PILOTE sont seuls habilités à créer des comptes pour des utilisateurs
          sur leurs territoires.
        </p>
        <p className="font-bold text-sm print:text-base">
          Pour créer un compte PILOTE pour un utilisateur sur votre territoire,
          il vous est demandé de prendre connaissance des règles ci-dessous puis
          de suivre les étapes indiquées.
        </p>
        <div className="mt-12 p-4 mb-12 bg-white">
          <h3>Règles de gestion des comptes</h3>
          <h5 className="mb-2">Responsabilités du Coordinateur PILOTE</h5>
          <p className="text-sm print:text-base">
            En tant que coordinateur, il vous est demandé de gérer activement
            les comptes pour votre territoire. Vous disposez de droits de
            création, modification et suppression. Nous vous encourageons
            vivement à exercer cette responsabilité avec discernement. Les
            comptes utilisateurs doivent être créés uniquement pour les
            individus ayant des responsabilités directes en lien avec l'outil et
            les données publiées. Veillez à ce que les comptes ne soient pas
            utilisés de manière abusive ou superflue. La DITP effectuera
            régulièrement un suivi de la gestion des comptes pour chaque
            coordinateur
          </p>
          <h5 className="mb-2">Confidentialité des données</h5>
          <p className="text-sm print:text-base">
            Il est important de garder à l'esprit que les données publiées sur
            cet outil sont protégées et ne sont pas destinées au grand public.
            Par conséquent, veuillez accorder une attention particulière à la
            confidentialité et à la sécurité des informations partagées.{" "}
            <b>
              La DITP se réserve le droit de modifier ou de désactiver des
              comptes qui ne respecteraient pas ces règles d'utilisation.
            </b>
          </p>
          <h5 className="mb-2">Prérequis à la création d'un compte</h5>
          <p className="text-sm print:text-base mb-0">
            Les comptes doivent obligatoirement être associés à une adresse de
            messagerie électronique professionnelle valide de l'Etat (.gouv.fr).
            Les comptes rattachés à une adresse de messagerie générique (non
            nominative) ne sont également pas autorisés. En cas de questions ou
            de demandes particulières, le support de la DITP est à votre
            disposition pour vous aider.
          </p>
        </div>
        <div className="bg-white p-4">
          <div className="flex justify-center items-center">
            <DescriptionEtapes etapes={etapes} />
          </div>
        </div>
        <div className="flex justify-center items-center sticky bottom-px z-10 w-full py-5 bg-white/90">
          <Button asChild variant="primary">
            <Link href="/admin/utilisateur/creer" title="Créer un compte">
              Créer un compte
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};
