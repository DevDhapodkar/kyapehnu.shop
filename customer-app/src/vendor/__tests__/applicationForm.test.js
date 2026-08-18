import {
  emptyApplication,
  toApplicationPayload,
  validateApplication,
  VENDOR_CATEGORIES,
} from '../applicationForm';

const goodForm = () => ({
  ...emptyApplication(),
  shopName: 'Sitabuldi Threads',
  ownerName: 'Rahul Verma',
  phone: '9876543210',
  line1: '12 Main Road',
  area: 'Sitabuldi',
  pincode: '440012',
});

describe('validateApplication', () => {
  test('a complete form passes', () => {
    const { valid, errors } = validateApplication(goodForm());
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  test('an empty form flags every required field', () => {
    const { valid, errors } = validateApplication(emptyApplication());
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(
      ['area', 'line1', 'ownerName', 'phone', 'pincode', 'shopName'].sort()
    );
  });

  test('rejects a bad pincode', () => {
    const { valid, errors } = validateApplication({ ...goodForm(), pincode: '12' });
    expect(valid).toBe(false);
    expect(errors.pincode).toBeTruthy();
  });

  test('rejects a bad phone', () => {
    const { errors } = validateApplication({ ...goodForm(), phone: '123' });
    expect(errors.phone).toBeTruthy();
  });

  test('whatsapp is optional but validated when present', () => {
    expect(validateApplication({ ...goodForm(), whatsappNumber: '' }).valid).toBe(true);
    expect(validateApplication({ ...goodForm(), whatsappNumber: 'abc' }).errors.whatsappNumber).toBeTruthy();
  });

  test('years must be a whole number when provided', () => {
    expect(validateApplication({ ...goodForm(), yearsInBusiness: '7' }).valid).toBe(true);
    expect(validateApplication({ ...goodForm(), yearsInBusiness: '7.5' }).errors.yearsInBusiness).toBeTruthy();
  });
});

describe('toApplicationPayload', () => {
  test('nests the address and trims fields', () => {
    const payload = toApplicationPayload({ ...goodForm(), shopName: '  Threads  ' });
    expect(payload.shopName).toBe('Threads');
    expect(payload.address).toEqual({
      line1: '12 Main Road',
      area: 'Sitabuldi',
      city: 'Nagpur',
      pincode: '440012',
    });
  });

  test('defaults whatsapp to the phone number', () => {
    const payload = toApplicationPayload(goodForm());
    expect(payload.whatsappNumber).toBe('9876543210');
  });

  test('uses a distinct whatsapp when given', () => {
    const payload = toApplicationPayload({ ...goodForm(), whatsappNumber: '9998887776' });
    expect(payload.whatsappNumber).toBe('9998887776');
  });

  test('omits optional empties and coerces years to a number', () => {
    const payload = toApplicationPayload({ ...goodForm(), yearsInBusiness: '5', gstin: '', description: '' });
    expect(payload.yearsInBusiness).toBe(5);
    expect(payload.gstin).toBeUndefined();
    expect(payload.description).toBeUndefined();
  });
});

describe('VENDOR_CATEGORIES', () => {
  test('every category has a key and label', () => {
    expect(VENDOR_CATEGORIES.length).toBeGreaterThan(0);
    VENDOR_CATEGORIES.forEach((c) => {
      expect(typeof c.key).toBe('string');
      expect(typeof c.label).toBe('string');
    });
  });
});
