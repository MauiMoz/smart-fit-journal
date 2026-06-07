import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Dimensions, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateReadable, isSameDay, loadDailyReports } from '../helperFunctions';

const { width: screenWidth } = Dimensions.get('window');

// This component displays the daily health reports
export default function DailyReportsPager() {

  const [data, setData] = useState([]);
  const [superEvents, setEvents] = useState([]);
  const SUPER_EVENTS_KEY = 'superEventsStack';

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reports = await loadDailyReports();
        console.log("Loaded reports:", reports);
        setData((reports ?? []).slice().reverse());
      } catch (error) {
        console.error("Error loading reports:", error);
      }
    };

    const fetchEvents = async () => {
      try {
        const json = await AsyncStorage.getItem(SUPER_EVENTS_KEY);
        const storedEvents = json ? JSON.parse(json) : {};
        setEvents(storedEvents);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    fetchReports();
    fetchEvents();

    // Exit the app if the tab bar back button is pressed
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp(); // Move app to background
        return true; // Prevent default behavior
      });

      // Clean up on unmount
      return () => backHandler.remove();
    }
  }, []);

  return (
    data.length === 0 ? (
      <View style={styles.noEventsContainer}>
        <Text style={styles.noEvents}>No health reports available</Text>
      </View>
    ) : (
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {formatDateReadable(item.calendarDate)}
              </Text>
            </View>
          <View style={styles.page}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.firstSubTitle}>
                <FontAwesome5 name="heartbeat" size={18} color="#FF8C00" />
                {" "}Heart Rate
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Avg Heart Rate:</Text>
                </View>
                <Text style={styles.text}>{item.avgHeartRate} bpm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Min Heart Rate:</Text>
                </View>
                <Text style={styles.text}>{item.minHeartRate} bpm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Max Heart Rate:</Text>
                </View>
                <Text style={styles.text}>{item.maxHeartRate} bpm</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Resting Heart Rate:</Text>
                </View>
                <Text style={styles.text}>{item.restingHeartRate} bpm</Text>
              </View>
              <Text style={styles.subTitle}>
                <MaterialCommunityIcons name="fire" size={18} color="#FF8C00" />
                {" "}Calories
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Burned calories:</Text>
                </View>
                <Text style={styles.text}>{item.activeCalories} cal</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>BMR Burned Calories:</Text>
                </View>
                <Text style={styles.text}>{item.bmrKilocalories} cal</Text>
              </View>
              <Text style={styles.subTitle}>
                <Octicons name="alert" size={18} color="#FF8C00" />
                {" "}Stress
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Avg Stress Level:</Text>
                </View>
                <Text style={styles.text}>{item.avgStressLevel} %</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Max Stress Level:</Text>
                </View>
                <Text style={styles.text}>{item.maxStressLevel} %</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Stress Duration:</Text>
                </View>
                <Text style={styles.text}>{item.stressDuration}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Low Stress Duration:</Text>
                </View>
                <Text style={styles.text}>{item.lowStressDuration}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Rest Stress Duration:</Text>
                </View>
                <Text style={styles.text}>{item.restStressDuration}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Activity Stress Duration:</Text>
                </View>
                <Text style={styles.text}>{item.activityStressDuration}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Stress Qualifier:</Text>
                </View>
                <Text style={styles.text}>{item.stressQualifier.replace("_", " ")}</Text>
              </View>
              <Text style={styles.subTitle}>
                <MaterialIcons name="directions-walk" size={18} color="#FF8C00" />
                Activity
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Active Time:</Text>
                </View>
                <Text style={styles.text}>{item.activeTime}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Distance Traveled:</Text>
                </View>
                <Text style={styles.text}>{item.distance.toFixed(2)} Km</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Moderate Intensity:</Text>
                </View>
                <Text style={styles.text}>{item.moderateIntensity}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Vigorous Intensity:</Text>
                </View>
                <Text style={styles.text}>{item.vigorousIntensity}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Report Time Span:</Text>
                </View>
                <Text style={styles.text}>{item.duration}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Steps Count:</Text>
                </View>
                <Text style={styles.text}>{item.steps} steps</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="dot-single" size={18} color="white" />
                  <Text style={styles.text}>Climbed Floors:</Text>
                </View>
                <Text style={styles.text}>{item.floorsClimbed?? 0} floors</Text>
              </View>
              <Text style={styles.subTitle}>
                <Entypo name="calendar" size={18} color="#FF8C00" />
                {" "}Related Events
              </Text>
          {(() => {
            const eventsForDay = (Array.isArray(superEvents) ? superEvents : [])
              .filter(event =>isSameDay(
                event.startingtime, item.calendarDate
              )
            );

            if (eventsForDay.length === 0) {
              return (
                <Text style={styles.text}>
                  {"- No Events Found"}
                </Text>
              );
            }

            return eventsForDay.map((event, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/activityPage',
                    params: {
                      title: event.eventtitle,
                      activityType: event.activitytype,
                      startDate: event.startingtime,
                      endDate: event.endingtime,
                      duration: event.activityduration,
                      distance: event.distance,
                      avgHeartBeats: event.averageheartratebeatsperminute,
                      maxHeartBeats: event.maxheartratebeatsperminute,
                      calories: event.activekilocalories,
                      latitude: event.eventlatitude,
                      longitude: event.eventlongitude,
                      steps: event.steps,
                      deviceName: event.devicename,
                      description: event.eventdescription,
                      previousPage: 'healthReports',
                    },
                  });
                }}
              >
                <Text style={styles.relatedEvent}>
                  <Ionicons name="return-down-forward-sharp" size={16} color="white" />
                  {" "}{event.eventtitle}
                </Text>
              </TouchableOpacity>
            ));
          })()}
          </ScrollView>
          </View>
        </View>
        )}
      />
    )
  );
}

const styles = StyleSheet.create({
  page: {
    width: screenWidth - 32,
    height: '90%',
    justifyContent: 'center',
    alignItems: 'left',
    backgroundColor: '#404040',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 6,
    marginBottom: 200,
    paddingBottom: 10,
    marginHorizontal: 16,
    borderRadius: 10
  },
  container: {
    justifyContent: 'center',
    backgroundColor: '#606060',
    paddingTop: 100,
  },
  header: {
    width: '100%',
    backgroundColor: '#262626',
    paddingTop: 80,
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    paddingTop: 80,
    paddingBottom: 15,
    marginBottom: 5,
    paddingLeft: 15,
    textAlign: 'left',
    color: 'white'
  },
  noEventsContainer: {
    flex: 1,
    backgroundColor: '#606060',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEvents: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  firstSubTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 5,
    marginBottom: 5,
    color: 'white',
    textAlign: 'left',
    borderBottomWidth: 0.5,
    borderBottomColor: 'white'
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 5,
    paddingTop: 20,
    marginBottom: 5,
    color: 'white',
    textAlign: 'left',
    borderBottomWidth: 0.5,
    borderBottomColor: 'white'
  },
  text: {
    fontSize: 16,
    textAlign: 'left',
    color: 'white'
  },
  relatedEvent: {
    fontSize: 16,
    paddingVertical: 10,
    textAlignVertical: 'center',
    color: 'white',
    textAlign: 'left',
    borderBottomWidth: 0.5,
    borderBottomColor: 'white'
  },
  button: {
    marginTop: 20,
    marginBottom: 20
  }
});

