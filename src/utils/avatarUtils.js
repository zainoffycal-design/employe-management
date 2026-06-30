const AVATAR_BG = '6366f1';

export const generateAvatarUrl = (name, size = 200) => {
  if (!name) return null;

  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const words = trimmedName.split(' ').filter((word) => word.length > 0);
  const firstInitial = words.length > 0 ? words[0].charAt(0).toUpperCase() : '?';

  const encodedName = encodeURIComponent(firstInitial);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=${AVATAR_BG}&textColor=ffffff&size=${size}`;
};

const isDicebearInitialsUrl = (url) => {
  const lower = url.toLowerCase();
  return lower.includes('api.dicebear.com') && lower.includes('/initials/');
};

export const resolveAvatarUrl = (src, name, size = 200) => {
  if (!src || isDicebearInitialsUrl(src)) {
    return generateAvatarUrl(name, size);
  }
  return src;
};
