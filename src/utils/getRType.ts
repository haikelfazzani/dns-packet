export default function getRType(val?: string | number) {
  const RType = {
    'A': 1,
    'NS': 2,
    'CNAME': 5,
    'SOA': 6,
    'PTR': 12,
    'MINFO': 14,
    'MX': 15,
    'TXT': 16,
    'AAAA': 28,
    'IPSECKEY': 45,
  }
  return typeof val === 'number' ? Object.entries(RType).find(([_, value]) => value === val)[0] : RType[val] || 1
}