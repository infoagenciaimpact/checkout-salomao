const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MP_ACCESS_TOKEN = 'APP_USR-2110297968132440-061520-5d71018f6b49bb7f6d2ea4e6f89400d8-414078168';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve o HTML
  if (req.url === '/' || req.url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Criar PIX
  if (req.url === '/criar-pix' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { valor, email, primeiro_nome, ultimo_nome, cpf } = JSON.parse(body);

      const payload = JSON.stringify({
        transaction_amount: Number(valor),
        description: 'Black Namaste - Transformacao Completa',
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: primeiro_nome,
          last_name: ultimo_nome || primeiro_nome,
          identification: { type: 'CPF', number: cpf }
        }
      });

      const options = {
        hostname: 'api.mercadopago.com',
        path: '/v1/payments',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `bkn_${Date.now()}`
        }
      };

      const mpReq = https.request(options, (mpRes) => {
        let data = '';
        mpRes.on('data', c => data += c);
        mpRes.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      mpReq.on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });

      mpReq.write(payload);
      mpReq.end();
    });
    return;
  }

  // Consultar PIX
  if (req.url.startsWith('/consultar-pix') && req.method === 'GET') {
    const id = new URL(req.url, 'http://localhost').searchParams.get('id');

    const options = {
      hostname: 'api.mercadopago.com',
      path: `/v1/payments/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    };

    const mpReq = https.request(options, (mpRes) => {
      let data = '';
      mpRes.on('data', c => data += c);
      mpRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });

    mpReq.on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });

    mpReq.end();
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
