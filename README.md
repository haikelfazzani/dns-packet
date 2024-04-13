# DNS Packet

Node/Browser module for encoding and decoding DNS packet based on rfc 1035

## Usage

```js
import { decode, encode } from "dnspacket-ts";
import axios from 'axios';

const query: DNSQuery = {
  id: 153,
  flags: {
    RD: 1,
  },
  questions: [
    { CLASS: "IN", NAME: "google.com", TYPE: "AAAA" },
  ],
};

const data = encode(query);

(async () => {
  const rdr = await axios({
    url: 'https://cloudflare-dns.com/dns-query',
    method: 'POST',
    data,
    headers: { 'Content-Type': 'application/dns-message' },
    responseType: 'arraybuffer'
  });

  console.log(decode(rdr.data));
})();
```

## Ressouces

- [rfc1035](https://www.rfc-editor.org/rfc/rfc1035)
- [rfc3597](https://datatracker.ietf.org/doc/html/rfc3597)
