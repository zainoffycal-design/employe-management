// Avatar utility functions for generating reliable avatar URLs

export const generateAvatarUrl = (name, size = 200) => {
  if (!name) return null;
  
  // Use a more reliable avatar service
  const encodedName = encodeURIComponent(name.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=15a970&textColor=ffffff&size=${size}`;
};

export const generateFallbackAvatar = (name) => {
  if (!name) return null;
  
  // Alternative fallback using a different service
  const encodedName = encodeURIComponent(name.trim());
  return `https://ui-avatars.com/api/?name=${encodedName}&background=15a970&color=fff&size=200`;
};

export const getAvatarUrl = (user) => {
  if (!user) return null;
  
  // If user has a custom avatar, use it
  if (user.avatar && user.avatar.startsWith('http')) {
    return user.avatar;
  }
  
  // Otherwise generate one based on name
  return generateAvatarUrl(user.name);
}; 