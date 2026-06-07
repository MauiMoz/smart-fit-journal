import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Map in which the count for activity types is to be found
const STORAGE_KEY = 'activityMap';

// Map with the date of the last scheduled activity for activity type
const ACTIVITIES_KEY = 'finishedActivities';

// Helpers to load maps from AsyncStorage
async function loadActivityMap() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? new Map(JSON.parse(json)) : new Map();
  } catch (error) {
    console.error('Failed to load activity map:', error);
    return new Map();
  }
}

async function loadFinishedActivities() {
  try {
    const json = await AsyncStorage.getItem(ACTIVITIES_KEY);
    return json ? new Map(JSON.parse(json)) : new Map();
  } catch (error) {
    console.error('Failed to load finished activities:', error);
    return [];
  }
}

// Helpers to save maps to AsyncStorage
async function saveActivityMap(map) {
  try {
    const obj = JSON.stringify(Array.from(map.entries()));
    await AsyncStorage.setItem(STORAGE_KEY, obj);
  } catch (error) {
    console.error('Failed to save activity map:', error);
  }
}

async function saveFinishedActivities(map) {
  try {
    const obj = JSON.stringify(Array.from(map.entries()));
    await AsyncStorage.setItem(ACTIVITIES_KEY, obj);
  } catch (error) {
    console.error('Failed to save finished activities map:', error);
  }
}

function utcToDate(date) {

  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

export async function scheduleActivity(activity) {

  const loadedActivityMap = await loadActivityMap();
  const finishedActivities = await loadFinishedActivities();
  console.log("Activity: ", activity);

  const date = new Date(activity.startingTime);
  console.log("Date of the activity: ", date);

  const dayIndex = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const dayName = daysOfWeek[dayIndex];
  console.log("Day of the week:", dayName);

  // If it is the first time doing this activity, a new key-value pair is set
  if (!loadedActivityMap.has(activity.activityType)) {
    loadedActivityMap.set(activity.activityType, [
      { day: "Sunday", hours: 0, minutes: 0, count: 0 },
      { day: "Monday", hours: 0, minutes: 0, count: 0 },
      { day: "Tuesday", hours: 0, minutes: 0, count: 0 },
      { day: "Wednesday", hours: 0, minutes: 0, count: 0 },
      { day: "Thursday", hours: 0, minutes: 0, count: 0 },
      { day: "Friday", hours: 0, minutes: 0, count: 0 },
      { day: "Saturday", hours: 0, minutes: 0, count: 0 }
    ]);
  }

  const todaysDate = utcToDate(new Date(activity.startingTime));

  // If the activity is new its type and date are added to the finished activities map
  // Else, if the activity session in question was not supposed to be the next one scheduled,
  // the activity is penalized
  try {
    if (!finishedActivities.has(activity.activityType)) {
      finishedActivities.set(
        activity.activityType, 
        new Date(activity.startingTime)
      );
      console.log("New type of activity added to the map: ", activity.activityType);
    } else {
      const previousDate = utcToDate(new Date(finishedActivities.get(activity.activityType)));
      console.log("Previous date: ", previousDate, ", today's date: ", todaysDate);
      if (previousDate !== todaysDate) {
        penalizeEvent(loadedActivityMap, 
          activity.activityType, 
          finishedActivities.get(activity.activityType)
        );
        console.log(`Booked event skipped. Related activity (${activity.activityType}) penalized!`);
      }
    }
  } catch (error) {
    console.log("Error processing the activity: ", error);
  }

  const activityArray = loadedActivityMap.get(activity.activityType);
  const startDate = new Date(activity.startingTime);
  let startIndex = 0;
  
  // The count is increased for this day and specific activity type
  // The count must not exceed the number 3
  for (const item of activityArray) {
    if (item.day === dayName) {
      if (item.count !== 3) {
        item.count++;
        item.hours = startDate.getHours();
        item.minutes = startDate.getMinutes();
        console.log(`Count incremented by 1 for ${activity.activityType} on ${dayName}`);
      }
      console.log("The count for this activity is already 3");
      startIndex = (activityArray.indexOf(item) + 1) % activityArray.length;
      break;
    }
  }

  const length = activityArray.length;
  let i = startIndex;
  let daysCount = 0;

  do {

    if (!activityArray[i]) {
      console.error(`Index ${i} is undefined in the activities array`);
      break;
    }

    daysCount++;

    // If there are at least 2 events registered for this activity in the same day of the week
    // the same activity will be booked for the next time
    if (activityArray[i].count >= 2) {
      console.log(`Activity ${activity.activityType} needs to e booked on next ${activityArray[i].day}!`);
      try {
        bookActivity(activity, daysCount, activityArray[i].hours, activityArray[i].minutes);
      } catch (error) {
        console.log("Error while booking the next activity: ", error);
      }
      break;
    }

    i = (i + 1) % length;
  } while (i !== startIndex);

  await saveActivityMap(loadedActivityMap);
  await saveFinishedActivities(finishedActivities)

  console.log("Map of activities: ", loadedActivityMap);
}

async function getCalendarPermission() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    console.log('Calendar permission not granted');
    return false;
  }
  return true;
}

async function getDefaultCalendarId() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(cal => cal.allowsModifications);
  return defaultCalendar?.id;
}

async function hasCalendarConflict(startDate, endDate, activity) {

  const windowRange = 3;
  const windowLeft = new Date(startDate);
  const windowRight = new Date(endDate);

  windowLeft.setHours(windowLeft.getHours() - windowRange);
  windowRight.setHours(windowRight.getHours() + windowRange);

  const hasPermission = await getCalendarPermission();
  if (!hasPermission) return false;

  const calendarId = await getDefaultCalendarId();

  try{
    console.log("Calendar ID: ", calendarId);
  } catch (error) {
    console.log("Error fetching calendar ID: ", error);
  }

  if (!calendarId) return false;

  // Fetch events from system calendar
  const events = await Calendar.getEventsAsync(
    [calendarId],
    windowLeft,
    windowRight
  );

  let delay = 0;
  let conflict = false;
  let endSearch = false;

  for (const event of events) {

    // If the event was already booked it does not count
    if (event.title.includes(`Booked Event: ${activity.activityType.toString().replace("_", " ")}`)) {
      conflict = true;
      break;
    }

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    // If there is a conflicting event the system will try to book the event
    // an hour earlier or an hour later, depending on when there is a free space.
    // if no free space is found the activity will not be booked
    if (eventEnd >= startDate && eventStart <= startDate) {
      // Move activity later
      if (endSearch) {conflict = true; break;}
      startDate.setHours(startDate.getHours() + 1);
      endDate.setHours(endDate.getHours() + 1);
      endSearch = true;
      delay++;
    } else if (eventEnd >= endDate && eventStart <= endDate) {
      // Move activity earlier
      if (endSearch) {conflict = true; break;}
      startDate.setHours(startDate.getHours() - 1);
      endDate.setHours(endDate.getHours() - 1);
      endSearch = true;
      delay--;
    } else {
      // Activity can not be booked
      break;
    }
  }

  return {hasConflict: conflict, hasDelay: delay};
}

function parseDurationToHours(durationStr) {
  const [hours, minutes, seconds] = durationStr.split(':').map(Number);
  return hours + minutes / 60 + seconds / 3600;
}

async function bookActivity(activity, daysToAdd, hours, minutes) {

  const nextTime = new Date(activity.startingTime);
  nextTime.setDate(nextTime.getDate() + daysToAdd);
  nextTime.setHours(hours, minutes);
  const endTime = new Date(nextTime);
  endTime.setHours(endTime.getHours() + parseDurationToHours(activity.activityDuration));

  console.log("Next activity from ", nextTime, " to ", endTime);

  // Check for possible calendar conflicts
  const event = await hasCalendarConflict(nextTime, endTime, activity);

  if (event.hasConflict) {
    console.log("Calendar conflicts found, the activity can not be scheduled!");
    return;
  } else {
    const calendarId = await getDefaultCalendarId();
    await Calendar.createEventAsync(calendarId, {
      title: `Booked Event: ${activity.activityType.toString().replace("_", " ")}`,
      startDate: nextTime,
      endDate: endTime,
      alarms: [
        { relativeOffset: -120 } // Notification 2 hours earlier
      ]
    });
    console.log(`No calendar conflict found, 
      ${activity.activityType} booked from ${nextTime} to ${endTime}`);
    const finishedActivities = await loadFinishedActivities();
    finishedActivities.set(activity.activityType, nextTime);
    saveFinishedActivities(finishedActivities);
  }
}

async function penalizeEvent(activities, activityType, lastDate) {

  const date = new Date(lastDate);
  const dayIndex = date.getDay();
  const dayName = daysOfWeek[dayIndex];
  const dayEntries = activities.get(activityType);
  const entry = dayEntries.find(activity => activity.day === dayName);

  console.log("Day: ", dayName, ", Activity: ", entry, ", Count: ", entry.count);

  // An activity is penalized only if it was done 3 times already
  if (entry.count === 3) {
    // The count is decreased unless it is already 0
    entry.count = Math.max(0, entry.count - 1);
  }

  console.log("Penalized Count: ", entry.count);

  await saveActivityMap(activities);
  console.log("Activities map after penalization: ", activities);
}