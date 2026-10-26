const net = require('net');
const readline = require('readline');

const PORT = 3000;
const HOST = '127.0.0.1';

// Keep track of all connected clients so we can broadcast to them
const clients = new Set();

// Prints a log line without leaving a half-typed prompt line broken,
// then redraws the prompt so the server operator can keep typing.
function log(line) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(line);
    rl.prompt(true);
}

const server = net.createServer((socket) => {
    const id = `${socket.remoteAddress}:${socket.remotePort}`;
    log(`[SERVER] Client connected: ${id}`);
    clients.add(socket);

    socket.setEncoding('utf8');

    socket.on('data', (data) => {
        const msg = data.trim();
        if (!msg) return;

        log(`[${id}] ${msg}`);

        // Broadcast to every OTHER connected client (full duplex, not an echo bot)
        for (const other of clients) {
            if (other !== socket) {
                other.write(`[${id}] ${msg}\n`);
            }
        }
    });

    socket.on('end', () => {
        log(`[SERVER] Client disconnected: ${id}`);
        clients.delete(socket);
    });

    socket.on('error', (error) => {
        log(`[SERVER] Socket error (${id}): ${error.message}`);
        clients.delete(socket);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`[SERVER] TCP server running on ${HOST}:${PORT}`);
    console.log('[SERVER] Type a message and press Enter to broadcast to all clients.');
    rl.prompt();
});

// The server operator is a full participant too: typed lines broadcast
// to every connected client, and incoming client messages show up live
// without clobbering whatever the operator is mid-typing.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
rl.on('line', (line) => {
    const msg = line.trim();

    if (msg === 'exit') {
        console.log('[SERVER] Closing all client connections...');
        for (const client of clients) {
            client.end();
        }
        server.close(() => {
            console.log('[SERVER] Server closed.');
            process.exit(0);
        });
        return;
    }

    if (msg) {
        for (const client of clients) {
            client.write(`[SERVER] ${msg}\n`);
        }
    }
    rl.prompt();
});