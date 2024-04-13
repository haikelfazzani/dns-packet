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

  const hexString = '<00 00 81 80 00 01 00 01 00 00 00 01 03 77 77 77 07 67 73 74 61 74 69 63 03 63 6f 6d 00 00 01 00 01 c0 0c 00 01 00 01 00 00 00 88 00 04 8e fa b8 e3 00';
  const hexArray = hexString.split(' ').map(hex => parseInt(hex, 16));
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
