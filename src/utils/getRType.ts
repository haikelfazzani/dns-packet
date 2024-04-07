export default function getRType(val?: string | number) {

  if (typeof val === 'string' && val.startsWith('UNKNOWN_')) return +val.replace(/\D+/g,'')

  const RType = {
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
    'AAAA': 28,
    'IPSECKEY': 45,
  }

  if (typeof val === 'number' && !Object.values(RType).includes(val)) return 'UNKNOWN_' + val;

  return typeof val === 'number' ? Object.entries(RType).find(([_, value]) => value === val)[0] : RType[val] || 1
}