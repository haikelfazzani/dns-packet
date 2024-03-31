export default function getOPCODE(val?: string) {
  const OPCODE = { 'QUERY': 0, 'IQUERY': 1, 'STATUS': 2, 'RESERVED': 3, 'NOTIFY': 4, 'UPDATE': 5, }
  return OPCODE[val] || 0
}