export default function decodeName(view: DataView, offset: number, { mail = false } = {}) {
  const initialOffset = offset;
  let currentOffset = offset;
  const parts: string[] = [];
  let nameLength = 0;
  let consumedBytes = 0;

  // Track visited offsets to prevent pointer loops
  const visitedOffsets = new Set<number>();
  let jumped = false;

  while (true) {
    if (visitedOffsets.has(currentOffset)) {
      throw new Error('Cannot decode name (pointer loop detected)');
    }
    if (currentOffset >= view.byteLength) {
      throw new Error('Cannot decode name (buffer overflow)');
    }
    visitedOffsets.add(currentOffset);

    const len = view.getUint8(currentOffset);
    currentOffset += 1;

    // Check if we've reached a null label or a pointer
    if ((len & 0xc0) === 0xc0) {
      // Pointer
      if (currentOffset >= view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow)');
      }
      const pointerValue = view.getUint16(currentOffset - 1) & 0x3fff;

      // RFC 1035: Pointers MUST be within the message
      if (pointerValue >= view.byteLength) {
        throw new Error('Cannot decode name (pointer outside message boundary)');
      }

      // RFC 1035: Pointers MUST point to a prior location
      if (pointerValue >= initialOffset) {
        throw new Error('Cannot decode name (forward pointer not allowed)');
      }

      if (!jumped) {
        consumedBytes = (currentOffset + 1) - initialOffset; // The pointer consumes 2 bytes
        jumped = true;
      }
      currentOffset = pointerValue;
      continue;
    } else if (len === 0) {
      // End of name
      if (!jumped) {
        consumedBytes = currentOffset - initialOffset;
      }
      break;
    } else if (len > 0) {
      // Regular label
      if (len > 63) {
        throw new Error(`Cannot decode name (invalid label length: ${len})`);
      }
      if (currentOffset + len > view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow)');
      }

      nameLength += len + 1; // Add label length + 1 for the dot
      if (nameLength > 254) { // RFC 2181: total name length max 255 octets (including null)
        throw new Error('Cannot decode name (name too long)');
      }

      const labelBytes = new Uint8Array(view.buffer, currentOffset, len);
      let label = '';
      for (let i = 0; i < len; i++) {
        const charCode = labelBytes[i];
        if (charCode === 0) {
          throw new Error('Cannot decode name (null byte in label)');
        }
        label += String.fromCharCode(charCode);
      }

      if (mail) {
        label = label.replace(/\./g, '\\.');
      }
      parts.push(label);
      currentOffset += len;
    } else {
      throw new Error(`Cannot decode name (invalid label type: 0x${len.toString(16)})`);
    }
  }

  return {
    name: parts.length === 0 ? '.' : parts.join('.'),
    consumedBytes: consumedBytes
  };
}