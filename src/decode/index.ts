import { DNSResponse, EDNS } from "../types";
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

  const { questions, nextOffset: questionOffset } = decodeQuestions(view, offset, QDCOUNT);
  offset = questionOffset;

  let edns: EDNS | undefined = undefined;

  const answerResult = decodeRR(view, offset, ANCOUNT);
  const answers = answerResult.rrdata;
  if (answerResult.edns) edns = answerResult.edns; // Capture EDNS if present
  offset = answerResult.nextOffset;

  const authorityResult = decodeRR(view, offset, NSCOUNT);
  const authorities = authorityResult.rrdata;
  if (authorityResult.edns) edns = authorityResult.edns; // Capture EDNS if present
  offset = authorityResult.nextOffset;
  
  const additionalResult = decodeRR(view, offset, ARCOUNT);
  const additionals = additionalResult.rrdata;
  if (additionalResult.edns) edns = additionalResult.edns; // Capture EDNS if present
  offset = additionalResult.nextOffset;
  
  return {
    id,
    flags,
    questions,
    answers,
    authorities,
    additionals,
    edns: edns || undefined,
  };
}