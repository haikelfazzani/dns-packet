export default function getRType(val?: string | number) {

  if (typeof val === 'string' && val.startsWith('UNKNOWN_')) return +val.replace(/\D+/g, '')

  const rType = {
    'A': 1,
    'NS': 2,
    'MD': 3,
    'MF': 4,
    'CNAME': 5,
    'SOA': 6,
    'MB': 7,
    'MG': 8,
    'MR': 9,
    'NULL': 10,
    'WKS': 11,
    'PTR': 12,
    'HINFO': 13,
    'MINFO': 14,
    'MX': 15,
    'TXT': 16,
    'RP': 17,
    'SIG': 24,
    'AAAA': 28,

    'DS': 43,
    'IPSECKEY': 45,
    'RRSIG': 46,

    'ANY': 255,
    '*': 255
  }

  if (typeof val === 'number' && !Object.values(rType).includes(val)) return 'UNKNOWN_' + val;

  return typeof val === 'number' ? Object.entries(rType).find(([_, value]) => value === val)[0] : rType[val] || 255
}
