const dgram = require('dgram');
const readline = require('readline');

const SERVER_PORT = 9876;
const SERVER_HOST = 'localhost'; // change to server IP if remote

const socket = dgram.createSocket('udp4');
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
    console.log('Client shut down.');
}

// Receive messages from the server (replaces the Java receive thread)
socket.on('message', (msg) => {
    const message = msg.toString().trim();

    if (message.toLowerCase() === 'exit') {
        console.log('\nServer ended the chat.');
        shutdown();
        return;
    }

    log(`Server: ${message}`);
});

socket.on('error', (err) => {
    console.error(`[CLIENT] Socket error: ${err.message}`);
    shutdown();
});

console.log(`Connected to UDP Chat Server at ${SERVER_HOST}:${SERVER_PORT}`);
console.log("Type a message and press Enter. Type 'exit' to quit.");

// Send an initial "hello" so the server learns our address/port
socket.send('Hello from client', SERVER_PORT, SERVER_HOST, (err) => {
    if (err) console.error(`[CLIENT] Send error: ${err.message}`);
});
rl.prompt();

// Read from console and send messages
rl.on('line', (line) => {
    const outgoing = line.trim();
    if (!outgoing) {
        rl.prompt();
        return;
    }

    socket.send(outgoing, SERVER_PORT, SERVER_HOST, (err) => {
        if (err) {
            console.error(`[CLIENT] Send error: ${err.message}`);
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