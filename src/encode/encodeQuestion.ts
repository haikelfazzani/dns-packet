export default function encodeQuestion(question: { NAME: string, CLASS: number, TYPE: number }) {
  const buffer = new Uint8Array(question.NAME.length + 6);
  let offset = 0;

  question.NAME.split('.').forEach(label => {
    buffer[offset++] = label.length;
    for (let i = 0; i < label.length; i++) {
      buffer[offset++] = label.charCodeAt(i);
    }
  });

  buffer[offset++] = 0;

  const view = new DataView(buffer.buffer);
  view.setUint16(offset, question.TYPE, false);
  offset += 2;
  view.setUint16(offset, question.CLASS, false);

  return buffer
}