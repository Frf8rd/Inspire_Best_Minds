/**
 * Pe telefon real (Expo Go) "localhost" înseamnă telefonul, nu PC-ul:
 * setează EXPO_PUBLIC_API_URL la IP-ul din rețeaua locală, ex. http://192.168.1.10:5000/api
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
