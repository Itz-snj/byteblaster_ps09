import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket-server';

const PORT = process.env.PORT || 3000;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';

const app = next({ dev, hostname, port: Number(PORT) });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://${hostname}:${PORT}`);
    console.log(`> Socket.io server initialized`);
  });
});