// Quick test script to verify API keys
import 'dotenv/config';

console.log('\n🔍 Checking API Keys Configuration...\n');

const geminiKey = process.env.VITE_GEMINI_API_KEY;
const geminiKeyText = process.env.VITE_GEMINI_API_KEY_TEXT;
const tavusKey = process.env.TAVUS_API_KEY;

console.log('✅ VITE_GEMINI_API_KEY:', geminiKey ? (geminiKey === 'your_gemini_api_key_here' ? '❌ PLACEHOLDER - NEEDS REAL KEY' : '✅ SET') : '❌ MISSING');
console.log('✅ VITE_GEMINI_API_KEY_TEXT:', geminiKeyText ? (geminiKeyText === 'your_gemini_api_key_here' ? '❌ PLACEHOLDER - NEEDS REAL KEY' : '✅ SET') : '❌ MISSING');
console.log('✅ TAVUS_API_KEY:', tavusKey ? '✅ SET' : '❌ MISSING');

console.log('\n📝 Next Steps:');
if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
  console.log('1. Get Gemini API key from: https://aistudio.google.com/apikey');
  console.log('2. Replace "your_gemini_api_key_here" in .env file with your real key');
  console.log('3. Restart the dev server: npm run dev');
}

console.log('\n');
