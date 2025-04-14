// utils/translation.js
import { v2 } from '@google-cloud/translate';

// Create a Translate client (ensure authentication is set up globally or passed here)
const translateClient = new v2.Translate();

async function translatePersianToEnglish(persianText) {
  try {
    const [translation] = await translateClient.translate(persianText, 'en');
    return Array.isArray(translation) ? translation[0] : translation;
  } catch (error) {
    console.error('Translation Error:', error);
    // Optionally, you can throw the error here to be handled by the route handler
    return null; // Or handle the error as needed
  }
}

export default translatePersianToEnglish;