export const emptyMap = [
  ["", "", ""], // 1st row
  ["", "", ""], // 2nd row
  ["", "", ""], // 3rd row
];

export const copyArray = (original) => {
  const copy = original.map((arr) => {
    return arr.slice();
  });
  
  return copy;
};
