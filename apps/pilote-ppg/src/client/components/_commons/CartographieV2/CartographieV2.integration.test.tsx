import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";

const codesDesTerritoiresHachurés = (container: HTMLElement) =>
  [...container.querySelectorAll("clipPath")].map((clipPath) =>
    clipPath.id.replace(/^.*?-(?=(NAT|REG|DEPT)-)/, ""),
  );

test("hachure les territoires non applicables de la carte", () => {
  const { container } = render(
    <CartographieV2
      donnees={{
        "REG-53": { libelle: "Bretagne", remplissage: REMPLISSAGE_HACHURE },
        "REG-11": { libelle: "Île-de-France", remplissage: "#4a4ac4" },
      }}
      maille="regionale"
    />,
  );

  expect(codesDesTerritoiresHachurés(container)).toEqual(["REG-53"]);
});

test("ne hachure pas les territoires absents de la carte", () => {
  const { container } = render(
    <CartographieV2
      donnees={{
        "NAT-FR": { libelle: "France", remplissage: REMPLISSAGE_HACHURE },
        "DEPT-29": { libelle: "Finistère", remplissage: REMPLISSAGE_HACHURE },
        "REG-11": { libelle: "Île-de-France", remplissage: "#4a4ac4" },
      }}
      maille="regionale"
    />,
  );

  expect(codesDesTerritoiresHachurés(container)).toEqual([]);
});
