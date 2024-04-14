export default function getRType(val?: string | number) {
  if (typeof val === 'string') val = val.toUpperCase();
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

    'SRV': 33,
    'CERT': 37,

    'OPT': 41,
    'APL': 42,
    'DS': 43,
    'SSHFP': 44,
    'IPSECKEY': 45,
    'RRSIG': 46,
    'NSEC': 47,
    'DNSKEY': 48,
    'DHCID': 49,

    'NSEC3': 50,
    'NSEC3PARAM': 51,
    'TLSA': 52,
    'HIP': 55,
    'CDS':59,

    'TKEY': 249,
    'IXFR': 251,
    'AXFR': 252,
    'ANY': 255,
    '*': 255
  }

  if (typeof val === 'number' && !Object.values(rType).includes(val)) return 'UNKNOWN_' + val;

  return typeof val === 'number'
    ? Object.entries(rType).find(([_, value]) => value === val)[0]
    : rType[val] || 255
}
