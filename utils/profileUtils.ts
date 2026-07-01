export type NameLocale = 'id' | 'en';
export type NameGender = 'female' | 'male';

export const PROFILE_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be123c',
  '#4f46e5',
  '#0f766e',
  '#7c3aed',
];

export const NAME_POOLS: Record<NameLocale, Record<NameGender, { first: string[]; last: string[] }>> = {
  id: {
    female: {
      first: ['Ayu', 'Dinda', 'Salsa', 'Nadia', 'Rani', 'Putri', 'Citra', 'Intan', 'Maya', 'Nisa', 'Tiara', 'Laras', 'Anisa', 'Vina'],
      last: ['Prameswari', 'Kusuma', 'Rahmawati', 'Permata', 'Safitri', 'Anggraini', 'Lestari', 'Wulandari', 'Pertiwi', 'Oktaviani'],
    },
    male: {
      first: [
        'Agus', 'Bambang', 'Budi', 'Dedi', 'Eko', 'Hendra', 'Joko', 'Rudi', 'Slamet', 'Sutrisno',
        'Suyanto', 'Teguh', 'Wawan', 'Yanto', 'Tono', 'Herman', 'Darmawan', 'Kusnadi', 'Mulyono', 'Suhendra',
        'Dadang', 'Asep', 'Ujang', 'Cecep', 'Dadan', 'Usep', 'Iwan', 'Wahyudi', 'Haryanto', 'Sukardi',
        'Rizky', 'Bima', 'Fajar', 'Dimas', 'Arif', 'Bagas', 'Raka', 'Andi', 'Rian', 'Yoga', 'Ilham', 'Rafi', 'Doni', 'Galih',
      ],
      last: [
        'Santoso', 'Purnomo', 'Suryanto', 'Haryanto', 'Supriyanto', 'Gunawan', 'Hartono', 'Susilo', 'Widodo', 'Mulyadi',
        'Setiawan', 'Kurniawan', 'Wibowo', 'Prabowo', 'Nugroho', 'Suharto', 'Sulaiman', 'Hasan', 'Abdullah', 'Iskandar',
        'Siregar', 'Nasution', 'Simanjuntak', 'Sinaga', 'Manurung', 'Panjaitan', 'Lubis', 'Tampubolon', 'Hutagalung', 'Harahap',
        'Pratama', 'Saputra', 'Wijaya', 'Firmansyah', 'Nugraha', 'Ramadhan', 'Maulana', 'Hakim',
      ],
    },
  },
  en: {
    female: {
      first: ['Emma', 'Olivia', 'Ava', 'Sophia', 'Mia', 'Isabella', 'Amelia', 'Harper', 'Ella', 'Grace', 'Chloe', 'Lily', 'Zoe', 'Nora'],
      last: ['Parker', 'Bennett', 'Morgan', 'Reed', 'Collins', 'Bailey', 'Brooks', 'Hayes', 'Foster', 'Cooper'],
    },
    male: {
      first: ['Noah', 'Liam', 'Ethan', 'Lucas', 'Mason', 'Logan', 'James', 'Henry', 'Owen', 'Caleb', 'Miles', 'Leo', 'Jack', 'Ryan'],
      last: ['Carter', 'Miller', 'Wilson', 'Anderson', 'Taylor', 'Walker', 'Harris', 'Clark', 'Lewis', 'Young'],
    },
  },
};

export const getInitials = (displayName: string) =>
  displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

export const createUsername = (displayName: string, index: number) => {
  const base = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  const suffix = Math.floor(100 + Math.random() * 900) + index;
  return `@${base}${suffix}`;
};

export const createRandomProfiles = (count: number, locale: NameLocale, gender: NameGender) => {
  const pool = NAME_POOLS[locale][gender];
  const usedNames = new Set<string>();

  return Array.from({ length: count }, (_, index) => {
    let displayName = '';
    let attempts = 0;

    do {
      const first = pool.first[Math.floor(Math.random() * pool.first.length)];
      const last = pool.last[Math.floor(Math.random() * pool.last.length)];
      displayName = `${first} ${last}`;
      attempts += 1;
    } while (usedNames.has(displayName) && attempts < 50);

    usedNames.add(displayName);

    return {
      displayName,
      username: createUsername(displayName, index),
      avatarInitials: getInitials(displayName),
      avatarColor: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
      avatarUrl: null,
    };
  });
};
