import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Menu, Provider } from 'react-native-paper';
import { io } from 'socket.io-client';
import { scheduleActivity } from '../activityBooking';
import { formatDate, loadDailyReports, saveDailyReport } from '../helperFunctions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// This component displays the Homepage with the super-events received from the back end
export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState(false);
  const socketRef = useRef(null);
  const [superEventsStack, setSuperEventsStack] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    (async () => {

      await loadSuperEvents();

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Calendar permission not granted');
        return;
      }

      fetchEventsForDate(selectedDate);

      // Initialize a socket.io client
      if (!socketRef.current) {
        socketRef.current = io(process.env.EXPO_PUBLIC_CALLBACK_ADDRESS, {
          transports: ['websocket'],
          timeout: 10000,
        });

        const firebaseID = getFirebaseIDFromAuth();

        // Get the current user's Firebase ID and join a private room based on that ID
        socketRef.current.on('connect', () => {
          console.log('Connected to socket.io server');
          console.log('FirebaseID: ', firebaseID);
          socketRef.current.emit('join-room', firebaseID);
        });

        const start = new Date();
        start.setDate(start.getDate() - 1);
        const end = new Date();

        // Update daily activities
        socketRef.current.emit('update-dailies', firebaseID, start, end);

        socketRef.current.on('dailies-data', async (data) => {
          try {
            console.log('Received tokens:', data);
            const reports = await loadDailyReports() || [];
            if (reports.length > 0 && reports.at(-1).calendarDate === data.calendarDate) {
              reports.pop();
            }
            reports.push(data);
            await saveDailyReport(reports); 
            const updatedReports = await loadDailyReports();
            console.log("Updated reports:", updatedReports);
          } catch (error) {
            console.error("Error processing dailies data:", error);
          }
        });

        // When the server sends a new-activity message it unwraps the activity if this comes inside an array
        socketRef.current.on('new-activity', async (activityData) => {

          console.log('New activity received:', activityData);
          
          const activity = Array.isArray(activityData) ? activityData[0] : activityData;

          scheduleActivity(activity);

          const conflicts = await checkConflictingEvents(
            activity.activityDate,
            activity.startingTime,
            activity.endingTime
          );

          if (conflicts.length > 0) {

            // Send push notification
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Activity Conflict Detected',
                body: 'A related calendar event was found',
              },
              trigger: null,
            });
          }

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
          }

          // The location is obtained from the mobile device
          let location = await Location.getLastKnownPositionAsync({});
          setLocation(location);

          // An array of objects will be returned to the server
          const responseData = conflicts.map(conflict => ({
            activityId: activity.activityID,
            startDate: conflict.startDate,
            endDate: conflict.endDate,
            activityStart: activity.startingTime,
            activityEnd: activity.endingTime,
            phoneLatitude: location.coords.latitude,
            phoneLongitude: location.coords.longitude,
            watchLatitude: activity.startingLatitude,
            watchLongitude: activity.startingLongitude,
            title: conflict.title,
            description: conflict.notes ?? "",
            activityType: activity.activityType
          }));

          console.log('Response Data: ', responseData);

          // Send essential event data back to the server
          socketRef.current.emit('activity-conflicts', responseData);
        });

        socketRef.current.on('new-super-event', (superEvents) => {
          console.log('New super-events received', superEvents);
          if (superEvents.length > 0) {
            addEventToStack(superEvents);
          }
        });
      }
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-activity');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  function getFirebaseIDFromAuth() {
    const user = getAuth().currentUser;
    return user?.uid;
  }

  // Super events are stored in the device
  const SUPER_EVENTS_KEY = 'superEventsStack';

  const loadSuperEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem(SUPER_EVENTS_KEY);
      if (storedEvents) {
        setSuperEventsStack(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error('Failed to load super events:', error);
    }
  };

  const saveSuperEvents = async (events) => {
    try {
      await AsyncStorage.setItem(SUPER_EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save super events:', error);
    }
  };

  function addEventToStack(newSuperEvents) {
    setSuperEventsStack((prev) => {
      const updated = [...newSuperEvents, ...prev];
      saveSuperEvents(updated);
      return updated;
    });
  }

  // Get all calendars on the device and fetch events for the specific day from each calendar
  const fetchEventsForDate = async (date) => {

    const calendars = await Calendar.getCalendarsAsync();

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    let allEvents = [];

    for (const calendar of calendars) {
      const events = await Calendar.getEventsAsync([calendar.id], start, end);
      allEvents = [...allEvents, ...events];
    }
    allEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    setEvents(allEvents);
  };

  const checkConflictingEvents = async (activityDateStr, startingTimeStr, endingTimeStr) => {

    console.log('Date: ', activityDateStr, ' Start: ', startingTimeStr, ' End: ', endingTimeStr);

    try {
      const activityStartTime = new Date(startingTimeStr);
      const activityEndTime = new Date(endingTimeStr);

      if (isNaN(activityStartTime)) {
        console.warn('Invalid combined activity start time:', `${activityDateStr}T${startingTimeStr}Z`);
        return false;
      }

      // All the events in the 24 hours around the activity need to be selected
      const windowStart = new Date(activityStartTime.getTime() - 12 * 60 * 60 * 1000);
      const windowEnd = new Date(activityEndTime.getTime() + 12 * 60 * 60 * 1000);
      
      // The valid events are those that overlap with a window from 1 hour before the event start 
      // and 1 hour after the event end
      const eventWindowStart = new Date(activityStartTime.getTime() - 1 * 60 * 60 * 1000);
      const eventWindowEnd = new Date(activityEndTime.getTime() + 1 * 60 * 60 * 1000);

      // Get writable calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writableCalendars = calendars.filter(cal => cal.allowsModifications);

      if (writableCalendars.length === 0) {
        console.warn('No writable calendar found');
        return false;
      }
  
      // Fetch events from all writable calendars between the window
      const events = await Calendar.getEventsAsync(
        writableCalendars.map(cal => cal.id),
        windowStart,
        windowEnd
      );

      // Check for overlapping events
      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        // Events booked by the system do not count
        if (event.title.includes('Booked Event: ')) {
          return false;
        }

        return eventEnd >= eventWindowStart && eventStart <= eventWindowEnd;
      });

      console.log('Looking for events between:', windowStart.toISOString(), 'and', windowEnd.toISOString());
      if (conflictingEvents.length > 0) {
        console.log('Found events:', conflictingEvents);
      }
  
      return conflictingEvents;
    } catch (error) {
      console.error('Error checking calendar events:', error);
      return false;
    }
  };  

  // 3-dotted Menu options
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleOptionSelect = (option) => {
    closeMenu();
    if (option === 'option1') {
      router.replace('/(tabs)/userProfile');
    } else if (option === 'option2') {
      router.replace('/(tabs)/helpPage');
    }
  };

  return (
    <Provider>
      <View style={styles.header}>
          <Text style={styles.title}> My Events </Text>
          <View style={styles.menu}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              color="#0b1e28"
              anchor={
                <TouchableOpacity onPress={openMenu}>
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item 
                style={styles.menuItem} 
                color='#606060'
                onPress={() => handleOptionSelect('option1')} 
                title="Account" 
                leadingIcon={() => <Feather name="user" size={20} color="white" />}
              />
              <Menu.Item 
                style={styles.menuItem} 
                onPress={() => handleOptionSelect('option2')} 
                title="Help" 
                color='#606060'
                leadingIcon={() => <Feather name="help-circle" size={20} color="white" />}
              />
            </Menu>
          </View>
        </View>
        <View style={styles.container}>
        {superEventsStack.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEvents}>No events recorded</Text>
          </View>
        ) : (
          <FlatList
            data={superEventsStack}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventItem}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/activityPage',
                    params: {
                      title: item.eventtitle,
                      activityType: item.activitytype,
                      startDate: item.startingtime,
                      endDate: item.endingtime,
                      duration: item.activityduration,
                      distance: item.distance,
                      avgHeartBeats: item.averageheartratebeatsperminute,
                      maxHeartBeats: item.maxheartratebeatsperminute,
                      calories: item.activekilocalories,
                      latitude: item.eventlatitude,
                      longitude: item.eventlongitude,
                      steps: item.steps,
                      deviceName: item.devicename,
                      description: item.eventdescription,
                      previousPage: 'home',
                    },
                  });
                }}
              >
                <Text style={styles.eventTitle}>{item.eventtitle || 'Missing Title'}</Text>
                <Text style={styles.subTitle}>
                  <MaterialCommunityIcons name="medal" size={15} color="orange" />
                  {" "}{item.activitytype.toString().replace("_", " ")} 
                  {"\n"}
                  <MaterialCommunityIcons name="calendar" size={15} color="#9ACD32" />
                  {" "}{formatDate(new Date(item.startingtime))} 
                  {"\n"}
                  <MaterialCommunityIcons name="timer" size={15} color="#1E90FF" />
                  {" "}{
                    new Date(item.startingtime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  } - {
                    new Date(item.endingtime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }
                    )}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: '#262626',
    paddingTop: 80
  },
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
    backgroundColor: '#606060'
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEvents: {
    fontSize: 15,
    color: 'white'
  },
  scrollContent: {
    paddingBottom: 20
  },
  title: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
    paddingLeft: 10
  },
  subTitle: {
    position: 'relative',
    alignItems: 'flex-start',
    fontSize: 15,
    paddingBottom: 5,
    color: 'white'
  },
  eventTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
    position: 'relative',
    alignItems: 'center',
    flex: 1,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'white',
    width: '100%',
    fontWeight: 'bold'
  },
  eventItem: {
    padding: 20,
    paddingVertical: 10,
    backgroundColor: '#404040',
    margin: 5,
    borderRadius: 10,
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'center'
  },
  menu: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1,
  },
  menuItem: {
    justifyContent: 'center',
    backgroundColor: '0b1e28'
  }
});