// Utility for generating consistent user colors based on username

export interface UserColorScheme {
  bg: string;
  text: string;
  border: string;
  gradient: string; // For avatar backgrounds
}

const colorSchemes: UserColorScheme[] = [
  { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-200',
    gradient: 'bg-gradient-to-br from-red-500 to-red-600'
  },
  { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-200',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    border: 'border-green-200',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600'
  },
  { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800', 
    border: 'border-yellow-200',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
  },
  { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800', 
    border: 'border-purple-200',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  { 
    bg: 'bg-pink-100', 
    text: 'text-pink-800', 
    border: 'border-pink-200',
    gradient: 'bg-gradient-to-br from-pink-500 to-pink-600'
  },
  { 
    bg: 'bg-indigo-100', 
    text: 'text-indigo-800', 
    border: 'border-indigo-200',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  },
  { 
    bg: 'bg-orange-100', 
    text: 'text-orange-800', 
    border: 'border-orange-200',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  { 
    bg: 'bg-teal-100', 
    text: 'text-teal-800', 
    border: 'border-teal-200',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-600'
  },
  { 
    bg: 'bg-cyan-100', 
    text: 'text-cyan-800', 
    border: 'border-cyan-200',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  },
  { 
    bg: 'bg-lime-100', 
    text: 'text-lime-800', 
    border: 'border-lime-200',
    gradient: 'bg-gradient-to-br from-lime-500 to-lime-600'
  },
  { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-800', 
    border: 'border-emerald-200',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  { 
    bg: 'bg-sky-100', 
    text: 'text-sky-800', 
    border: 'border-sky-200',
    gradient: 'bg-gradient-to-br from-sky-500 to-sky-600'
  },
  { 
    bg: 'bg-violet-100', 
    text: 'text-violet-800', 
    border: 'border-violet-200',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-600'
  },
  { 
    bg: 'bg-rose-100', 
    text: 'text-rose-800', 
    border: 'border-rose-200',
    gradient: 'bg-gradient-to-br from-rose-500 to-rose-600'
  },
];

/**
 * Generate a consistent color hash for a username
 * @param username - The username to generate colors for
 * @returns Hash value for consistent color selection
 */
function generateUserHash(username: string): number {
  if (username.length === 0) return 0;
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive index
  return Math.abs(hash) % colorSchemes.length;
}

/**
 * Get color scheme for a user based on their username
 * @param username - The username to generate colors for
 * @returns UserColorScheme object with all color classes
 */
export function getUserColorScheme(username: string): UserColorScheme {
  const colorIndex = generateUserHash(username);
  return colorSchemes[colorIndex];
}

/**
 * Get color classes string for meal card badges (backwards compatibility)
 * @param username - The username to generate colors for
 * @returns Space-separated string of CSS classes
 */
export function getUserColor(username: string): string {
  const scheme = getUserColorScheme(username);
  return `${scheme.bg} ${scheme.text} ${scheme.border}`;
}

/**
 * Get gradient background class for user avatars
 * @param username - The username to generate colors for
 * @returns CSS gradient class string
 */
export function getUserAvatarGradient(username: string): string {
  const scheme = getUserColorScheme(username);
  return scheme.gradient;
}
