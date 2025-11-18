#!/usr/bin/env node
import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";

// == Configuration

const userpass = process.env.WIKI_AUTH || null;
// Set WIKI_AUTH environment variable to "username:password"
// Or set it here: const userpass = "admin:featherwiki123";
// Set to null to disable authentication (not recommended)

// where the Feather Wiki file is located
const wikifile = "./featherwiki.html";

const hostname = process.env.RAILWAY_ENVIRONMENT ? "0.0.0.0" : "localhost";
const port = process.env.PORT || 4505;

// == Configuration End

let mutexId = 0;
const waitingResolvers = [];
let currentMutexId = null;

function acquireMutex() {
    if (!currentMutexId) {
        currentMutexId = mutexId++;
        return Promise.resolve(currentMutexId);
    }

    return new Promise((resolve) => {
        waitingResolvers.push(resolve);
    });
}

function releaseMutex(mutexId) {
    if (mutexId !== currentMutexId) {
        throw new Error(`Release ID doesn't match current lock ID`);
    }

    if (waitingResolvers.length > 0) {
        const resolve = waitingResolvers.shift();
        currentMutexId = mutexId++;
        resolve(currentMutexId);
    } else {
        currentMutexId = null;
    }
}

function not_authorized(response) {
    response.writeHead(401, {
        "WWW-Authenticate": `Basic realm="FeatherWiki"`
    });
    response.end();
}

const handler = async (request, response) => {
    if (userpass != null) {
        const authorization = request.headers['authorization'];
        if (!authorization) {
            return not_authorized(response);
        }
        const matchresult = /Basic (.*)/.exec(authorization);
        if (matchresult) {
            const given_userpass = Buffer.from(matchresult[1], 'base64').toString();
            console.log("Received Authorization:", given_userpass);
            if (given_userpass !== userpass) return not_authorized(response);
        }
    }

    switch (request.method) {
        case "GET":
            const id = await acquireMutex();
            let body;
            try {
                body = await readFile(wikifile);
            } finally {
                releaseMutex(id);
            }
            response.writeHead(200, { "Content-Type": "text/html" });
            response.end(body);
            break;

        case "PUT":
            const id2 = await acquireMutex();
            let body2 = "";
            request.on("data", (chunk) => {
                body2 += chunk;
            });
            request.on("end", async () => {
                try {
                    await writeFile(wikifile, body2);
                } finally {
                    releaseMutex(id2);
                }
                response.writeHead(204);
                response.end();
            });
            break;

        case "OPTIONS":
            response.writeHead(204, {
                DAV: "1",
                Allow: "GET, PUT, OPTIONS",
                "Content-Length": "0"
            });
            response.end();
            break;

        default:
            response.writeHead(500);
    }
};

const server = createServer(handler).listen(port, hostname);
console.log(`Server running at http://${hostname}:${port}/`);
