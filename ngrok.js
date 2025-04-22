import ngrok from '@ngrok/ngrok';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;

console.log('Starting ngrok tunnel...');

// Create tunnel and keep it running
ngrok.connect({ 
	addr: PORT,
	authtoken_from_env: true 
})
.then(url => {
	console.log(`✨ Ngrok tunnel established at: ${url}`);
	console.log('Your webhook URL is now accessible from the internet!');
	
	// Keep the process alive
	setInterval(() => {
		// This keeps the event loop running
	}, 1000);
})
.catch(error => {
	console.error('Error establishing ngrok tunnel:', error);
});