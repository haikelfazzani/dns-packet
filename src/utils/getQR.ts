export default function getQR(val?: string | number) {
  const qR = { 'QUERY': 0, 'RESPONSE': 1 }
  return typeof val === 'number' ? Object.entries(qR).find(([_, value]) => value === val)[0] : qR[val] || 0
}