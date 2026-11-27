import { parseEnvironnement } from "@/client/analytics/analytics";

describe("parseEnvironnement", () => {
  it.each(["dev", "ppd", "prod"])("accepte %s", (raw) => {
    expect(parseEnvironnement(raw)).toBe(raw);
  });

  it.each([undefined, "", "TBD", "local", "preprod", "production", "DEV"])(
    "ignore %s",
    (raw) => {
      expect(parseEnvironnement(raw)).toBeUndefined();
    },
  );
});
