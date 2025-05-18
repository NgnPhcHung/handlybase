const delimiterRegex = /[_\-]|(?<=[a-z])(?=[A-Z])/;

export const toCapitalize = (input: string) => {
  const result = input.split(delimiterRegex);
  if (result.length === 1) {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
  return result.reduce((s, c) => {
    return s + (c.charAt(0).toUpperCase() + c.slice(1));
  });
};
