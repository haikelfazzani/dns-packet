import { createSocket, } from 'dgram'
import { encode, decode } from '../dist/index.mjs';

const pk = {
  id: 153,
  flags: {
    RD: 1,
    RA: 0
  },
  questions: [
    { CLASS: 'IN', NAME: 'quote.gerganov.com', TYPE: 'A' }
  ]
};

const server = createSocket('udp4');

server.send(encode(pk), 53, '1.1.1.1', (err) => {
  if (err) console.log(err.message);

  server.on('message', (msg, rinfo) => {
    console.log(decode(msg));
    server.close();
  });
});

// server.bind(8000)