export default function getRType(val?: string) {
  const RType = { 'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'PTR': 12, 'MINFO': 14, 'MX': 15, 'TXT': 16 }
  return RType[val] || 1
}