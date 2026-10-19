const filterDuplicatesCallback = (
  value: string | undefined,
  index: number,
  values: (string | undefined)[],
) => value && index === values.indexOf(value);

module.exports = filterDuplicatesCallback;
