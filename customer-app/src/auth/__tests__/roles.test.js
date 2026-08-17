import { normalizeProfile, resolveRole, ROLES } from '../roles';

describe('resolveRole', () => {
  test('a VENDOR profile resolves to the vendor role', () => {
    expect(resolveRole({ role: ROLES.VENDOR })).toBe(ROLES.VENDOR);
  });

  test('a CUSTOMER profile resolves to the customer role', () => {
    expect(resolveRole({ role: ROLES.CUSTOMER })).toBe(ROLES.CUSTOMER);
  });

  test('a missing profile falls back to CUSTOMER', () => {
    expect(resolveRole(null)).toBe(ROLES.CUSTOMER);
    expect(resolveRole(undefined)).toBe(ROLES.CUSTOMER);
  });

  test('an unknown role never exposes the vendor desk', () => {
    expect(resolveRole({ role: 'ADMIN' })).toBe(ROLES.CUSTOMER);
    expect(resolveRole({})).toBe(ROLES.CUSTOMER);
  });
});

describe('normalizeProfile', () => {
  const firebaseUser = {
    uid: 'uid-123',
    email: 'buyer@example.com',
    displayName: 'Auth Name',
    phoneNumber: '+919999999999',
  };

  test('prefers the Firestore profile for name and phone', () => {
    const result = normalizeProfile(firebaseUser, {
      name: 'Profile Name',
      phone: '9876543210',
      role: ROLES.VENDOR,
    });
    expect(result).toEqual({
      uid: 'uid-123',
      email: 'buyer@example.com',
      displayName: 'Profile Name',
      phone: '9876543210',
      role: ROLES.VENDOR,
    });
  });

  test('falls back to the Firebase record when the profile is missing fields', () => {
    const result = normalizeProfile(firebaseUser, null);
    expect(result.displayName).toBe('Auth Name');
    expect(result.phone).toBe('+919999999999');
    expect(result.role).toBe(ROLES.CUSTOMER);
  });

  test('tolerates a null firebase user', () => {
    const result = normalizeProfile(null, { uid: 'p', email: 'p@e.com', role: ROLES.CUSTOMER });
    expect(result.uid).toBe('p');
    expect(result.email).toBe('p@e.com');
    expect(result.role).toBe(ROLES.CUSTOMER);
  });
});
