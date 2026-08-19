export const MAILLES = ["NAT", "REG", "DEPT"] as const;
export type Maille = (typeof MAILLES)[number];
