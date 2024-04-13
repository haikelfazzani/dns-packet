import { encode, decode } from '../dist/index.mjs';
import axios from 'axios';

const pk = {
  id: 153,
  questions: [
    { CLASS: 'IN', NAME: 'google.com', TYPE: 'AAAA' }
  ]
};

(async () => {
  const rdr = await axios({
    url: 'https://cloudflare-dns.com/dns-query',
    method: 'POST',
    data: encode(pk),
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
