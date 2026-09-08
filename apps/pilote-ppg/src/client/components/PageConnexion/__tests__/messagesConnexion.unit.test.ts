import { messageDeConnexion } from "@/client/components/PageConnexion/messagesConnexion";

describe("messageDeConnexion", () => {
  it("ne renvoie aucun message en l'absence de motif et d'erreur", () => {
    expect(messageDeConnexion({ motif: null, error: null })).toBeNull();
  });

  it("explique qu'aucun compte PILOTE ne correspond", () => {
    expect(
      messageDeConnexion({ motif: "compte_inconnu", error: null }),
    ).toContain("aucun compte PILOTE");
  });

  it("explique qu'un compte est désactivé", () => {
    expect(
      messageDeConnexion({ motif: "compte_desactive", error: null }),
    ).toContain("désactivé");
  });

  it("explique qu'aucune adresse électronique n'a été transmise", () => {
    expect(
      messageDeConnexion({ motif: "email_absent", error: null }),
    ).toContain("adresse électronique");
  });

  it("traite une erreur next-auth générique", () => {
    expect(
      messageDeConnexion({ motif: null, error: "Configuration" }),
    ).toContain("connexion n'a pas abouti");
  });

  it("ignore un motif inconnu plutôt que d'afficher une valeur brute", () => {
    expect(
      messageDeConnexion({ motif: "n_importe_quoi", error: null }),
    ).toContain("connexion n'a pas abouti");
  });
});
