import { router, useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auth } from '../../firebaseConfig';

// This component displays the user profile page
export default function UserProfile() {
  const loggedOut = useRef(false);

  useFocusEffect(
    useCallback(() => {

      loggedOut.current = false;

      return () => {
        if (loggedOut.current) {
          console.log('Logged out');
        } else {
          console.log('Going back to home');
          router.replace('/home');
        }
      };
    }, [])
  );

  const logout = async () => {
    try {
      loggedOut.current = true;
      await signOut(auth);
      router.replace('/');
    } catch (e) {
      alert('Logout failed: ' + e.message);
    }
  };

  return (
    <>
    <View style={styles.header}>
      <Text style={styles.title}>User Profile</Text>
    </View>
    <View style={styles.container}>
      <Text style={styles.text}>{"Email Address: "}{auth.currentUser?.email ?? 'User Email'}</Text>
      <Text style={styles.linkText} onPress={logout}>
        Log Out
      </Text>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: '#262626',
    paddingTop: 60
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#606060',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
   title: {
    fontSize: 20,
    color: 'white',
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 10,
    paddingLeft: 15,
  },
  text: {
    width: '100%',
    fontSize: 18,
    color: 'white',
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'white'
  },
  linkText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
