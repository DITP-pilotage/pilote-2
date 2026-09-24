import { OPTIONS_FORMULAIRE } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";

describe("OPTIONS_FORMULAIRE", () => {
  it("plafonne la taille d'un fichier importé et n'en accepte qu'un", () => {
    expect({
      maxFileSize: OPTIONS_FORMULAIRE.maxFileSize,
      maxFiles: OPTIONS_FORMULAIRE.maxFiles,
      multiples: OPTIONS_FORMULAIRE.multiples,
    }).toEqual({
      maxFileSize: 25 * 1024 * 1024,
      maxFiles: 1,
      multiples: false,
    });
  });
});
