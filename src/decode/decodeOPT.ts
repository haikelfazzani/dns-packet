import { EDNS } from "../types";

// The OPT record re-purposes the CLASS, TTL, and RDLENGTH fields
export default function decodeOPT(view: DataView, classVal: number, ttlVal: number, rdLength: number, rdataOffset: number): EDNS {
  const udpPayloadSize = classVal;

  const extendedRCODE = (ttlVal >> 24) & 0xFF;
  const version = (ttlVal >> 16) & 0xFF;
  const flags = {
    DO: (ttlVal >> 15) & 0x1 // DNSSEC OK bit
  };

  const options = [];
  let offset = rdataOffset;
  while (offset < rdataOffset + rdLength) {
    const optionCode = view.getUint16(offset);
    offset += 2;
    const optionLength = view.getUint16(offset);
    offset += 2;
    const optionData = new Uint8Array(view.buffer, offset, optionLength);
    offset += optionLength;
    options.push({ code: optionCode, data: optionData });
  }

  return {
    udpPayloadSize,
    extendedRCODE,
    version,
    flags,
    options
  };
}