// Avatar utility functions for generating reliable avatar URLs

export const generateAvatarUrl = (name, size = 200) => {
  if (!name) return null;
  
  // Use a more reliable avatar service
  const encodedName = encodeURIComponent(name.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=15a970&textColor=ffffff&size=${size}`;
}; 