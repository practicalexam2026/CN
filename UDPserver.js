const dgram = require('dgram');
const readline = require('readline');

const PORT = 9876;

const socket = dgram.createSocket('udp4');
let clientAddress = null;
let clientPort = -1;
let shuttingDown = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: ',
});

// Prints a line without breaking a half-typed prompt, then redraws the prompt.
function log(line) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(line);
    rl.prompt(true);
}

function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    socket.close();
    rl.close();
    console.log('Server shut down.');
}

// Receive messages (replaces the Java receive thread)
socket.on('message', (msg, rinfo) => {
    // Learn the client's address/port from the most recent packet received
    clientAddress = rinfo.address;
    clientPort = rinfo.port;

    const message = msg.toString().trim();

    if (message.toLowerCase() === 'exit') {
        log('Client disconnected.');
        return;
    }

    log(`Client: ${message}`);
});

socket.on('error', (err) => {
    console.error(`[SERVER] Socket error: ${err.message}`);
    shutdown();
});

socket.bind(PORT, () => {
    console.log(`UDP Chat Server started on port ${PORT}`);
    console.log('Waiting for a client to say hello...');
    rl.prompt();
});

// Read from console and send messages to the client
rl.on('line', (line) => {
    const outgoing = line.trim();
    if (!outgoing) {
        rl.prompt();
        return;
    }

    if (clientAddress === null) {
        console.log('No client has connected yet. Waiting...');
        rl.prompt();
        return;
    }

    socket.send(outgoing, clientPort, clientAddress, (err) => {
        if (err) {
            console.error(`[SERVER] Send error: ${err.message}`);
        }
        if (outgoing.toLowerCase() === 'exit') {
            shutdown();
        } else {
            rl.prompt();
        }
    });
});

// Ctrl+C / Ctrl+D
rl.on('close', shutdown);