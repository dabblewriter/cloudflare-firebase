import type { Settings } from './types';
import { Auth } from './auth/auth';
import { Firestore } from './firestore';


export class App {

  constructor(readonly settings: Settings, readonly apiKey: string) {
  }

  firestore() {
    return new Firestore(this.settings, this.apiKey);
  }

  auth() {
    return new Auth(this.settings, this.apiKey);
  }
}
