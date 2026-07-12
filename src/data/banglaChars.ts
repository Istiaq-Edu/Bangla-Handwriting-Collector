export interface BanglaCharacter {
  id: number
  unicode: string
  transliteration: string
  category: 'vowel' | 'consonant' | 'numeral'
  group: string
  sort_order: number
}

export const BANGLA_CHARACTERS: BanglaCharacter[] = [
  // Vowels (11)
  { id: 1, unicode: 'অ', transliteration: 'a', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 1 },
  { id: 2, unicode: 'আ', transliteration: 'aa', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 2 },
  { id: 3, unicode: 'ই', transliteration: 'i', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 3 },
  { id: 4, unicode: 'ঈ', transliteration: 'ii', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 4 },
  { id: 5, unicode: 'উ', transliteration: 'u', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 5 },
  { id: 6, unicode: 'ঊ', transliteration: 'uu', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 6 },
  { id: 7, unicode: 'ঋ', transliteration: 'ri', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 7 },
  { id: 8, unicode: 'এ', transliteration: 'e', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 8 },
  { id: 9, unicode: 'ঐ', transliteration: 'oi', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 9 },
  { id: 10, unicode: 'ও', transliteration: 'o', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 10 },
  { id: 11, unicode: 'ঔ', transliteration: 'ou', category: 'vowel', group: 'স্বরবর্ণ', sort_order: 11 },

  // Consonants (39)
  { id: 12, unicode: 'ক', transliteration: 'ko', category: 'consonant', group: 'কবর্গ', sort_order: 12 },
  { id: 13, unicode: 'খ', transliteration: 'kho', category: 'consonant', group: 'কবর্গ', sort_order: 13 },
  { id: 14, unicode: 'গ', transliteration: 'go', category: 'consonant', group: 'কবর্গ', sort_order: 14 },
  { id: 15, unicode: 'ঘ', transliteration: 'gho', category: 'consonant', group: 'কবর্গ', sort_order: 15 },
  { id: 16, unicode: 'ঙ', transliteration: 'ngo', category: 'consonant', group: 'কবর্গ', sort_order: 16 },
  { id: 17, unicode: 'চ', transliteration: 'cho', category: 'consonant', group: 'চবর্গ', sort_order: 17 },
  { id: 18, unicode: 'ছ', transliteration: 'chho', category: 'consonant', group: 'চবর্গ', sort_order: 18 },
  { id: 19, unicode: 'জ', transliteration: 'jo', category: 'consonant', group: 'চবর্গ', sort_order: 19 },
  { id: 20, unicode: 'ঝ', transliteration: 'jho', category: 'consonant', group: 'চবর্গ', sort_order: 20 },
  { id: 21, unicode: 'ঞ', transliteration: 'nyo', category: 'consonant', group: 'চবর্গ', sort_order: 21 },
  { id: 22, unicode: 'ট', transliteration: 'to', category: 'consonant', group: 'টবর্গ', sort_order: 22 },
  { id: 23, unicode: 'ঠ', transliteration: 'tho', category: 'consonant', group: 'টবর্গ', sort_order: 23 },
  { id: 24, unicode: 'ড', transliteration: 'do', category: 'consonant', group: 'টবর্গ', sort_order: 24 },
  { id: 25, unicode: 'ঢ', transliteration: 'dho', category: 'consonant', group: 'টবর্গ', sort_order: 25 },
  { id: 26, unicode: 'ণ', transliteration: 'no', category: 'consonant', group: 'টবর্গ', sort_order: 26 },
  { id: 27, unicode: 'ত', transliteration: 'to', category: 'consonant', group: 'তবর্গ', sort_order: 27 },
  { id: 28, unicode: 'থ', transliteration: 'tho', category: 'consonant', group: 'তবর্গ', sort_order: 28 },
  { id: 29, unicode: 'দ', transliteration: 'do', category: 'consonant', group: 'তবর্গ', sort_order: 29 },
  { id: 30, unicode: 'ধ', transliteration: 'dho', category: 'consonant', group: 'তবর্গ', sort_order: 30 },
  { id: 31, unicode: 'ন', transliteration: 'no', category: 'consonant', group: 'তবর্গ', sort_order: 31 },
  { id: 32, unicode: 'প', transliteration: 'po', category: 'consonant', group: 'পবর্গ', sort_order: 32 },
  { id: 33, unicode: 'ফ', transliteration: 'pho', category: 'consonant', group: 'পবর্গ', sort_order: 33 },
  { id: 34, unicode: 'ব', transliteration: 'bo', category: 'consonant', group: 'পবর্গ', sort_order: 34 },
  { id: 35, unicode: 'ভ', transliteration: 'bho', category: 'consonant', group: 'পবর্গ', sort_order: 35 },
  { id: 36, unicode: 'ম', transliteration: 'mo', category: 'consonant', group: 'পবর্গ', sort_order: 36 },
  { id: 37, unicode: 'য', transliteration: 'yo', category: 'consonant', group: 'অন্তঃস্থ', sort_order: 37 },
  { id: 38, unicode: 'র', transliteration: 'ro', category: 'consonant', group: 'অন্তঃস্থ', sort_order: 38 },
  { id: 39, unicode: 'ল', transliteration: 'lo', category: 'consonant', group: 'অন্তঃস্থ', sort_order: 39 },
  { id: 40, unicode: 'শ', transliteration: 'sho', category: 'consonant', group: 'ঊষ্ম', sort_order: 40 },
  { id: 41, unicode: 'ষ', transliteration: 'sho', category: 'consonant', group: 'ঊষ্ম', sort_order: 41 },
  { id: 42, unicode: 'স', transliteration: 'so', category: 'consonant', group: 'ঊষ্ম', sort_order: 42 },
  { id: 43, unicode: 'হ', transliteration: 'ho', category: 'consonant', group: 'ঊষ্ম', sort_order: 43 },
  { id: 44, unicode: 'ড়', transliteration: 'ro', category: 'consonant', group: 'পরবর্তী', sort_order: 44 },
  { id: 45, unicode: 'ঢ়', transliteration: 'rho', category: 'consonant', group: 'পরবর্তী', sort_order: 45 },
  { id: 46, unicode: 'য়', transliteration: 'yo', category: 'consonant', group: 'পরবর্তী', sort_order: 46 },
  { id: 47, unicode: 'ৎ', transliteration: 'to', category: 'consonant', group: 'বিশেষ', sort_order: 47 },
  { id: 48, unicode: 'ং', transliteration: 'n', category: 'consonant', group: 'বিশেষ', sort_order: 48 },
  { id: 49, unicode: 'ঃ', transliteration: 'h', category: 'consonant', group: 'বিশেষ', sort_order: 49 },
  { id: 50, unicode: 'ঁ', transliteration: 'm', category: 'consonant', group: 'বিশেষ', sort_order: 50 },

  // Numerals (10)
  { id: 51, unicode: '০', transliteration: '0', category: 'numeral', group: 'সংখ্যা', sort_order: 51 },
  { id: 52, unicode: '১', transliteration: '1', category: 'numeral', group: 'সংখ্যা', sort_order: 52 },
  { id: 53, unicode: '২', transliteration: '2', category: 'numeral', group: 'সংখ্যা', sort_order: 53 },
  { id: 54, unicode: '৩', transliteration: '3', category: 'numeral', group: 'সংখ্যা', sort_order: 54 },
  { id: 55, unicode: '৪', transliteration: '4', category: 'numeral', group: 'সংখ্যা', sort_order: 55 },
  { id: 56, unicode: '৫', transliteration: '5', category: 'numeral', group: 'সংখ্যা', sort_order: 56 },
  { id: 57, unicode: '৬', transliteration: '6', category: 'numeral', group: 'সংখ্যা', sort_order: 57 },
  { id: 58, unicode: '৭', transliteration: '7', category: 'numeral', group: 'সংখ্যা', sort_order: 58 },
  { id: 59, unicode: '৮', transliteration: '8', category: 'numeral', group: 'সংখ্যা', sort_order: 59 },
  { id: 60, unicode: '৯', transliteration: '9', category: 'numeral', group: 'সংখ্যা', sort_order: 60 },
]

export const VOWELS = BANGLA_CHARACTERS.filter((c) => c.category === 'vowel')
export const CONSONANTS = BANGLA_CHARACTERS.filter((c) => c.category === 'consonant')
export const NUMERALS = BANGLA_CHARACTERS.filter((c) => c.category === 'numeral')

export const getCharacterById = (id: number): BanglaCharacter | undefined =>
  BANGLA_CHARACTERS.find((c) => c.id === id)

export const TOTAL_CHARACTERS = BANGLA_CHARACTERS.length
