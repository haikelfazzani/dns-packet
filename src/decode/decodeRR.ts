import getRClass from "../utils/getRClass";
import getRType from "../utils/getRType";
import decodeName from "./decodeName";
import decodeRDATA from "./decodeRDATA";

export default function decodeRR(view: DataView, offset: number, COUNT: number) {
  const rrdata = [];

  for (let i = 0; i < COUNT; i++) {

    const { name, consumedBytes } = decodeName(view, offset)
    offset += consumedBytes;
    
    if (name.length < 2) return { rrdata, cbrr: offset }
    
    const rType = view.getUint16(offset)
    offset += 2;

    const rClass = view.getUint16(offset)
    offset += 2;

    const ttl = view.getUint32(offset)
    offset += 4;

    const RDLENGTH = view.getUint16(offset)
    offset += 2;

    const RDATA = decodeRDATA(view, offset, RDLENGTH, rType);
    offset += RDLENGTH;

    rrdata.push({ CLASS: getRClass(rClass), TYPE: getRType(rType), TTL: ttl, RDLENGTH, RDATA, NAME: name });
  }

  return { rrdata, cbrr: offset }
}
