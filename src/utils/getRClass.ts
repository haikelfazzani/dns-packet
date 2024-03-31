export default function getRClass(val?: string) {
  const RClass = { 'IN': 1, 'CS': 2, 'CH': 3, 'HS': 4 }
  return RClass[val] || 1
}