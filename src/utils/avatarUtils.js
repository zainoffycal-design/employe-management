export const generateAvatarUrl = (name, size = 200) => {
  if (!name) return null;
  
  const encodedName = encodeURIComponent(name.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=15a970&textColor=ffffff&size=${size}`;
}; 