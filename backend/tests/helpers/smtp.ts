/** SMTP exclusivo de pruebas: captura en memoria, nunca envía correo ni imprime códigos. */
import { createServer, type Socket } from 'node:net';
import { once } from 'node:events';
export async function startTestSmtp() {
  const messages: { to: string; code: string; invitationToken?: string }[] = [];
  const sockets = new Set<Socket>(); let rejectNext = false;
  const server = createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8'); socket.write('220 localhost PetCare test SMTP\r\n');
    let buffer = ''; let data = false; let body = ''; let to = '';
    socket.on('data', chunk => {
      buffer += chunk;
      let end: number;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (data) {
          if (line !== '.') { body += `${line}\n`; continue; }
          data = false;
          // quoted-printable puede cortar líneas; no altera los seis dígitos del código.
          const decoded=body.replace(/=\n/g,'').replace(/=([A-F0-9]{2})/g,(_match,hex:string)=>String.fromCharCode(parseInt(hex,16)));
          const code = decoded.match(/PetCare es: (\d{6})/)?.[1];
          const invitationToken=decoded.match(/#token=([a-f0-9]{64})/)?.[1];
          if (code || invitationToken) messages.push({ to, code: code ?? '',invitationToken });
          socket.write('250 queued locally\r\n'); continue;
        }
        if (/^(EHLO|HELO)/i.test(line)) socket.write('250-localhost\r\n250 PIPELINING\r\n');
        else if (/^MAIL FROM/i.test(line)) { body = ''; socket.write('250 OK\r\n'); }
        else if (/^RCPT TO/i.test(line)) {
          to = line.match(/<([^>]+)>/)?.[1] ?? '';
          if (rejectNext) { rejectNext = false; socket.write('550 test rejection\r\n'); } else socket.write('250 OK\r\n');
        } else if (/^DATA/i.test(line)) { data = true; socket.write('354 End with dot\r\n'); }
        else if (/^QUIT/i.test(line)) socket.end('221 Bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
    socket.on('error', () => { /* Los cortes simulados se informan desde Nodemailer. */ });
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('SMTP test unavailable');
  return { messages, port: address.port, failNext: () => { rejectNext = true; }, close: async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  } };
}
