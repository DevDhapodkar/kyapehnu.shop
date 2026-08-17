import {
  MIN_PASSWORD_LENGTH,
  validateAuthForm,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../validation';

describe('validateEmail', () => {
  test('rejects an empty email', () => {
    expect(validateEmail('')).toBe('Enter your email.');
  });

  test('rejects an address with no domain', () => {
    expect(validateEmail('nobody@')).toBeTruthy();
  });

  test('rejects an address with spaces', () => {
    expect(validateEmail('a b@example.com')).toBeTruthy();
  });

  test('accepts a well-formed address and ignores surrounding space', () => {
    expect(validateEmail('  buyer@example.com ')).toBeNull();
  });
});

describe('validatePassword', () => {
  test('rejects an empty password', () => {
    expect(validatePassword('')).toBe('Enter a password.');
  });

  test(`rejects a password shorter than ${MIN_PASSWORD_LENGTH}`, () => {
    expect(validatePassword('short')).toBe(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  });

  test('accepts a password at the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });
});

describe('validateName', () => {
  test('rejects an empty name', () => {
    expect(validateName('   ')).toBe('Enter your name.');
  });

  test('rejects a single character', () => {
    expect(validateName('A')).toBe('That name looks too short.');
  });

  test('accepts a real name', () => {
    expect(validateName('Aarav Sharma')).toBeNull();
  });
});

describe('validatePhone', () => {
  test('accepts a bare 10-digit number', () => {
    expect(validatePhone('9876543210')).toBeNull();
  });

  test('accepts +91 and 0 prefixes and separators', () => {
    expect(validatePhone('+91 98765-43210')).toBeNull();
    expect(validatePhone('098765 43210')).toBeNull();
  });

  test('rejects a number with too few digits', () => {
    expect(validatePhone('12345')).toBe('Enter a valid 10-digit phone number.');
  });

  test('rejects an empty number', () => {
    expect(validatePhone('')).toBe('Enter your phone number.');
  });
});

describe('validateAuthForm', () => {
  const goodSignup = {
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '9876543210',
    password: 'supersecret',
  };

  test('signin only checks email and password', () => {
    const { valid, errors } = validateAuthForm('signin', {
      email: 'aarav@example.com',
      password: 'supersecret',
    });
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  test('signin does not require name or phone', () => {
    const { valid, errors } = validateAuthForm('signin', {
      email: 'aarav@example.com',
      password: 'supersecret',
    });
    expect(errors.name).toBeUndefined();
    expect(errors.phone).toBeUndefined();
    expect(valid).toBe(true);
  });

  test('signup requires all four fields', () => {
    const { valid, errors } = validateAuthForm('signup', {});
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password', 'phone']);
  });

  test('a fully valid signup passes', () => {
    const { valid, errors } = validateAuthForm('signup', goodSignup);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  test('reports every failing field at once', () => {
    const { valid, errors } = validateAuthForm('signup', {
      ...goodSignup,
      email: 'bad',
      password: '123',
    });
    expect(valid).toBe(false);
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
    expect(errors.name).toBeUndefined();
  });
});
