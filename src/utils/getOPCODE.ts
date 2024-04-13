export default function getOPCODE(val?: string | number) {
  const oPCODE = { 'QUERY': 0, 'IQUERY': 1, 'STATUS': 2, 'RESERVED': 3, 'NOTIFY': 4, 'UPDATE': 5, }
  return typeof val === 'number' ? Object.entries(oPCODE).find(([_, value]) => value === val)[0] : oPCODE[val] || 1
}