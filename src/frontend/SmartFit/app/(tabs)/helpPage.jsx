import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// This component displays a page containing help
export default function helpPage() {

  useFocusEffect(
    useCallback(() => {
      return () => {
        router.replace('/home');
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please send an Email to: {"\n"} company@email.com</Text>
    </View>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#606060',
    justifyContent: 'center',
    alignItems: 'center', 
  },
  text: {
    fontSize: 20,
    color: 'white',
    position: 'relative',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center'
  }
})
