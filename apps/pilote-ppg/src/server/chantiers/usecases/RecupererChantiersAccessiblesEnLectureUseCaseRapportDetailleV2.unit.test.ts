import RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2 from "@/server/chantiers/usecases/RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { TerritoireRepository } from "@/server/chantiers/domain/ports/TerritoireRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { buildTestSession } from "@/server/rapport-detaille/testSession";

function buildUseCase() {
  const récupérerLesEntréesDeTousLesChantiersHabilités = vi.fn<
    ChantierRepository["récupérerLesEntréesDeTousLesChantiersHabilités"]
  >(async () => []);
  const useCase =
    new RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2({
      chantierRepository: {
        récupérerLesEntréesDeTousLesChantiersHabilités,
      } as Partial<ChantierRepository> as ChantierRepository,
      territoireRepository: {
        récupérerTousNew: async () => [],
      } as Partial<TerritoireRepository> as TerritoireRepository,
      utilisateurRepository: {
        recupererParIds: async () => new Map(),
      } as Partial<UtilisateurRepository> as UtilisateurRepository,
    });
  return { useCase, récupérerLesEntréesDeTousLesChantiersHabilités };
}

const session = buildTestSession({
  habilitations: {
    ...buildTestSession().habilitations,
    lecture: {
      ...buildTestSession().habilitations.lecture,
      chantiers: ["A", "B", "C"],
      territoires: ["NAT-FR"],
    },
  },
});

const filtres = {
  perimetres: [],
  axes: [],
  statut: ["PUBLIE" as const],
  meteos: [],
  territorialisation: [],
  estBarometre: false,
  valeurDeLaRecherche: "",
};

async function run(chantierIds?: string[]) {
  const { useCase, récupérerLesEntréesDeTousLesChantiersHabilités } =
    buildUseCase();
  await useCase.run(
    session.habilitations,
    session.profil,
    "NAT-FR",
    "nationale",
    [],
    new Map(),
    filtres,
    { id: "avancement", desc: false },
    2026,
    2026,
    chantierIds,
  );
  return récupérerLesEntréesDeTousLesChantiersHabilités.mock.calls.map(
    ([chantiersLecture]) => chantiersLecture,
  );
}

describe("RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2", () => {
  it("charge tous les chantiers accessibles en lecture", async () => {
    expect(await run()).toEqual([["A", "B", "C"]]);
  });

  it("ne charge que les chantiers demandés parmi ceux accessibles en lecture", async () => {
    expect(await run(["C", "A", "Z"])).toEqual([["A", "C"]]);
  });
});
