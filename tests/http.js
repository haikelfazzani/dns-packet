import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';
import dnsPacket from 'dns-packet'

const pk = {
  id: 0,
  questions: [
    { CLASS: 'IN', NAME: 'google.com', TYPE: 'A' }
  ]
};

(async () => {
  // const rdr = await axios({
  //   url: 'https://cloudflare-dns.com/dns-query',
  //   method: 'POST',
  //   data: encode(pk),
  //   headers: { 'Content-Type': 'application/dns-message' },
  //   responseType: 'arraybuffer'
  // });

  const bufferOverflow = '<00 00 81 80 00 01 00 01 00 01 00 01 06 61 70 69 2d 76 32 0a 73 6f 75 6e 64 63 6c 6f 75 64 03 63 6f 6d 00 00 41 00 01 c0 0c 00 05 00 01 00 00 16 8b 00 1e 0d 64 65 7a 79 6b 74 70 70 32 35 76 79 38 0a 63 6c 6f 75 64 66 72 6f 6e 74 03 6e 65 74 00 c0 33 00 06 00 01 00 00 00 3b 00 42 06 6e 73 2d 32 30 32';

const hexString = '<00 00 81 80 00 01 00 02 00 00 00 01 08 63 6c 69 65 6e 74 73 34 06 67 6f 6f 67 6c 65 03 63 6f 6d 00 00 01 00 01 c0 0c 00 05 00 01 00 00 00 33 00 0c 07 63 6c 69 65 6e 74 73 01 6c c0 15 c0 31 00 01 00 01 00 00 00 33 00 04 8e fa b8 ee 00 00 29 04 d0 00 00 00 00 01 7c 00 0c 01 78 00 00 00 00 00 00 00 00';

  const hexArray = bufferOverflow.split(' ').map(hex => parseInt(hex, 16));
  const buffer = Buffer.from(hexArray);
  // const arrayBuffer = new Uint8Array(buffer).buffer;

  // dnsPacket.decode(hexArray)
  console.log(buffer);
  console.log(decode(buffer));
})();

// (async () => {
//   const rdr = await fetch('https://cloudflare-dns.com/dns-query', {
//     body: encode(pk),
//     method: 'POST',
//     headers: { 'Content-Type': 'application/dns-message' },
//   });

//   const resp = await rdr.arrayBuffer();

//   console.log(decode(resp));
// })();
