import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const REPORTS_STORAGE_KEY = 'dailyReports';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", 
  "August", "September", "October", "November", "December"];

export async function getAddressFromCoords(latitude, longitude) {
  
  // Ask for permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission to access location was denied');
    return null;
  }

  // Reverse geocode the coordinates
  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });

  if (place) {
    return place;
  } else {
    console.log('No location found');
    return null;
  }
}

export function formatDate(date) {

  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const formattedDate = `${dayOfWeek}, ${dayOfMonth} ${month} ${year}`;
  return formattedDate;
}

// This function format the date so that it is either the "Today" or "Yesterday".
// Otherwise it will be returned in the form: 'Day, DD Month YYYY'
export function formatDateReadable(dateString) {

  const date = new Date(dateString);
  const today = new Date();
  today.setDate(today.getDate());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return 'Today';
  }
  else if (isYesterday) {
    return 'Yesterday';
  }

  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };

  return date.toLocaleDateString('en-GB', options);
}

export function isSameDay(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export async function saveDailyReport(array) {
  try {
    const obj = JSON.stringify(array);
    await AsyncStorage.setItem(REPORTS_STORAGE_KEY, obj);
  } catch (error) {
    console.error('Failed to save activity array:', error);
  }
}

export async function loadDailyReports() {
  try {
     const json = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
    const parsed = json ? JSON.parse(json) : [];

    // If it's already an array, return it. If it's a single object, wrap it.
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    
    return [];
  } catch (error) {
    console.error('Failed to load activity array:', error);
    return [];
  }
}
