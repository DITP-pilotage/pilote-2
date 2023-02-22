export const objectEntries = <Obj extends Object>(object: Obj): [keyof Obj, Obj[keyof Obj]][] => {
  return Object.entries(object) as [keyof Obj, Obj[keyof Obj]][];
};
