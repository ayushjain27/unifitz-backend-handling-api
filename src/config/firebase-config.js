import admin, {
  initializeApp,
  credential as _credential
} from 'firebase-admin';

import serviceAccount from './firebase-adminsdk.json';

initializeApp({
  credential: _credential.cert(serviceAccount)
});

const _admin = admin;
export { _admin as firebaseAdmin };
