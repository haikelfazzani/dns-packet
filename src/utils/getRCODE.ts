export default function getRCODE(val?: string | number) {
  const RCODE = {
    'NOERROR': 0,
    'FORMERR': 1,
    'SERVFAIL': 2,
    'NXDOMAIN': 3,
    'NOTIMP': 4,
    'REFUSED': 5,
    'YXDOMAIN': 6,
    'YXRRSET': 7,
    'NXRRSET': 8,
    'NOTAUTH': 9,
    'NOTZONE': 10,
    'RCODE_11': 11,
    'RCODE_12': 12,
    'RCODE_13': 13,
    'RCODE_14': 14,
    'RCODE_15': 15,
  }
  return typeof val === 'number' ? Object.entries(RCODE).find(([_, value]) => value === val)[0] : RCODE[val] || 0
}