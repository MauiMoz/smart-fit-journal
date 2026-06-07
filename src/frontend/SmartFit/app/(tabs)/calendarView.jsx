import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Provider } from 'react-native-paper';
import { formatDate } from '../helperFunctions';

// This component is used to display a calendar view of the super-events
export default function EventsList() {
  const [superEvents, setSuperEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const SUPER_EVENTS_KEY = 'superEventsStack';

  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      setSelectedDate(today);
      loadEventsForDate(today);

      // Exit the app if the tab bar back button is pressed
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          BackHandler.exitApp(); // Move app to background
          return true; // Prevent default behavior
        });
  
        // Clean up on unmount
        return () => backHandler.remove();
      }
    }, [])
  );

  const loadEventsForDate = async (date) => {
    try {
      const storedEvents = await AsyncStorage.getItem(SUPER_EVENTS_KEY);

      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);

        const filtered = parsedEvents.filter(event => {
          const eventDate = new Date(event.startingtime);
          return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
          );
        });

        filtered.sort((a, b) => new Date(a.startingtime) - new Date(b.startingtime));
        setSuperEvents(filtered);
      } else {
        setSuperEvents([]);
      }
    } catch (error) {
      console.error('Failed to load super events:', error);
      setSuperEvents([]);
    }
  };

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
  };

  // Update the selected date when a new one is picked
  const onChange = (event, selected) => {

    setShowPicker(false);

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    setSelectedDate(selected);
    loadEventsForDate(selected);
    fetchEventsForDate(selected);
  };

  return (
    <Provider>
      <View style={styles.header}>
        <Text style={styles.headerText}>{formatDate(selectedDate)}</Text>
        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )}
      </View>
      <View style={styles.container}>
        {superEvents.length === 0 ? (
          <Text style={styles.noEvents}>No events on this date.</Text>
        ) : (
          <FlatList
            data={superEvents}
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
                      previousPage: 'calendarView',
                    },
                  });
                }}
              >
                <Text style={styles.title}>{item.eventtitle || 'Missing Title'}</Text>
                <Text style={styles.subTitle}>
                    <MaterialCommunityIcons name="medal" size={15} color="orange" />
                    {" "}{item.activitytype.toString().replace("_", " ")} 
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
        <View style={styles.bottomButton}>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Text style={styles.bottomButtonText}>Select Date</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#606060',
  },
  headerText: {
    fontSize: 20,
    marginBottom: 20,
    paddingLeft: 15,
    color: 'white'
  },
  noEvents: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    paddingLeft: 10
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
  title: {
    fontSize: 16,
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
  subTitle: {
    position: 'relative',
    alignItems: 'flex-start',
    fontSize: 14,
    paddingBottom: 5,
    color: 'white'
  },
  bottomButton: {
    marginTop: 'auto',
    marginBottom: 20,
    padding: 20,
    paddingVertical: 10,
    margin: 5,
    borderRadius: 2
  },
  bottomButtonText: {
    color: '#1a8cff',
    fontSize: 16,
    textAlign: 'center'
  },
  bottomButton: {
    backgroundColor: '#404040',
    marginTop: 'auto',
    marginBottom: 20,
    paddingVertical: 10,
    margin: 40,
    borderRadius: 5
  }
});
