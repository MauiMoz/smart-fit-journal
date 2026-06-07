CREATE TABLE SmartFitUsers (
  UserID UUID PRIMARY KEY,
  FirebaseID VARCHAR(50),
  AccessToken UUID,
  AccessTokenSecret VARCHAR(50)
);

CREATE TABLE Activities (
  ActivityID VARCHAR(50) PRIMARY KEY,
  ActivityType VARCHAR(50),
  ActivityDate DATE,
  StartingTime TIMESTAMPTZ, 
  EndingTime TIMESTAMPTZ, 
  ActivityDuration TIME, 
  Distance DECIMAL, 
  AverageHeartRateBeatsPerMinute INTEGER,
  MaxHeartRateBeatsPerMinute INTEGER,
  ActiveKilocalories INTEGER,
  StartingLatitude DOUBLE PRECISION,
  StartingLongitude DOUBLE PRECISION,
  Steps INTEGER,
  DeviceName VARCHAR(50)
);

CREATE TABLE Superevent (
  EventID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ActivityID VARCHAR(50),
  EventTitle VARCHAR(100),
  EventDescription VARCHAR(1000),
  EventLatitude DOUBLE PRECISION,
  EventLongitude DOUBLE PRECISION,
  FOREIGN KEY (ActivityID) REFERENCES Activities(ActivityID),
  UNIQUE (ActivityID, EventTitle)
);