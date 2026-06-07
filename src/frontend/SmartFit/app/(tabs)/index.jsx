import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../firebaseConfig';

import gymImage from "@/assets/images/Gym.jpg";

// When the application starts it will be redirected to this component
export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const signUp = async () => {
    setLoading(true);
    try {
      router.replace('/userRegistration');
    } catch (e) {
      alert('Registration failed: ' + e.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/home');
    } catch (e) {
      alert('Sign in failed: ' + e.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const recovery = async () => {
    setLoading(true);
    try {
      router.replace('/passwordRecovery');
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ImageBackground source={gymImage} resizeMode='cover' style={styles.image}>
          <Text style={styles.text}>Log in</Text>
        
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          caretHidden={false}
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
        {loading ? (
          <ActivityIndicator size={'small'}/>
        ) : ( 
          <View style={styles.buttonContainer}>
            <Button onPress={signIn} title='Sign In' />
            <View style={{ height: 20 }} />
            <Text style={styles.linkText} onPress={signUp}>
              Register new User
            </Text>
            <Text style={styles.linkText} onPress={recovery}>
              I forgot my password
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
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
