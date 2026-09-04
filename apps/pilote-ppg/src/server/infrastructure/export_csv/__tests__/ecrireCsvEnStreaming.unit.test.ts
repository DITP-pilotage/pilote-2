import { stringify } from "csv-stringify";
import { ServerResponse } from "node:http";
import { Writable } from "node:stream";
import { ecrireCsvEnStreaming } from "@/server/infrastructure/export_csv/ecrireCsvEnStreaming";

const creerStringifier = () =>
  stringify({ header: false, delimiter: ";", quoted_string: true });

const creerConsommateurBloque = () => {
  let debloquer: () => void = () => {};
  const premiereEcriture = new Promise<void>((resolve) => {
    debloquer = resolve;
  });

  const consommateur = new Writable({
    highWaterMark: 1,
    write() {
      debloquer();
    },
  });

  return { consommateur, premiereEcriture };
};

const laisserTournerLaBoucleDEvenements = () =>
  new Promise((resolve) => setTimeout(resolve, 20));

describe("ecrireCsvEnStreaming", () => {
  it("écrit toutes les lignes dans la réponse", async () => {
    // Given
    const morceaux: string[] = [];
    const consommateur = new Writable({
      write(chunk, _encoding, callback) {
        morceaux.push(chunk.toString());
        callback();
      },
    });

    // When
    await ecrireCsvEnStreaming(
      [
        ["Paris", "75"],
        ["Lyon", "69"],
      ],
      creerStringifier(),
      consommateur as unknown as ServerResponse,
    );

    // Then
    expect(morceaux.join("")).toBe('"Paris";"75"\n"Lyon";"69"\n');
  });

  it("cesse de produire des lignes tant que le client n'a pas consommé les précédentes", async () => {
    // Given
    const NOMBRE_LIGNES_DISPONIBLES = 100_000;
    let lignesProduites = 0;

    async function* lignes() {
      for (let index = 0; index < NOMBRE_LIGNES_DISPONIBLES; index++) {
        lignesProduites++;
        yield [`territoire-${index}`, "valeur"];
      }
    }

    const { consommateur, premiereEcriture } = creerConsommateurBloque();

    // When
    const ecriture = ecrireCsvEnStreaming(
      lignes(),
      creerStringifier(),
      consommateur as unknown as ServerResponse,
    );
    await premiereEcriture;
    await laisserTournerLaBoucleDEvenements();

    // Then
    expect(lignesProduites).toBeLessThan(NOMBRE_LIGNES_DISPONIBLES / 10);

    consommateur.destroy();
    await ecriture;
  });

  it("arrête la production et se termine sans erreur quand le client interrompt le téléchargement", async () => {
    // Given
    let lignesProduites = 0;

    async function* lignes() {
      for (let index = 0; index < 100_000; index++) {
        lignesProduites++;
        yield [`territoire-${index}`, "valeur"];
      }
    }

    const { consommateur, premiereEcriture } = creerConsommateurBloque();

    const ecriture = ecrireCsvEnStreaming(
      lignes(),
      creerStringifier(),
      consommateur as unknown as ServerResponse,
    );
    await premiereEcriture;

    // When
    consommateur.destroy();
    await expect(ecriture).resolves.toBeUndefined();

    // Then
    const lignesALInterruption = lignesProduites;
    await laisserTournerLaBoucleDEvenements();
    expect(lignesProduites).toBe(lignesALInterruption);
  });
});
