import decodeName from "./decodeName";
import { getRType, getRClass } from "../helpers";

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

  return { questions, nextOffset: offset }
}