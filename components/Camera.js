import React, { useState, useEffect } from 'react';
import { StyleSheet ,Text, View, Button, Image} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';



export default function Camera() {
/*   const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null); */
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [camera, setCamera] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});

  const [cache, setCache] = useState(null)
  const [codec, setCodec] = useState(Camera.Constants.VideoCodec.H264)
  

  /* useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');

    })();
  }, []); */

  const saveToDirAndReturnPath = async (uri) => {
    const tempDir = FileSystem.cacheDirectory
    const imgName = uri.slice(uri.lastIndexOf("/") + 1)
    console.log(imgName)
    FileSystem.getInfoAsync(tempDir).then((dirInfo) => {
      if (!dirInfo.exists) {
        FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory, {
          intermediates: true,
        })
      }
    })
    const to = tempDir + imgName
    await FileSystem.copyAsync({ from: uri, to })
    return to
  }

  const createFormData = (uri) => {
    const fileName = uri.split('/').pop();
    const fileType = fileName.split('.').pop();
    const formData = new FormData();
    formData.append('stream', { 
      uri, 
      name: fileName, 
      type: `image/${fileType}` 
    });
    
    return formData;
  }

  const takeVideo = async () => {
    if(camera){
        const data = await camera.recordAsync({
          maxDuration:300,
          codec: codec,
        })
        const cacheURL = await saveToDirAndReturnPath(data.uri)
        setCache(cacheURL)
        console.log("cache url: ", cache)
    }
  }

  const stopVideo = async () => {
    camera.stopRecording();
  }

  const sendVideo = async () => {
    const data = createFormData(cache)
    /* data.append("stream", cache) */
    console.log(data)
    const config = {
      method: 'POST',
      body: data,
    }
    const response = await fetch('http://13.115.175.187:8000/otozeusapp/demo/', config)
      .then((res) => {
        console.log("response: ", res)
      })
      .catch(err => {
        console.log("error: ", err)
      })
    e.preventDefault()
  }

/*   if (hasCameraPermission === null || hasAudioPermission === null ) {
    return <View />;
  }
  if (hasCameraPermission === false || hasAudioPermission === false) {
    return <Text>No access to camera</Text>;
  } */

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }
  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1}}>
        <View style={styles.cameraContainer}>
            <Camera 
            ref={ref => setCamera(ref)}
            style={styles.fixedRatio} 
            type={type}
            ratio={'4:3'} />
        </View>
        <Video
          ref={video}
          style={styles.video}
          source={{
            uri: cache,
          }}
          useNativeControls
          resizeMode="contain"
          isLooping
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
        <View style={styles.buttons}>
          <Button
            title={status.isPlaying ? 'Pause' : 'Play'}
            onPress={() =>
              status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
            }
          />
        </View>
        <Button
            title="Flip Video"
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}>
          </Button>
          <Button title="Take video" onPress={() => takeVideo()} />
          <Button title="Stop Video" onPress={() => stopVideo()} />
          <Button title="Send Video" onPress={() => sendVideo()} />
          
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cameraContainer: {
      flex: 1,
      flexDirection: 'row'
  },
  fixedRatio:{
      flex: 1,
      aspectRatio: 1
  },
  video: {
    alignSelf: 'center',
    width: 350,
    height: 220,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})