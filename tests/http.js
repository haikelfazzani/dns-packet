import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';

const data = encode({
  id: 1,
  flags: {
    RD: 1,
    RA: 0
  },
  questions: [
    { CLASS: 'IN', NAME: 'www.avast.com', TYPE: 'A' }
  ]
});

(async () => {
  const rdr = await axios({
    url: 'https://secure.avastdns.com/dns-query',
    method: 'POST',
    data,
    headers: { 'Content-Type': 'application/dns-message' },
    responseType: 'arraybuffer'
  });

  console.log(decode(rdr.data));
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
