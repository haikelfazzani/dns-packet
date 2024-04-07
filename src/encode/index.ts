import { DNSQuery } from "../types";
import combineUint8Arrays from "../utils/combineUint8Arrays";
import encodeQuestion from "./encodeQuestion";
import formatQuery from "./formatQuery";

export default function encode(packet: DNSQuery) {
  const query = formatQuery(packet);

  const question = query.questions[0];
  if(!question) throw new Error('No question found');

  const header = new Uint8Array(12);
  const view = new DataView(header.buffer);

  view.setUint16(0, query.id);

  // OPCODE = 4 bits
  // RCODE = 4 bits
  // Z = 3 bits
  view.setUint8(2, (query.flags.QR << 7) | (query.flags.Opcode << 3) | (query.flags.AA << 2) | (query.flags.TC << 1) | query.flags.RD);
  view.setUint8(3, (query.flags.RA << 7) | (query.flags.Z << 6) | query.flags.RCODE);

  // QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT
  view.setUint16(4, 1);
  view.setUint16(6, 0);
  view.setUint16(8, 0);
  view.setUint16(10, 0);  

  return combineUint8Arrays(header, encodeQuestion(question))
}