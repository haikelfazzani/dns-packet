import { textDecoder } from "../constants";

export default function decodeName(view: DataView, offset: number) {
  const initialOffset = offset;
  let currentOffset = offset;
  const parts: string[] = [];
  let consumedBytes = 0;
  let jumped = false;
  let pointerCount = 0; // Prevent infinite loops

  while (true) {
    if (pointerCount > 10) { // Arbitrary limit to prevent malicious loops
      throw new Error('Cannot decode name (pointer loop detected)');
    }
    if (currentOffset >= view.byteLength) {
      throw new Error('Cannot decode name (buffer overflow)');
    }

    const len = view.getUint8(currentOffset);

    // Check for pointer
    if ((len & 0xc0) === 0xc0) {
      if (currentOffset + 1 >= view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow while reading pointer)');
      }
      const pointerValue = view.getUint16(currentOffset, false) & 0x3fff; // Read big-endian

      if (!jumped) {
        consumedBytes = (currentOffset + 2) - initialOffset; // The pointer consumes 2 bytes
        jumped = true;
      }
      currentOffset = pointerValue;
      pointerCount++;
      continue;
    }

    // Check for null terminator
    if (len === 0) {
      if (!jumped) {
        consumedBytes = (currentOffset + 1) - initialOffset;
      }
      break;
    }

    // Regular label
    if (len > 0) {
      if (currentOffset + 1 + len > view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow for label)');
      }

      const labelBytes = new Uint8Array(view.buffer, currentOffset + 1, len);
      const label = textDecoder.decode(labelBytes);

      parts.push(label);
      currentOffset += 1 + len;
    } else {
      throw new Error(`Cannot decode name (invalid label type: 0x${len.toString(16)})`);
    }
  }

  return {
    name: parts.join('.'),
    consumedBytes: consumedBytes,
  };
}