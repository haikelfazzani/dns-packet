export default function getRClass(val?: string | number) {
  const RClass = {
    'IN': 1,
    'CS': 2,
    'CH': 3,
    'HS': 4,
    'UNKNOWN_15': 15,
    'ANY': 255
  }
  return typeof val === 'number' ? Object.entries(RClass).find(([_, value]) => value === val)[0] : RClass[val] || 1
}