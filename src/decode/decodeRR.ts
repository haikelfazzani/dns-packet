import { getRType, getRClass } from "../helpers";
import decodeName from "./decodeName";
import decodeRDATA from "./decodeRDATA";
import decodeOPT from "./decodeOPT";

export default function decodeRR(view: DataView, offset: number, COUNT: number) {
  const rrdata = [];
  let edns = null;

  for (let i = 0; i < COUNT; i++) {
    const { name, consumedBytes } = decodeName(view, offset);
    offset += consumedBytes;

    const rType = view.getUint16(offset);
    offset += 2;

    const rClass = view.getUint16(offset);
    offset += 2;

    const ttl = view.getUint32(offset);
    offset += 4;

    const RDLENGTH = view.getUint16(offset);
    offset += 2;

    // Special handling for EDNS(0) OPT records
    if (rType === 41) {
      edns = decodeOPT(view, rClass, ttl, RDLENGTH, offset);
    } else {
      const { data: RDATA, consumedBytes: rdataConsumedBytes } = decodeRDATA(view, offset, RDLENGTH, rType);
      rrdata.push({ CLASS: getRClass(rClass), TYPE: getRType(rType), TTL: ttl, RDLENGTH, RDATA, NAME: name });
      offset += rdataConsumedBytes;
    }
  }

  return { rrdata, edns, nextOffset: offset };
}