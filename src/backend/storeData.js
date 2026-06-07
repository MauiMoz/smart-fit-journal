import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: parseInt(process.env.DATABASE_PORT, 10),
});

async function saveUser(userID, firebaseID, accessToken, accessTokenSecret) {

   const insertQuery = `
    INSERT INTO SmartFitUsers (UserID, FirebaseID, AccessToken, AccessTokenSecret)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (UserID) DO NOTHING;
  `;

  try {
    await pool.query(insertQuery, [userID, firebaseID, accessToken, accessTokenSecret]);
    console.log('User inserted successfully');
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function saveActivity(activities) {

  const insertQuery = `
    INSERT INTO Activities (ActivityID, ActivityType, ActivityDate, StartingTime, EndingTime, 
      ActivityDuration, Distance, AverageHeartRateBeatsPerMinute, MaxHeartRateBeatsPerMinute,
      ActiveKilocalories, StartingLatitude, StartingLongitude, Steps, DeviceName)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (ActivityID) DO NOTHING;
  `;

  try {
    for (const activity of activities) {
      await pool.query(insertQuery, [activity.activityID, activity.activityType, activity.activityDate,
        activity.startingTime, activity.endingTime, activity.activityDuration, activity.distance, 
        activity.averageHeartRateBeatsPerMinute, activity.maxHeartRateBeatsPerMinute, 
        activity.activeKilocalories, activity.startingLatitudeInDegree, activity.startingLongitudeInDegree, 
	      activity.steps, activity.deviceName]
      );
    }
    console.log('Activities inserted successfully');
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function saveSuperEvent(activityId, title, description, latitude, longitude) {

  const insertQuery = `
    INSERT INTO Superevent (ActivityID, EventTitle, EventDescription, EventLatitude, EventLongitude)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (ActivityID, EventTitle) DO NOTHING;
  `;

  try {
    console.log('Super event inserted successfully');
    await pool.query(insertQuery, [activityId, title, description, latitude, longitude]);
    console.log('Super event inserted successfully');
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function getFirebaseID(userID) {
  try {
    const result = await pool.query(
      'SELECT FirebaseID FROM SmartFitUsers WHERE UserID = $1',
      [userID]
    );
    return result.rows[0]?.firebaseid || null;
  } catch (error) {
    console.error('Error retrieving Firebase ID:', error);
    return null;
  }
}

async function getAccessTokens(firebaseID) {
 try {
    const result = await pool.query(
      'SELECT AccessToken, AccessTokenSecret FROM SmartFitUsers WHERE FirebaseID = $1',
      [firebaseID]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return null;
  }
}

async function getSuperEvent(activityID) {
  try {
    const result = await pool.query(
      `SELECT
        activity.*, 
        superevent.EventTitle, 
        superevent.EventDescription,
        superevent.EventLatitude, 
        superevent.EventLongitude
      FROM 
        Activities activity 
        LEFT JOIN Superevent superevent ON activity.ActivityID = superevent.ActivityID 
      WHERE 
        activity.ActivityID = $1`,
      [activityID]
    );
    return result.rows.length > 0 ? result.rows : null;
  } catch (error) {
    console.error('Error retrieving superevent:', error);
    return null;
  }
}

async function addCoordinates(activityId, latitude, longitude) {

  const insertQuery = `
    UPDATE Superevent
    SET EventLatitude = $1,
      EventLongitude = $2
    WHERE ActivityID = $3;
  `;

  try {
    console.log('Coordinates inserted successfully');
    await pool.query(insertQuery, [activityId, latitude, longitude]);
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

export { saveUser, saveActivity, saveSuperEvent, getFirebaseID, getAccessTokens, getSuperEvent, addCoordinates };
