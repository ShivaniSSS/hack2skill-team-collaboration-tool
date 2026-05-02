import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authModule from 'firebase/auth';
import { signInWithGoogle, signOut, onAuthChange } from './auth';
import { setUserProfile } from './firestore';

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('./firebase', () => ({
  auth: 'mock-auth',
  googleProvider: 'mock-provider'
}));

vi.mock('./firestore', () => ({
  setUserProfile: vi.fn()
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signInWithGoogle calls signInWithPopup and sets profile', async () => {
    const mockUser = { uid: '123', displayName: 'John', email: 'j@j.com', photoURL: 'img.png' };
    authModule.signInWithPopup.mockResolvedValueOnce({ user: mockUser });

    const user = await signInWithGoogle();
    
    expect(authModule.signInWithPopup).toHaveBeenCalledWith('mock-auth', 'mock-provider');
    expect(setUserProfile).toHaveBeenCalledWith('123', {
      displayName: 'John',
      email: 'j@j.com',
      photoURL: 'img.png',
      role: 'member'
    });
    expect(user).toEqual(mockUser);
  });

  it('signOut calls firebaseSignOut', async () => {
    await signOut();
    expect(authModule.signOut).toHaveBeenCalledWith('mock-auth');
  });

  it('onAuthChange sets up listener', () => {
    const cb = vi.fn();
    onAuthChange(cb);
    expect(authModule.onAuthStateChanged).toHaveBeenCalledWith('mock-auth', cb);
  });
});
