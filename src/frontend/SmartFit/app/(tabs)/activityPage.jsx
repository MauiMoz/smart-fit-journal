import { Feather, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAddressFromCoords } from '../helperFunctions';

// This component displays a super-event in detail
export default function ActivityPage() {
  const { 
    title, 
    activityType,
    startDate, 
    endDate, 
    duration, 
    distance, 
    avgHeartBeats, 
    maxHeartBeats, 
    calories, 
    latitude, 
    longitude,
    steps,
    deviceName,
    description,
    previousPage
  } = useLocalSearchParams();

  const [location, setLocation] = useState('Loading...');
  const [iconColor, setIconColor] = useState('white');

  useEffect(() => {
    const initialize = async () => {
      
      // Check favourites
      try {
        const existing = await AsyncStorage.getItem('favouriteEventsStack');
        const favourites = existing ? JSON.parse(existing) : [];
        const isFavourite = favourites.some(e => e.title === title && e.startDate === startDate);
        setIconColor(isFavourite ? 'orange' : 'white');
      } catch (e) {
        console.error('Error checking if event is favourite:', e);
      }

      // Fetch location
      try {
        const latitudeValue = parseFloat(latitude);
        const longitudeValue = parseFloat(longitude);
        const result = await getAddressFromCoords(latitudeValue, longitudeValue);

        if (result) {
          setLocation(`${result.city}, ${result.region}, ${result.country}`);
        } else {
          setLocation('Unknown location');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocation('Error fetching location');
      }
    };

    initialize();

    // Exit the app if the tab bar back button is pressed
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp(); // Move app to background
        return true; // Prevent default behavior
      });

      // Clean up on unmount
      return () => backHandler.remove();
    }
  }, [title, startDate, latitude, longitude]);

  const toggleFavourite = async () => {
    try {
      const existing = await AsyncStorage.getItem('favouriteEventsStack');
      const favs = existing ? JSON.parse(existing) : [];

      const isFavourite = favs.some(e => e.title === title && e.startDate === startDate);

      if (isFavourite) {
        const filtered = favs.filter(e => !(e.title === title && e.startDate === startDate));
        await AsyncStorage.setItem('favouriteEventsStack', JSON.stringify(filtered));
        setIconColor('white');
        console.log('Event removed from favourites');
        printFavourites();
      } else {
        const event = {
          title,
          activityType,
          startDate,
          endDate,
          duration,
          distance,
          avgHeartBeats,
          maxHeartBeats,
          calories,
          latitude,
          longitude,
          steps,
          deviceName,
          description
        };
        favs.push(event);
        await AsyncStorage.setItem('favouriteEventsStack', JSON.stringify(favs));
        setIconColor('orange');
        console.log('Event saved to favourites');
        printFavourites();
      }
    } catch (e) {
      console.error('Error toggling favourite:', e);
    }
  };

  const printFavourites = async () => {
    try {
      const existing = await AsyncStorage.getItem('favouriteEventsStack');
      const favs = existing ? JSON.parse(existing) : [];
      console.log('Favourite Events: ', favs);
    } catch (e) {
      console.error('Error reading favourites:', e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => router.push({ pathname: `/(tabs)/${previousPage}`})}
      >
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.star} onPress={toggleFavourite}>
        <MaterialCommunityIcons name="star" size={28} color={iconColor} />
      </TouchableOpacity>
      <View style={styles.subContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subTitle}>
          <Feather name="info" size={18} color="#FF8C00" />
          {" "}Activity Info
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="calendar-start" size={16} color="#1E90FF" />
          {" "}{new Date(startDate).toLocaleString()}
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="calendar-end" size={16} color="#1E90FF" />
          {" "}{new Date(endDate).toLocaleString()}
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="medal" size={16} color="#1E90FF" />
          {" "}{activityType.toString().replace("_", " ")?? 'Unknown Activity'} 
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="timer" size={16} color="#1E90FF" />
          {" "}{duration?? 'Unknown'} Hrs
        </Text>
        <Text style={styles.text}>
          <FontAwesome5 name="route" size={16} color="#1E90FF" />
          {" "}{isNaN(distance)? 0 : distance} Km
        </Text>
        <Text style={styles.text}>
          <FontAwesome5 name="heartbeat" size={16} color="#1E90FF" />
          {" "}{avgHeartBeats?? 'Unknown'} Avg Heart bpm
        </Text>
        <Text style={styles.text}>
          <FontAwesome6 name="heart-circle-exclamation" size={16} color="#1E90FF" />
          {" "}{maxHeartBeats?? 'Unknown'} Max Heart bpm
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="fire" size={16} color="#1E90FF" />
          {" "}{calories?? 0} Calories
        </Text>
        <Text style={styles.text}>
          <Ionicons name="footsteps" size={16} color="#1E90FF" />
          {" "}{steps?? 0} Steps
        </Text>
        <Text style={styles.text}>
          <MaterialCommunityIcons name="watch-variant" size={16} color="#1E90FF" />
          {" "}{deviceName?? 'Unknown Device'}
        </Text>
        <Text style={styles.text}>
          <Ionicons name="location-sharp" size={16} color="#1E90FF" />
          {" "}{location?? 'Unknown'}
        </Text>
        <Text style={styles.subTitle}>
        <Feather name="info" size={18} color="#FF8C00" />
          {" "}Event Info
        </Text>
        <Text style={styles.text}>
          {description?? 'No information available'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 10,
    paddingTop: 80,
    justifyContent: 'flex-start',
    backgroundColor: '#606060',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingTop: 20,
    color: 'white',
    textAlign: 'center',
    borderBottomColor: 'white'
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 5,
    marginBottom: 10,
    marginTop: 10,
    color: 'white',
    textAlign: 'left',
    borderBottomWidth: 0.5,
    borderBottomColor: 'white'
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'left',
  },
  backArrow: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    color: 'white'
  },
  subContainer: {
    flex: 1,
    margin: 5,
    marginTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#404040',
    borderRadius: 10
  }, 
  star: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    color: 'white'
  }
});