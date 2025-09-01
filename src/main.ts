import encode from './encode'
import decode from './decode/index';

export {
  // function encode(packet: DNSQuery): Uint8Array
  encode,
  // function decode(buffer: ArrayBuffer | Uint8Array | Buffer): DNSResponse
  decode
}