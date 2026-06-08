/**
 * Транслітерація кирилиці → латиниці + санітизація username.
 *
 * Підтримує українську та російську абетки. Повертає рядок
 * у форматі [a-z0-9_-]; порожній рядок, якщо нічого корисного
 * не лишилось після санітизації.
 *
 * Використовується при автогенерації username з email/ПІБ.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  // Українські
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'yu', я: 'ya',
  // Російські (відмінні)
  ё: 'yo', ы: 'y', э: 'e', ъ: '',
};

export function toLatinSlug(input: string): string {
  if (!input) return '';
  const lowered = input.toLowerCase();
  let out = '';
  for (const ch of lowered) {
    if (ch in CYRILLIC_TO_LATIN) {
      out += CYRILLIC_TO_LATIN[ch];
    } else {
      out += ch;
    }
  }
  return out
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

/**
 * Перевіряє, чи username складається тільки з a-z, 0-9, '_' або '-'.
 * Дозволяємо '-' оскільки користувач явно про це попросив.
 */
export const USERNAME_REGEX = /^[a-z0-9_-]+$/;

export function isValidUsername(username: string): boolean {
  return username.length >= 2 && username.length <= 32 && USERNAME_REGEX.test(username);
}
