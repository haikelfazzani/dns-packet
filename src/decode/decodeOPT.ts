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
  const endOfOptions = rdataOffset + rdLength;

  while (offset < endOfOptions) {
    // Check if there are enough bytes for the option code and length
    if (offset + 4 > endOfOptions) {
      throw new Error("Malformed EDNS option header: not enough bytes left.");
    }

    const optionCode = view.getUint16(offset);
    offset += 2;
    const optionLength = view.getUint16(offset);
    offset += 2;

    // Check if there are enough bytes for the option data
    if (offset + optionLength > endOfOptions) {
      throw new Error(`Malformed EDNS option data for code ${optionCode}: length exceeds remaining bytes.`);
    }

    const optionData = new Uint8Array(view.buffer, offset, optionLength);
    offset += optionLength;
    options.push({ code: optionCode, data: optionData });
  }

  if (offset !== endOfOptions) {
    throw new Error("EDNS RDATA length mismatch: bytes remaining after decoding all options.");
  }

  return {
    udpPayloadSize,
    extendedRCODE,
    version,
    flags,
    options
  };
}