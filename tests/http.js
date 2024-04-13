import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';

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

  const hexString = '<00 00 01 00 00 01 00 00 00 00 00 01 06 61 70 69 2d 76 32 0a 73 6f 75 6e 64 63 6c 6f 75 64 03 63 6f 6d 00 00 01 00 01 00 00 29 10 00 00 00 00 00 00 4e 00 0c 00 4a 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00';
  const hexArray = hexString.split(' ').map(hex => parseInt(hex, 16));
  const buffer = Buffer.from(hexArray);
  // const arrayBuffer = new Uint8Array(buffer).buffer;


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
