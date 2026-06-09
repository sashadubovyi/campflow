import { toLatinSlug, isValidUsername, USERNAME_REGEX } from './username';

describe('toLatinSlug', () => {
  it('повертає порожній рядок для пустого/відсутнього вводу', () => {
    expect(toLatinSlug('')).toBe('');
    expect(toLatinSlug(undefined as unknown as string)).toBe('');
  });

  it('пропускає чисто латинську локалку без змін', () => {
    expect(toLatinSlug('john_doe')).toBe('john_doe');
    expect(toLatinSlug('alice-99')).toBe('alice-99');
  });

  it('лоуверкейзить уцілілі літери', () => {
    expect(toLatinSlug('JOHNDoe')).toBe('johndoe');
  });

  it('транслітерує українську кирилицю у латиницю', () => {
    // 'и' у нашій мапі — 'y' (укр. романізація BGN/PCGN), 'ктор' лишається
    expect(toLatinSlug('Виктор')).toBe('vyktor');
    expect(toLatinSlug('Юлія')).toBe('yuliya');
    expect(toLatinSlug('Сашко')).toBe('sashko');
  });

  it('транслітерує російську з відмінних літер', () => {
    expect(toLatinSlug('Ёлка')).toBe('yolka');
    expect(toLatinSlug('Дёма')).toBe('dyoma');
  });

  it('кінцевий рядок завжди матчить ^[a-z0-9_-]+$ (якщо не пустий)', () => {
    const samples = ['Виктор', 'Олена_99', 'JOHN-Doe!@#', 'Юлія Іванова'];
    for (const s of samples) {
      const out = toLatinSlug(s);
      expect(out).toMatch(/^[a-z0-9_-]+$/);
    }
  });

  it('замінює пробіли і спецсимволи на _ і зливає підряд', () => {
    expect(toLatinSlug('John Doe!@#')).toBe('john_doe');
    expect(toLatinSlug('a   b')).toBe('a_b');
  });

  it('обрізає краєві _ і -', () => {
    expect(toLatinSlug('___john__')).toBe('john');
    expect(toLatinSlug('-alice-')).toBe('alice');
  });

  it('повертає порожній рядок коли все стало непридатним', () => {
    expect(toLatinSlug('!!!')).toBe('');
    expect(toLatinSlug('   ')).toBe('');
  });
});

describe('isValidUsername / USERNAME_REGEX', () => {
  it('a-z0-9_- довжина 2..32 — валідно', () => {
    expect(isValidUsername('john')).toBe(true);
    expect(isValidUsername('jane_doe-99')).toBe(true);
    expect(isValidUsername('a1')).toBe(true);
  });

  it('менше 2 символів — невалідно', () => {
    expect(isValidUsername('a')).toBe(false);
    expect(isValidUsername('')).toBe(false);
  });

  it('кирилиця або великі літери — невалідно', () => {
    expect(isValidUsername('Виктор')).toBe(false);
    expect(isValidUsername('JohnDoe')).toBe(false);
    expect(isValidUsername('john.doe')).toBe(false);
  });

  it('USERNAME_REGEX матчить очікувані символи', () => {
    expect(USERNAME_REGEX.test('john_doe-1')).toBe(true);
    expect(USERNAME_REGEX.test('john@doe')).toBe(false);
  });
});
