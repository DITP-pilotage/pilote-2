import { sameValues } from "@/client/utils/arrays";

describe("sameValues", () => {
  it("considère deux listes identiques à l'ordre près comme égales", () => {
    expect(sameValues(["a", "b"], ["b", "a"])).toBe(true);
  });

  it("distingue deux listes de longueurs ou de contenus différents", () => {
    expect(sameValues(["a"], ["a", "b"])).toBe(false);
    expect(sameValues(["a", "b"], ["a", "c"])).toBe(false);
  });
});
