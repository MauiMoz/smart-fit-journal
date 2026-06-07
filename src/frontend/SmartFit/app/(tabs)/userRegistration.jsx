import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Button, ImageBackground, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../firebaseConfig';

import gymImage from "@/assets/images/Gym.jpg";

// This component dsiplays the user registration page
export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signUp = async () => {
    if (password !== passwordConfirmation) {
      alert("Passwords do not match");
      return;
    }
  
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userID = user.uid;
      console.log(user.uid);

      // the registration of a new user takes place on the server side
      const response = await fetch(`${process.env.EXPO_PUBLIC_CALLBACK_ADDRESS}/start-garmin-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userID }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Raw server response:', errorText);
        throw new Error('Failed to initiate Garmin OAuth');
      }

      const data = await response.json();
      const redirectUrl = data.redirectUrl;

      Linking.openURL(redirectUrl);
    } catch (e) {
      console.error('Registration error:', e);
      alert('Registration failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ImageBackground source={gymImage} resizeMode='cover' style={styles.image}>
          <Text style={styles.text}>User Registration</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            keyboardType='email-address'
            placeholder='Email'
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder='Password'
          />
          <TextInput
            style={styles.input}
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            placeholder='Repeat Password'
          />
          {loading ? (
            <ActivityIndicator size={'small'} style={{ margin: 28 }} />
          ) : ( 
            <View style={styles.buttonContainer}>
              <Button onPress={signUp} title='Sign Up' />
              <Text style={styles.linkText} onPress={() => router.replace('/')}>
                Log In
              </Text>
            </View>
          )}
        </ImageBackground>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginVertical: 4,
    width: 300,
    marginLeft: 20,
    marginRight: 20,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
    opacity: 0.7,
    color: 'black'
  },
  buttonContainer: {
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  text: {
    justifyContent: 'center',
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  linkText: {
    color: 'white',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
