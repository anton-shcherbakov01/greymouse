// Локальный CONNECT-релей для headless-браузера.
// Chromium не может напрямую открыть туннель через агентский прокси (соединение
// сбрасывается), поэтому релей принимает CONNECT от браузера и переоткрывает его
// собственным корректным CONNECT к вышестоящему прокси. Используется только
// исследовательскими и QA-скриптами, в приложение не входит.
import net from 'node:net'
import http from 'node:http'

const UPSTREAM = new URL(process.env.HTTPS_PROXY || 'http://127.0.0.1:35875')
const PORT = Number(process.env.RELAY_PORT || 33128)

const server = http.createServer((req, res) => {
  res.writeHead(405, { 'content-type': 'text/plain' })
  res.end('relay supports CONNECT only\n')
})

const VERBOSE = process.env.RELAY_VERBOSE === '1'

server.on('connect', (req, clientSocket, head) => {
  clientSocket.setNoDelay(true)
  const upstream = net.connect(Number(UPSTREAM.port), UPSTREAM.hostname, () => {
    upstream.setNoDelay(true)
    upstream.write(`CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\n\r\n`)
  })

  let handshakeDone = false
  let buffer = Buffer.alloc(0)

  upstream.on('data', (chunk) => {
    if (handshakeDone) return
    buffer = Buffer.concat([buffer, chunk])
    const end = buffer.indexOf('\r\n\r\n')
    if (end === -1) return

    const statusLine = buffer.subarray(0, buffer.indexOf('\r\n')).toString()
    const rest = buffer.subarray(end + 4)
    handshakeDone = true

    if (VERBOSE) console.log(`${req.url} -> ${statusLine}`)

    if (!/^HTTP\/1\.[01] 200/.test(statusLine)) {
      clientSocket.end(`HTTP/1.1 502 Bad Gateway\r\n\r\n`)
      upstream.destroy()
      return
    }

    upstream.removeAllListeners('data')
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    if (rest.length) clientSocket.write(rest)
    if (head?.length) upstream.write(head)
    upstream.pipe(clientSocket)
    clientSocket.pipe(upstream)
  })

  const fail = (err) => {
    if (VERBOSE && err) console.log(`${req.url} !! ${err.message}`)
    clientSocket.destroy()
    upstream.destroy()
  }
  upstream.on('error', fail)
  clientSocket.on('error', fail)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`proxy relay listening on http://127.0.0.1:${PORT} -> ${UPSTREAM.origin}`)
})
