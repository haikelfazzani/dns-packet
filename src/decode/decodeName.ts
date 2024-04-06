export default function decodeName(data: DataView, start: number, end: number) {
  let name = "";
  for (let i = start; i < end; ++i) {
    const nbc = data.getUint8(i);
    if ((nbc < 123 && nbc > 96) || (nbc < 58 && nbc > 46) || [45].includes(nbc)) {
      const c = String.fromCharCode(nbc);
      name += c;
    }
    if (nbc === 3) name += '.'
  }
  return name;
}