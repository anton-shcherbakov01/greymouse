// TLS-терминирующий релей для исследовательских прогонов.
//
// Зачем: агентский прокси песочницы сбрасывает TLS 1.3 handshake, инициированный
// Chromium, а часть сайтов (например gravity.nl) не принимает TLS 1.2. Node такой
// handshake выполняет корректно, поэтому релей:
//   браузер --TLS(локальный сертификат)--> релей --CONNECT+TLS1.3--> прокси --> origin
//
// Проверка сертификата origin остаётся включённой и выполняется Node
// (NODE_EXTRA_CA_CERTS + системное хранилище). Локальное плечо «браузер → релей»
// использует самоподписанный сертификат, поэтому исследовательский браузер
// запускается с ignoreHTTPSErrors — это касается только соединения с 127.0.0.1.
//
// Скрипт используется только исследовательскими скриптами и в приложение не входит.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import tls from 'node:tls'

const UPSTREAM = new URL(process.env.HTTPS_PROXY || 'http://127.0.0.1:35875')
const PORT = Number(process.env.MITM_PORT || 33130)
const CERT_DIR = path.join(os.tmpdir(), 'greymouse-research-tls')

function ensureCert() {
  const keyPath = path.join(CERT_DIR, 'relay.key')
  const certPath = path.join(CERT_DIR, 'relay.crt')
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  }
  fs.mkdirSync(CERT_DIR, { recursive: true })
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', certPath,
    '-days', '2', '-subj', '/CN=greymouse-research-relay',
    '-addext', 'subjectAltName=DNS:*,DNS:localhost,IP:127.0.0.1',
  ])
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
}

/** Сокет к origin: CONNECT через агентский прокси, затем TLS силами Node. */
function connectThroughProxy(host, port, callback) {
  const raw = net.connect(Number(UPSTREAM.port), UPSTREAM.hostname, () => {
    raw.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n\r\n`)
  })
  let buf = Buffer.alloc(0)
  const onData = (chunk) => {
    buf = Buffer.concat([buf, chunk])
    const end = buf.indexOf('\r\n\r\n')
    if (end === -1) return
    raw.removeListener('data', onData)
    const status = buf.subarray(0, buf.indexOf('\r\n')).toString()
    if (!/^HTTP\/1\.[01] 200/.test(status)) {
      raw.destroy()
      callback(new Error(`proxy CONNECT failed: ${status}`))
      return
    }
    const secured = tls.connect({ socket: raw, servername: host, ALPNProtocols: ['http/1.1'] }, () =>
      callback(null, secured),
    )
    secured.on('error', (e) => callback(e))
  }
  raw.on('data', onData)
  raw.on('error', (e) => callback(e))
}

const originAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 12,
  createConnection(options, cb) {
    connectThroughProxy(options.host, options.port || 443, (err, socket) => {
      if (err) cb(err)
      else cb(null, socket)
    })
  },
})

const { key, cert } = ensureCert()

// TLS-сервер, который обслуживает уже перехваченные CONNECT-соединения браузера.
const tlsServer = https.createServer({ key, cert }, (req, res) => {
  const host = (req.headers.host || '').split(':')[0]
  if (!host) {
    res.writeHead(400).end('missing host')
    return
  }
  const headers = { ...req.headers }
  delete headers['accept-encoding'] // упрощает сквозную передачу
  delete headers.connection

  const proxyReq = https.request(
    { host, port: 443, path: req.url, method: req.method, headers, agent: originAgent },
    (proxyRes) => {
      const outHeaders = { ...proxyRes.headers }
      // HSTS сломал бы последующие локальные соединения браузера
      delete outHeaders['strict-transport-security']
      delete outHeaders['content-security-policy']
      delete outHeaders['content-security-policy-report-only']
      res.writeHead(proxyRes.statusCode || 502, outHeaders)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', (e) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
    res.end(`relay error: ${e.message}`)
  })
  req.pipe(proxyReq)
})

// HTTP-прокси, который браузер видит как обычный прокси.
const proxyServer = http.createServer((req, res) => {
  res.writeHead(405).end('CONNECT only')
})

proxyServer.on('connect', (req, clientSocket, head) => {
  clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
  if (head?.length) clientSocket.unshift(head)
  // Передаём соединение локальному TLS-серверу — он и станет «сайтом» для браузера.
  tlsServer.emit('connection', clientSocket)
})

proxyServer.listen(PORT, '127.0.0.1', () => {
  console.log(`tls-terminating relay on http://127.0.0.1:${PORT} -> ${UPSTREAM.origin}`)
})
