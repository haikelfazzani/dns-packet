export default function getQR(val?: string | number) {
  const QR = { 'QUERY': 0, 'RESPONSE': 1 }
  return typeof val === 'number' ? Object.entries(QR).find(([_, value]) => value === val)[0] : QR[val] || 0
}