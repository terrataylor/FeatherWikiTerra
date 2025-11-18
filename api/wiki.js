import { readFile, writeFile } from "fs/promises";
import { join } from "path";

// Configuration
const USERPASS = process.env.WIKI_AUTH || null; // Set in Vercel env variables
const WIKI_FILE = join(process.cwd(), "nests", "featherwiki.html");

function notAuthorized(res) {
  res.status(401).setHeader("WWW-Authenticate", `Basic realm="FeatherWiki"`);
  res.end();
}

export default async function handler(req, res) {
  // Check authentication if enabled
  if (USERPASS) {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      return notAuthorized(res);
    }
    
    const match = /Basic (.*)/.exec(authorization);
    if (match) {
      const givenUserpass = Buffer.from(match[1], "base64").toString();
      if (givenUserpass !== USERPASS) {
        return notAuthorized(res);
      }
    } else {
      return notAuthorized(res);
    }
  }

  try {
    switch (req.method) {
      case "GET":
        const body = await readFile(WIKI_FILE, "utf-8");
        res.status(200).setHeader("Content-Type", "text/html").send(body);
        break;

      case "PUT":
        let data = "";
        
        // Handle request body
        if (req.body) {
          data = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        }
        
        await writeFile(WIKI_FILE, data, "utf-8");
        res.status(204).send("Saved");
        break;

      case "OPTIONS":
        res.status(204).setHeader("DAV", "1")
          .setHeader("Allow", "GET, PUT, OPTIONS")
          .setHeader("Content-Length", "0")
          .end();
        break;

      default:
        res.status(405).send("Method Not Allowed");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}



