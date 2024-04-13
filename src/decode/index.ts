import { DNSResponse } from "../types";
import decodeRR from "./decodeRR";
import decodeQuestions from "./decodeQuestions";
import decodeFlags from "./decodeFlags";

export default function decode(buffer: ArrayBuffer | Uint8Array | Buffer): DNSResponse {

  const data = buffer instanceof Buffer ? new Uint8Array(buffer).buffer : buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
  const view = new DataView(data);

  const id = view.getUint16(0);
  const flagsVal = view.getUint16(2);

  const QDCOUNT = view.getUint16(4);
  const ANCOUNT = view.getUint16(6);
  const NSCOUNT = view.getUint16(8);
  const ARCOUNT = view.getUint16(10);

  const flags = decodeFlags(flagsVal);

  let offset = 12;

  // decode questions
  const { questions, cbq } = decodeQuestions(view, offset, QDCOUNT);

  if (flags.QR === 'QUERY') return { id, flags, questions, answers: [], authorities: [], additionals: [] }

  offset = cbq;

  // decode answers
  const { rrdata: answers, cbrr } = decodeRR(view, offset, ANCOUNT);
  offset = cbrr;

  // decode authorities
  const { rrdata: authorities, cbrr: cbau } = decodeRR(view, offset, NSCOUNT);
  offset = cbau;

  // decode additionals
  const { rrdata: additionals, cbrr: cbad } = decodeRR(view, offset, ARCOUNT);
  offset = cbad;

  return {
    id,
    flags,
    questions,
    answers,
    authorities,
    additionals,
  };
}
