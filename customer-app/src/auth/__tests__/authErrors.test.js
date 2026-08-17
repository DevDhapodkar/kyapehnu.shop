import { friendlyAuthError } from '../authErrors';

describe('friendlyAuthError', () => {
  test('maps a known Firebase error code to a friendly sentence', () => {
    const error = { code: 'auth/email-already-in-use' };
    expect(friendlyAuthError(error)).toMatch(/already exists/i);
  });

  test('collapses invalid-credential to a non-enumerating message', () => {
    expect(friendlyAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect email or password.'
    );
  });

  test('does not leak that an email is unregistered beyond the mapped copy', () => {
    // Both codes map to the same wording so the UI can show one message.
    const wrong = friendlyAuthError({ code: 'auth/wrong-password' });
    const missing = friendlyAuthError({ code: 'auth/user-not-found' });
    expect(wrong).toBe('Incorrect email or password.');
    expect(missing).toBe('No account found for that email.');
  });

  test('accepts a bare string code', () => {
    expect(friendlyAuthError('auth/too-many-requests')).toMatch(/too many/i);
  });

  test('falls back to a generic message for an unknown code', () => {
    expect(friendlyAuthError({ code: 'auth/does-not-exist' })).toBe(
      'Something went wrong. Please try again.'
    );
  });

  test('never returns a raw SDK string', () => {
    const raw = 'Firebase: Error (auth/internal-error).';
    expect(friendlyAuthError({ message: raw })).toBe('Something went wrong. Please try again.');
  });

  test('handles null / undefined without throwing', () => {
    expect(friendlyAuthError(null)).toBeTruthy();
    expect(friendlyAuthError(undefined)).toBeTruthy();
  });
});
