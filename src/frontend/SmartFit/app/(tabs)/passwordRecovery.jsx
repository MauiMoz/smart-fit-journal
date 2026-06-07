import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Button, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../firebaseConfig';

import gymImage from "@/assets/images/Gym.jpg";

// This component is needed for password recovery
export default function Recovery() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const recovery = async () => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`An Email has been sent to ${email}!`);
      router.replace('/');
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ImageBackground source={gymImage} resizeMode='cover' style={styles.image}>
          <Text style={styles.text}>Password Reset</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            keyboardType='email-address'
            placeholder='Email'
          />
          {loading ? (
            <ActivityIndicator size={'small'} style={{ margin: 28 }} />
          ) : ( 
            <View style={styles.buttonContainer}>
            <Button onPress={recovery} title='Send Email' />
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
