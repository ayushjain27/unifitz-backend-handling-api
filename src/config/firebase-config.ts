import admin, {
  initializeApp
  // credential as _credential
} from 'firebase-admin/app';

import serviceAccount from './firebase-adminsdk.json';

const connectFirebaseAdmin = async (): Promise<void> => {
  const params = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url
  };

  initializeApp(params);
};
const _admin = admin;
export { _admin as firebaseAdmin, connectFirebaseAdmin };
