import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { FIREBASE_URL } from './firebase.constant';
import { getDatabase, set, ref as refDb, get } from 'firebase/database';

@Injectable()
export class FirebaseService {
  app: FirebaseApp;

  constructor(private readonly cofigService: ConfigService) {
    const firebaseConfig = {
      apiKey: this.cofigService.get('FIREBASE_API_KEY'),
      authDomain: this.cofigService.get('FIREBASE_AUTH_DOMAIN'),
      projectId: this.cofigService.get('FIREBASE_PROJECT_ID'),
      storageBucket: this.cofigService.get('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.cofigService.get('FIREBASE_MESSAGE_SENDING_ID'),
      appId: this.cofigService.get('FIREBASE_APP_ID'),
      databaseURL: this.cofigService.get('FIREBASE_DATABASE'),
    };
    this.app = initializeApp(firebaseConfig);
  }

  async uploadImageAsync(file): Promise<string> {
    const res = await fetch(file);
    const blob = await res.blob();

    const storage = getStorage(this.app);
    const storageRef = ref(storage, 'file_' + Date.now());

    const metadata = {
      contentType: 'image/jpeg',
    };

    const snapshot = await uploadBytes(storageRef, blob, metadata);
    const url = `${FIREBASE_URL}${snapshot.ref.fullPath}?alt=media`;
    return url;
  }

  async uploadBufferAsync(file): Promise<string> {
    const storage = getStorage(this.app);
    const storageRef = ref(storage, 'file_' + Date.now());

    const metadata = {
      contentType: 'image/jpeg',
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = `${FIREBASE_URL}${snapshot.ref.fullPath}?alt=media`;
    return url;
  }

  async saveSmsCode(id: string, code: string): Promise<void> {
    const db = getDatabase(this.app);
    set(refDb(db, 'sms/' + id), {
      code: code,
    });
  }
  async checkSmsCode(id: string, code: string): Promise<boolean> {
    const db = getDatabase(this.app);
    const snapshot = await get(refDb(db, '/sms/' + id));
    const codeDb = snapshot.val();
    return codeDb?.code === code;
  }
}
