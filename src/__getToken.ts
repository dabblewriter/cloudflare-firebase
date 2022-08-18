import settings from './serviceAccount.json';
import { getTokenGetter } from './tokens';

// I created this to generate a token for use in testing the API via CURL.
// > wrangler dev -l src/__getToken.ts

async function printToken() {
  const getToken = getTokenGetter(settings, 'firestore');
  const token = await getToken();
  console.log('======= TOKEN FOR TESTING =======\n' + token + '\n=================================');
}

printToken();
