import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { setUserProfile } from './firestore';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const { uid, displayName, email, photoURL } = result.user;
  await setUserProfile(uid, { displayName, email, photoURL, role: 'member' });
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
