import tls from 'tls';
import net from 'net';
import { Buffer } from 'buffer';

/**
 * Extract clean raw email address from formats like "Name <email@domain.com>" or "email@domain.com"
 */
function extractEmail(str) {
  if (!str) return '';
  const match = str.match(/<([^>]+)>/);
  return match ? match[1].trim() : str.trim();
}

/**
 * Minimal SMTP client using native Node.js sockets.
 * Supports both SSL (port 465) and STARTTLS (port 587).
 */
export function sendSmtpEmail({ host, port = 465, user, pass, from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const useSSL = Number(port) === 465;
    const rawFrom = extractEmail(from || user);
    const rawTo = extractEmail(to);

    const sendMail = (socket) => {
      let buf = '';
      let step = 0;

      const write = (str) => socket.write(str + '\r\n');

      const onData = (chunk) => {
        buf += chunk.toString();
        const lines = buf.split('\r\n');
        buf = lines.pop(); // Keep incomplete last line
        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.slice(0, 3), 10);
          const isLast = line[3] === ' ' || line.length === 3;
          if (!isLast) continue; // Multi-line response, wait for last

          try {
            handleLine(code, line);
          } catch (e) {
            socket.destroy();
            reject(e);
          }
        }
      };

      const handleLine = (code, line) => {
        if (step === 0 && code === 220) {
          step = 1;
          write(`EHLO agrolink.portal`);
        } else if (step === 1 && code === 250) {
          step = 2;
          if (!useSSL) {
            write('STARTTLS');
          } else {
            write('AUTH LOGIN');
          }
        } else if (step === 2 && code === 220 && !useSSL) {
          step = 3;
          const tlsSocket = tls.connect({ socket, rejectUnauthorized: false }, () => {
            socket.removeListener('data', onData);
            tlsSocket.on('data', (d) => {
              buf += d.toString();
              const ls = buf.split('\r\n');
              buf = ls.pop();
              for (const l of ls) {
                if (!l) continue;
                const c = parseInt(l.slice(0, 3), 10);
                if (l[3] === ' ' || l.length === 3) {
                  try { handleLine(c, l); } catch (e) { tlsSocket.destroy(); reject(e); }
                }
              }
            });
            write(`EHLO agrolink.portal`);
            step = 4;
          });
        } else if ((step === 4 || step === 1) && code === 250) {
          if (step === 4) step = 5;
          else step = 2;
          write('AUTH LOGIN');
        } else if ((step === 2 || step === 5) && code === 334) {
          step = 6;
          write(Buffer.from(user).toString('base64'));
        } else if (step === 6 && code === 334) {
          step = 7;
          write(Buffer.from(pass).toString('base64'));
        } else if (step === 7 && code === 235) {
          step = 8;
          write(`MAIL FROM:<${rawFrom}>`);
        } else if (step === 8 && code === 250) {
          step = 9;
          write(`RCPT TO:<${rawTo}>`);
        } else if (step === 9 && code === 250) {
          step = 10;
          write('DATA');
        } else if (step === 10 && code === 354) {
          step = 11;
          const boundary = `agrolink_${Date.now()}`;
          const mime = [
            `From: ${from || user}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset=utf-8',
            'Content-Transfer-Encoding: base64',
            '',
            Buffer.from(html).toString('base64'),
            '',
            `--${boundary}--`,
            '.',
          ].join('\r\n');
          socket.write(mime + '\r\n');
        } else if (step === 11 && code === 250) {
          step = 12;
          write('QUIT');
          socket.end();
          console.log(`✅ [SMTP SUCCESS] Delivered email to ${rawTo}`);
          resolve(true);
        } else if (code >= 400) {
          console.error(`❌ [SMTP ERROR] Code ${code}: ${line}`);
          socket.destroy();
          reject(new Error(`SMTP error ${code}: ${line}`));
        }
      };

      socket.on('data', onData);
      socket.on('error', (err) => {
        console.error('❌ [SMTP SOCKET ERROR]', err);
        reject(err);
      });
      socket.on('close', () => {
        if (step < 12) reject(new Error('SMTP connection closed prematurely'));
      });
    };

    if (useSSL) {
      const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
        sendMail(socket);
      });
      socket.on('error', (err) => {
        console.error('❌ [TLS CONNECT ERROR]', err);
        reject(err);
      });
    } else {
      const socket = net.connect({ host, port }, () => {
        sendMail(socket);
      });
      socket.on('error', (err) => {
        console.error('❌ [NET CONNECT ERROR]', err);
        reject(err);
      });
    }
  });
}
