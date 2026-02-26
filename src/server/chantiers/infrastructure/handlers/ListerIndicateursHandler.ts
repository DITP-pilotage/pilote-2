import { NextApiRequest, NextApiResponse } from "next";
import { ListerDonneesIndicateurParIndicIdUseCase } from "@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { presenterEnDonneeIndicateurContrat } from "@/server/chantiers/app/contrats/DonneeIndicateurContrat";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

export const handleListerIndicateurs = async ({
  request,
  response,
  jalonChoisi,
}: {
  request: NextApiRequest;
  response: NextApiResponse;
  jalonChoisi?: number;
}) => {
  const jalon =
    jalonChoisi ??
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );
  const listeDonneesIndicateurs =
    await new ListerDonneesIndicateurParIndicIdUseCase({
      indicateurRepository: dependencies.getChantierIndicateurRepository(),
    }).run({
      indicId: request.query.indicateurId as string,
      jalon,
    });
  response
    .status(200)
    .json(
      presenterEnDonneeIndicateurContrat(
        request.query.chantierId as string,
        listeDonneesIndicateurs,
      ),
    );
};
