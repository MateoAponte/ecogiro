export const validateType = (filter: string | number): boolean => {
  if (typeof filter === 'number') return true;
  return false;
};
