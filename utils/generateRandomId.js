export const generateRandomId = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit ID
}