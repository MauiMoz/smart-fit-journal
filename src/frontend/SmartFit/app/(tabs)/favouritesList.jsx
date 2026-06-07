import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDate } from '../helperFunctions';

// This component displays the list of favourite super-events
export default function favouritesList() {
  const [favouriteEventsStack, setSuperEventsStack] = useState([]);
  
  useFocusEffect(
    useCallback(() => {
      const loadSuperEvents = async () => {
        try {
          const storedEvents = await AsyncStorage.getItem('favouriteEventsStack');
          if (storedEvents) {
            const favourites = JSON.parse(storedEvents);
            setSuperEventsStack(favourites.reverse());
          } else {
            setSuperEventsStack([]);
          }
        } catch (error) {
          console.error('Failed to load super events:', error);
        }
      };

      loadSuperEvents();

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

  return (
    <>
    <View style={styles.header}>
      <Text style={styles.title}> Favourite Events </Text>
    </View>
    <View style={styles.container}>
        {favouriteEventsStack.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEvents}>You don't have any favourite event yet</Text>
          </View>
        ) : (
          <FlatList
            data={favouriteEventsStack}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventItem}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/activityPage',
                    params: {
                      title: item.title,
                      activityType: item.activityType,
                      startDate: item.startDate,
                      endDate: item.endDate,
                      duration: item.duration,
                      distance: item.distance,
                      avgHeartBeats: item.avgHeartBeats,
                      maxHeartBeats: item.maxHeartBeats,
                      calories: item.calories,
                      latitude: item.latitude,
                      longitude: item.longitude,
                      steps: item.steps,
                      deviceName: item.devicename,
                      description: item.description,
                      previousPage: 'favouritesList',
                    },
                  });
                }}
              >
                <Text style={styles.eventTitle}>{item.title || 'Missing Title'}</Text>
                <Text style={styles.subTitle}>
                  <MaterialCommunityIcons name="medal" size={15} color="orange" />
                  {" "}{(item.activityType ? item.activityType.toString().replace("_", " ") : "Unknown Activity")}
                  {"\n"}
                  <MaterialCommunityIcons name="calendar" size={15} color="#9ACD32" />
                  {" "}{formatDate(new Date(item.startDate))} 
                  {"\n"}
                  <MaterialCommunityIcons name="timer" size={15} color="#1E90FF" />
                  {" "}
                  {
                    new Date(item.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })
                  } - {
                    new Date(item.endDate).toLocaleTimeString([], {
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
    </>
  )
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
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    position: 'relative',
    alignItems: 'center',
    flex: 1,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'white',
    width: '100%'
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
});
