import React, { Component } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons'; // Expo vector icons

const key = '@MyApp:rating';

const playlist = [
  {
    title: 'Golden Hour',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Dream Sequence',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'Cosmic Flow',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

export default class App extends Component {
  state = {
    currentTrackIndex: 0,
    rating1: '',
    rating2: '',
    rating3: '',
    storedValue: '',
    soundObject: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };

  componentDidMount() {
    this.onLoad();
    this.playTrack(this.state.currentTrackIndex);
    this.progressInterval = setInterval(this.updateProgress, 1000);
  }

  componentWillUnmount = async () => {
    try {
      if (this.state.soundObject) {
        await this.state.soundObject.stopAsync();
        await this.state.soundObject.unloadAsync();
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    clearInterval(this.progressInterval);
  };

  formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  updateProgress = async () => {
    const { soundObject } = this.state;
    if (soundObject) {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded) {
        this.setState({
          currentTime: status.positionMillis,
          duration: status.durationMillis,
          isPlaying: status.isPlaying,
        });
      }
    }
  };

  playTrack = async (index) => {
    try {
      if (this.state.soundObject) {
        await this.state.soundObject.stopAsync();
        await this.state.soundObject.unloadAsync();
      }

      const track = playlist[index];
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true }
      );

      this.setState({
        currentTrackIndex: index,
        soundObject: sound,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      });
    } catch (error) {
      console.error('Error in playTrack:', error);
    }
  };

  togglePlayPause = async () => {
    const { soundObject, isPlaying } = this.state;
    if (!soundObject) return;

    if (isPlaying) {
      await soundObject.pauseAsync();
      this.setState({ isPlaying: false });
    } else {
      await soundObject.playAsync();
      this.setState({ isPlaying: true });
    }
  };

  nextTrack = () => {
    const next = (this.state.currentTrackIndex + 1) % playlist.length;
    this.playTrack(next);
  };

  prevTrack = () => {
    const prev = (this.state.currentTrackIndex - 1 + playlist.length) % playlist.length;
    this.playTrack(prev);
  };

  onSave = async () => {
    try {
      const { rating1, rating2, rating3 } = this.state;
      const combinedRatings = JSON.stringify({ rating1, rating2, rating3 });
      await AsyncStorage.setItem(key, combinedRatings);
      Alert.alert('Saved', 'Ratings saved locally!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save ratings.');
    }
  };

  onLoad = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(key);
      if (storedValue) {
        const { rating1, rating2, rating3 } = JSON.parse(storedValue);
        this.setState({
          rating1: rating1 || '',
          rating2: rating2 || '',
          rating3: rating3 || '',
          storedValue: storedValue,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load ratings.');
    }
  };

  renderPicker = (ratingKey) => (
    <Picker
      selectedValue={this.state[ratingKey]}
      onValueChange={(value) => this.setState({ [ratingKey]: value })}
      style={styles.picker}
    >
      <Picker.Item label="Select a rating" value="" />
      <Picker.Item label="1 Star" value="1" />
      <Picker.Item label="2 Stars" value="2" />
      <Picker.Item label="3 Stars" value="3" />
      <Picker.Item label="4 Stars" value="4" />
      <Picker.Item label="5 Stars" value="5" />
    </Picker>
  );

  render() {
    const { currentTrackIndex, currentTime, duration } = this.state;
    const ratingKey = `rating${currentTrackIndex + 1}`;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
        <View style={styles.trackInfo}>
        <Text style={styles.nowPlaying}>{this.state.isPlaying ? '🎧 Now Playing' : 'Paused'}</Text>
        <Text style={styles.trackTitle}>{playlist[currentTrackIndex].title}</Text>
        <Text style={styles.trackIndex}>
          Track {currentTrackIndex + 1} of {playlist.length}
        </Text>
      </View>


          <Text style={styles.time}>
            {this.formatTime(currentTime)} / {this.formatTime(duration)}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity onPress={this.prevTrack} style={styles.buttonSmall}>
              <Ionicons name="play-skip-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.togglePlayPause} style={styles.buttonSmall}>
              <Ionicons
                name={this.state.isPlaying ? 'pause' : 'play'}
                size={28}
                color="#000"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.nextTrack} style={styles.buttonSmall}>
              <Ionicons name="play-skip-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Rate this sound:</Text>
          {this.renderPicker(ratingKey)}

          <Text style={styles.result}>
            First: {this.state.rating1}, Second: {this.state.rating2}, Third: {this.state.rating3}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this.onSave} style={styles.button}>
            <Text style={{ color: '#fff' }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.onLoad} style={styles.button}>
            <Text style={{ color: '#fff' }}>Load</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingTop: 120,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  nowPlaying: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  
  trackTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
  },
  
  trackIndex: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  
  title: {
    fontSize: 20,
    marginBottom: 10,
  },

  time: {
    fontSize: 16,
    marginBottom: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonSmall: {
    backgroundColor: '#ddd',
    padding: 12,
    marginHorizontal: 15,
    borderRadius: 40,
  },
  picker: {
    marginTop: -20,
    width: 200,
    height: 150,
    marginBottom: 75,
  },
  result: {
    fontSize: 17,
    backgroundColor: '#eee',
    padding: 25,
    width: 280,
    textAlign: 'center',
    borderRadius: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 75,
  },
  button: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    width: 250,
    alignItems: 'center',
  },
});
