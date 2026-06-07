import axios from 'axios';
import { saveSuperEvent, getSuperEvent, addCoordinates } from './storeData.js';

// The JSON returned by the API contains an array for each activity
function processData(activities) {

  if (!Array.isArray(activities)) {
    console.error('Activities must be an array!');
    return [];
  }

  // An activity object is created
  return activities.map((activity) => {
    return {
      activityID: activity.summaryId,
      activityType: activity.activityType,
      activityDate: secondsToDate(activity.startTimeInSeconds).slice(0, 10),
      startingTime: secondsToHMS(activity.startTimeInSeconds),
      endingTime: secondsToHMS(activity.startTimeInSeconds + activity.durationInSeconds),
      activityDuration: secondsToHMS(activity.durationInSeconds).slice(11, 19),
      distance: activity.distanceInMeters / 1000,
      averageHeartRateBeatsPerMinute: activity.averageHeartRateInBeatsPerMinute,
      maxHeartRateBeatsPerMinute: activity.maxHeartRateInBeatsPerMinute,
      activeKilocalories: activity.activeKilocalories,
      startingLatitude: activity.startingLatitudeInDegree,
      startingLongitude: activity.startingLongitudeInDegree,
      steps: activity.steps,
      deviceName: activity.deviceName
    };
  });
}

function secondsToDate(seconds) {
  const date = new Date(seconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function secondsToHMS(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString();
}

// This function converts seconds to the format: {hours}hrs {minutes}min
function secondsToHours(seconds) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = '';
  if (hours > 0) result += `${hours} hr${hours > 1 ? 's' : ''}`;
  if (minutes > 0) result += `${hours > 0 ? ' ' : ''}${minutes} min`;

  return result || '0 min';
}

function dateToEpochs(todaysDate) {
  const date = new Date(todaysDate); 
  return Math.floor(date.getTime() / 1000);
}

// A raw daily health report needs to be formatted before being sent to the client
function formatDaily(daily) {

  return {
    summaryId: daily.summaryId,
    calendarDate: daily.calendarDate,
    activeCalories: daily.activeKilocalories,
    bmrKilocalories: daily.bmrKilocalories,
    steps: daily.steps,
    distance: daily.distanceInMeters / 1000,
    duration: secondsToHours(daily.durationInSeconds),
    activeTime: secondsToHours(daily.activeTimeInSeconds),
    moderateIntensity: secondsToHours(daily.moderateIntensityDurationInSeconds),
    vigorousIntensity: secondsToHours(daily.vigorousIntensityDurationInSeconds),
    floorsClimbed: daily.floorsClimbed,
    minHeartRate: daily.minHeartRateInBeatsPerMinute,
    maxHeartRate: daily.maxHeartRateInBeatsPerMinute,
    avgHeartRate: daily.averageHeartRateInBeatsPerMinute,
    restingHeartRate: daily.restingHeartRateInBeatsPerMinute,
    avgStressLevel: daily.averageStressLevel,
    maxStressLevel: daily.maxStressLevel,
    stressDuration: secondsToHours(daily.stressDurationInSeconds),
    restStressDuration: secondsToHours(daily.restStressDurationInSeconds),
    activityStressDuration: secondsToHours(daily.activityStressDurationInSeconds),
    lowStressDuration: secondsToHours(daily.lowStressDurationInSeconds),
    stressQualifier: daily.stressQualifier
  };
}

async function feedModel(data) {
  let superEvent = null;

  // If the wearable device's coordinates are missing, those collected by the mobile device will be used instead
  const tasks = data.map(async (event) => {
    if (typeof event.watchLatitude === 'undefined' || typeof event.watchLongitude === 'undefined') {
      event.watchLatitude = event.phoneLatitude;
      event.watchLongitude = event.phoneLongitude;
    }

    // A set of features is assembled to serve as input to the model.
    const features = [
      getTimeDifference(event.startDate, event.activityStart),
      getTimeDifference(event.endDate, event.activityEnd),
      getDayOfTheWeekMatch(event.startDate, event.activityStart),
      haversineDistance(
        event.phoneLatitude,
        event.phoneLongitude,
        event.watchLatitude,
        event.watchLongitude
      )
    ];

    const predictPayload = {
      features,
      title: event.title,
      type: event.activityType
    };

    const combinePayload = {
      title: event.title,
      type: event.activityType
    };

    try {
      console.log("\nSending predict-payload: ", predictPayload);

      const predictRes = await axios.post('http://localhost:8000/predict', predictPayload);
      const { linked, similarity, confidence } = predictRes.data;

      features.push(similarity);

      console.log("Predict success: ");
      console.log("Linked: ", linked);
      console.log("Similarity: ", similarity);
      console.log("Confidence: ", confidence);
      console.log("Final features: ", features);

      console.log("Sending combine_texts-payload:", combinePayload);

      const combineRes = await axios.post('http://localhost:8000/combine_texts', combinePayload);

      console.log("Combine_texts success:");
      console.log("Combined text:", combineRes.data.combined_text);

      await saveSuperEvent(
        event.activityId, 
        combineRes.data.combined_text.replace(/^'+|'+$/g, '').trim(), 
        event.description,
        event.watchLatitude, 
        event.watchLongitude
      );
      superEvent = await getSuperEvent(event.activityId);
      console.log("Super-Event returned: ", superEvent);
    } catch (err) {
      if (err.response) {
        console.error("API error: ");
        console.error("Status: ", err.response.status);
        console.error("Data: ", err.response.data);
      } else if (err.request) {
        console.error("No response received from server");
        console.error("Request: ", err.request);
      } else {
        console.error("Request setup error: ", err.message);
      }
    }
  });

  await Promise.all(tasks);
  return superEvent;
}

function getTimeDifference(date1, date2) {
  const newDate1 = new Date(date1);
  const newDate2 = new Date(date2);
  const diffMs = Math.abs(newDate1 - newDate2);
  return diffMs / (1000 * 60); // Convert to minutes
}

function getDayOfTheWeekMatch(date1, date2) {
  const day1 = new Date(date1);
  const day2 = new Date(date2);
  if (day1.getUTCDay() == day2.getUTCDay()) {
    return 1;
  }
  return 0;
}

// The distance between the coordinates is calculated using the Harvesine formula
// This code was taken from:
// https://www.geeksforgeeks.org/dsa/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
function haversineDistance(lat1, lon1, lat2, lon2) {

  let dLat = (lat2 - lat1) * Math.PI / 180.0;
  let dLon = (lon2 - lon1) * Math.PI / 180.0;
    
  // Convert to radiants
  lat1 = (lat1) * Math.PI / 180.0;
  lat2 = (lat2) * Math.PI / 180.0;
  
  // Apply formula
  let a = Math.pow(Math.sin(dLat / 2), 2) + 
            Math.pow(Math.sin(dLon / 2), 2) * 
            Math.cos(lat1) * 
            Math.cos(lat2);
  let rad = 6371;
  let c = 2 * Math.asin(Math.sqrt(a));
  return rad * c;
}

export { processData, dateToEpochs, formatDaily, feedModel };
