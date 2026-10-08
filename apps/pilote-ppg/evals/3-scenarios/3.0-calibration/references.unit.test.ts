import type { Criterion, MechanicalCriterion } from "../criterion";
import { CALIBRATION_CASES, MECHANICAL_MUTANTS } from "./references";

describe("mutants mécaniques", () => {
  test.each(
    MECHANICAL_MUTANTS.map((mutant) => [mutant.label, mutant] as const),
  )("« %s » échoue son critère, et lui seul", (_label, mutant) => {
    // When
    const echecs = mutant.suite.criteria
      .filter(estMecanique)
      .filter((criterion) => criterion.applicable?.(mutant.evidence) ?? true)
      .filter((criterion) => !criterion.check(mutant.evidence).ok)
      .map((criterion) => criterion.id);

    // Then
    expect(echecs).toEqual([mutant.broken]);
  });
});

const estMecanique = (criterion: Criterion): criterion is MechanicalCriterion =>
  criterion.kind === "mechanical";

describe("références de calibration", () => {
  const references = CALIBRATION_CASES.filter(
    (testCase) => testCase.broken === null,
  );

  test.each(
    references.map((reference) => [reference.suite.name, reference] as const),
  )(
    "la référence %s passe tous ses critères mécaniques",
    (_suite, reference) => {
      // When
      const echecs = reference.suite.criteria
        .filter(estMecanique)
        .filter(
          (criterion) => criterion.applicable?.(reference.evidence) ?? true,
        )
        .map((criterion) => ({
          id: criterion.id,
          result: criterion.check(reference.evidence),
        }))
        .filter(({ result }) => !result.ok);

      // Then
      expect(echecs).toEqual([]);
    },
  );

  test("chaque mutant casse un critère jugé de sa suite", () => {
    // When
    const orphelins = CALIBRATION_CASES.filter(
      (testCase) => testCase.broken !== null,
    )
      .filter(
        (testCase) =>
          !testCase.suite.criteria.some(
            (criterion) =>
              criterion.kind === "judged" && criterion.id === testCase.broken,
          ),
      )
      .map((testCase) => `${testCase.suite.name} · ${testCase.label}`);

    // Then
    expect(orphelins).toEqual([]);
  });
});
