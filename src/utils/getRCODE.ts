export default function getRCODE(val?: string | number) {
  const RCODE = { 'NOERROR': 0, 'FORMERR': 1, 'SERVFAIL': 2, 'NXDOMAIN': 3, 'NOTIMP': 4, 'REFUSED': 5, }
  return typeof val === 'number' ? Object.entries(RCODE).find(([key, value]) => value === val)[0] : RCODE[val] || 0
}