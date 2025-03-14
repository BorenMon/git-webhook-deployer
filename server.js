import { createServer } from "http";
import { createHmac, timingSafeEqual } from 'crypto';

// Webhook secret token
const SECRET = 'QANt25nIFV[=pi9';
const PORT = 9999;

// Function to verify the HMAC signature
function verifySignature(payload, signature) {
  const expected = `sha256=${createHmac('sha256', SECRET).update(payload).digest('hex')}`;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const server = createServer((req, res) => {
  if (req.method === "POST") {
    let body = '';

    // Collect the request data (payload)
    req.on('data', chunk => {
      body += chunk;
    });

    // When the entire payload is received
    req.on('end', () => {
      try {
        // Get the GitHub/GitLab signature header
        const signature = req.headers['x-hub-signature-256'] || req.headers['x-gitlab-token'];

        // Validate the signature
        if (signature && verifySignature(body, signature)) {
          console.log('Valid webhook received.');

          // Parse the JSON payload
          const payload = JSON.parse(body);

          // Check if ref exists before trying to split
          if (payload.ref) {
            const projectName = payload.repository.name;
            const branch = payload.ref.split('/').pop();

            // Example: Log the details (you can replace this with your logic)
            console.log(`Project: ${projectName}, Branch: ${branch}`);
            
            // Respond to GitHub/GitLab to confirm receipt
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Webhook received and verified.');
          } else {
            console.log('Missing ref in the payload.');
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('Missing ref in the payload.');
          }
        } else {
          console.log('Invalid signature.');
          res.writeHead(400, {'Content-Type': 'text/plain'});
          res.end('Invalid signature.');
        }
      } catch (error) {
        console.error('Error parsing the payload:', error.message);
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('Invalid payload format.');
      }
    });
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed\n");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on port ${PORT}`);
});
