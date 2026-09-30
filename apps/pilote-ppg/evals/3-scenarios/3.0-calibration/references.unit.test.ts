import type { Criterion, MechanicalCriterion } from "../grid";
import { GRIDS } from "../grids";
import { CALIBRATION_CASES } from "./references";

const estMecanique = (
  criterion: Criterion,
): criterion is MechanicalCriterion => criterion.kind === "mechanical";

describe("références de calibration", () => {
  const references = CALIBRATION_CASES.filter(
    (testCase) => testCase.broken === null,
  );

  test.each(
    references.map((reference) => [reference.family, reference] as const),
  )("la référence %s passe tous ses critères mécaniques", (_family, reference) => {
    // When
    const echecs = GRIDS[reference.family].criteria
      .filter(estMecanique)
      .filter((criterion) => criterion.applicable?.(reference.evidence) ?? true)
      .map((criterion) => ({
        id: criterion.id,
        result: criterion.check(reference.evidence),
      }))
      .filter(({ result }) => !result.ok);

    // Then
    expect(echecs).toEqual([]);
  });

  test("chaque mutant casse un critère jugé de sa grille", () => {
    // When
    const orphelins = CALIBRATION_CASES.filter(
      (testCase) => testCase.broken !== null,
    )
      .filter(
        (testCase) =>
          !GRIDS[testCase.family].criteria.some(
            (criterion) =>
              criterion.kind === "judged" && criterion.id === testCase.broken,
          ),
      )
      .map((testCase) => `${testCase.family} · ${testCase.label}`);

    // Then
    expect(orphelins).toEqual([]);
  });
});
