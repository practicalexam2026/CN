const net = require('net');
const readline = require('readline');

const PORT = 3000;
const HOST = '127.0.0.1';

// Prints a log line without leaving a half-typed prompt line broken,
// then redraws the prompt so you can keep typing without interruption.
function log(line) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(line);
    rl.prompt(true);
}

const client = net.createConnection({ port: PORT, host: HOST }, () => {
    console.log('[CLIENT] Connected to server. Type a message and press Enter.');
    rl.prompt();
});

client.setEncoding('utf8');

// Incoming messages can arrive at any time, independent of what you're typing
client.on('data', (data) => {
    log(data.toString().trim());
});

client.on('end', () => {
    console.log('[CLIENT] Disconnected from server.');
    process.exit(0);
});

client.on('error', (error) => {
    console.error(`[CLIENT] Connection error: ${error.message}`);
    process.exit(1);
});

// Read whatever the user types, whenever they type it, and send it immediately
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
rl.on('line', (line) => {
    const msg = line.trim();

    if(msg === 'exit') {
        console.log('[CLIENT] Exiting...');
        client.end();
        rl.close();
        return;
    }

    if (msg) client.write(msg);
    rl.prompt();
});