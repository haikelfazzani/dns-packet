import getRClass from "../utils/getRClass";
import getRType from "../utils/getRType";
import decodeName from "./decodeName";

export default function decodeQuestions(view: DataView, offset: number, QDCOUNT: number) {
  const questions = [];

  for (let i = 0; i < QDCOUNT; i++) {
    const { name, consumedBytes } = decodeName(view, offset);
    offset += consumedBytes;

    const rType = view.getUint16(offset);
    offset += 2;
    const rClass = view.getUint16(offset);
    offset += 2;

    questions.push({ CLASS: getRClass(rClass), NAME: name, TYPE: getRType(rType) });
  }

  return { questions, cbq: offset }
}