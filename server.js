import { createServer } from "http";
import { createHmac, timingSafeEqual } from 'crypto';
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";
import ngrok from '@ngrok/ngrok';

// Load environment variables
dotenv.config();

const CONFIG_PATH = "./deploy-config.json";
// Function to load deployment configurations
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    console.error("Error loading deployment config:", error);
    return {};
  }
}

const SECRET = process.env.SECRET;
// Function to verify the HMAC signature
function verifySignature(payload, signature) {
  const expected = `sha256=${createHmac('sha256', SECRET).update(payload).digest('hex')}`;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const server = createServer((req, res) => {
  if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const signature = req.headers["x-hub-signature-256"] || req.headers["x-gitlab-token"];

        if (!verifySignature(body, signature)) {
          console.log("Invalid signature.");
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Invalid signature.");
        }

        const payload = JSON.parse(body);
        if (!payload.repository || !payload.ref) {
          console.log("Missing repository or ref in the payload.");
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Missing repository or ref in the payload.");
        }

        // Extract project name & branch
        const projectName = payload.repository.name;
        const branch = payload.ref.split("/").pop();

        console.log(`Received webhook for Project: ${projectName}, Branch: ${branch}`);

        // Load deployment config
        const deployConfig = loadConfig();

        // Check if project exists in the config
        if (deployConfig[projectName] && deployConfig[projectName][branch]) {
          const script = deployConfig[projectName][branch];

          console.log(`Executing deployment script: ${script} for branch ${branch}`);

          // Run the deployment script asynchronously
          exec(`${script}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Deployment failed: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Deployment script stderr: ${stderr}`);
              return;
            }
            console.log(`Deployment output: ${stdout}`);
          });

          res.writeHead(200, { "Content-Type": "text/plain" });
          return res.end("Deployment triggered.");
        } else {
          console.log(`No deployment script found for Project: ${projectName}, Branch: ${branch}`);
          res.writeHead(404, { "Content-Type": "text/plain" });
          return res.end("No deployment script found.");
        }
      } catch (error) {
        console.error("Error processing webhook:", error.message);
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Invalid payload format.");
      }
    });
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Alowed\n");
  }
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on port ${PORT}`);
});
