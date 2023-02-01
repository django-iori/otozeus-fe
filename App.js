import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from "axios"

export default function App() {
  const [recording, setRecording] = useState();
  const [recordURI, setRecordURI] = useState();
  const [deliverableURI, setDeliverableURI] = useState()

  useEffect(() => {
    async function setAudioMode () {
      try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error('Failed to get permission', err);
    }
    }
    setAudioMode();
  }, []);

  const createFormData = (uri) => {
    const fileName = uri.split('/').pop();
    const fileType = fileName.split('.').pop();
    const formData = new FormData();
    formData.append('stream', { 
      uri, 
      name: fileName, 
      type: `audio/${fileType}` 
    });
    return formData;
  }

  async function startRecording() {
    try {
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    setRecordURI(recording.getURI())
  }

  async function playRecord() {
    console.log('Loading Sound at: ', recordURI);
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordURI },
      { shouldPlay: true }
    );
    await sound.playAsync();
  }

  async function playDeliverable() {
    console.log('Loading Sound at: ', deliverableURI);
    const { sound } = await Audio.Sound.createAsync(
      { uri: deliverableURI },
      { shouldPlay: true }
    );
    console.log('Playing Sound');
    await sound.playAsync();
  }

  async function sendRecord() {
    const formdata = createFormData(recordURI)
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    }
    axios.post('http://13.115.175.187:8000/otozeusapp/demo/', formdata, config)
      .then(function(response) {
        const fr = new FileReader();
        fr.onload = async () => {
          const fileUri = `${FileSystem.documentDirectory}/deliverable.mp3`;
          await FileSystem.writeAsStringAsync(fileUri, fr.result.split(',')[1], { encoding: FileSystem.EncodingType.Base64 });
          setDeliverableURI(fileUri);
        };
        fr.readAsDataURL(response.data);
      })
      .catch(function (error) {
        console.log(error.toJSON());
      });
  }

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      { recordURI && <Button title="Play Sound" onPress={playRecord} /> }
      { recordURI && <Button title="Send Record" onPress={sendRecord} /> }
      { deliverableURI && <Button title="Play Deliverable" onPress={playDeliverable} /> }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
