// Load environment variables from the .env file
import { config } from 'dotenv';
config();

// Initialize the bot class
import Bot from './classes/Bot';
const bot = new Bot();

// Export the bot to use elsewhere
export default bot;
