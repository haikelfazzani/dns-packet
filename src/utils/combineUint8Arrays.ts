export default function combineUint8Arrays(arr1: Uint8Array, arr2: Uint8Array) {
  const combinedArray = new Uint8Array(arr1.length + arr2.length);
  combinedArray.set(arr1, 0);
  combinedArray.set(arr2, arr1.length);
  return combinedArray;
}