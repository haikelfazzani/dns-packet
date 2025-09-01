import decodeName from "./decodeName";
import { getRType, getRClass } from "../helpers";

export default function decodeQuestions(view: DataView, offset: number, QDCOUNT: number) {
  if (QDCOUNT !== 1) {
    throw new Error('This decoder supports only a single question per query.');
  }

  const questions = [];
  const { name, consumedBytes } = decodeName(view, offset);

  offset += consumedBytes;
  const rType = view.getUint16(offset);
  offset += 2;
  const rClass = view.getUint16(offset);
  offset += 2;

  questions.push({ CLASS: getRClass(rClass), NAME: name, TYPE: getRType(rType) });
  return { questions, nextOffset: offset };
}