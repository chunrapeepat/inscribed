export const copy = (obj: object) => {
  return JSON.parse(JSON.stringify(obj));
};
