export default function decodeName(view: DataView, offset: number, { mail = false } = {}) {
  if (!offset) offset = 0;

  const list = [];
  let oldOffset = offset;
  let totalLength = 0;
  let consumedBytes = 0;
  let jumped = false;

  while (true) {
    if (offset >= view.byteLength) {
      throw new Error('Cannot decode name (buffer overflow)');
    }
    const len = view.getUint8(offset++);
    consumedBytes += jumped ? 0 : 1;

    if (len === 0) {
      break;
    } else if ((len & 0xc0) === 0) {
      
      
      if (offset + len > view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow)');
      }
      totalLength += len + 1;
      if (totalLength > 254) {
        throw new Error('Cannot decode name (name too long)');
      }
      let label = '';
      for (let i = 0; i < len; i++) {
        label += String.fromCharCode(view.getUint8(offset + i));
      }
      if (mail) {
        label = label.replace(/\./g, '\\.');
      }
      list.push(label);
      offset += len;
      consumedBytes += jumped ? 0 : len;
    } else if ((len & 0xc0) === 0xc0) {
      // console.log('Len ======+> ', len);

      if (offset + 1 > view.byteLength) {
        throw new Error('Cannot decode name (buffer overflow)');
      }
      const jumpOffset = view.getUint16(offset - 1) - 0xc000;
      if (jumpOffset >= oldOffset) {
        // Allow only pointers to prior data. RFC 1035, section 4.1.4 states:
        // "[...] an entire domain name or a list of labels at the end of a domain name
        // is replaced with a pointer to a prior occurrence (sic) of the same name."
        throw new Error('Cannot decode name (bad pointer)');
      }
      offset = jumpOffset;
      oldOffset = jumpOffset;
      consumedBytes += jumped ? 0 : 1;
      jumped = true;
    } else {
      throw new Error('Cannot decode name (bad label)');
    }
  }

  console.log('consumedBytes ', consumedBytes)
  return { name: list.length === 0 ? '.' : list.join('.'), consumedBytes };
}