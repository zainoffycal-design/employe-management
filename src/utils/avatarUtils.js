export const generateAvatarUrl = (name, size = 200) => {
  if (!name) return null;
  
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  
  const words = trimmedName.split(' ').filter(word => word.length > 0);
  const firstInitial = words.length > 0 ? words[0].charAt(0).toUpperCase() : '?';
  
  const encodedName = encodeURIComponent(firstInitial);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=15a970&textColor=ffffff&size=${size}`;
}; 