// Test Firebase Connection
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from a collection (even if empty)
    const testRef = collection(db, 'sessions');
    await getDocs(testRef);
    
    console.log('✅ Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

export async function debugSession(sessionId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
      console.log('Session data:', sessionSnap.data());
      return sessionSnap.data();
    } else {
      console.log('Session not found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error debugging session:', error);
    return null;
  }
}
