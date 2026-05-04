import { 
  signInAnonymously, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';

export async function signInAsAnonymous(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
