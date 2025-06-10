import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

async function getRandomMusicFile() {
    const musicDir = path.join(process.cwd(), 'app', 'music');
    try {
      // Use async readdir from fs/promises
      const musicFiles = (await fs.readdir(musicDir)).filter(file =>
        file.endsWith('.mp3') || file.endsWith('.wav')
      );
  
      if (musicFiles.length === 0) {
        throw new Error('No music files found in app/music/');
      }
  
      const randomFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];
      const filePath = path.join(musicDir, randomFile);
  
      // Use async readFile from fs/promises
      const fileBuffer = await fs.readFile(filePath);
      const base64Music = fileBuffer.toString('base64');
  
      return base64Music;
    } catch (error) {
      throw new Error(`Failed to read music files: ${error.message}`);
    }
  }

async function createVideoApiCall(apiUrl, collectionOfImages, base64Music) {
    const payload = {
        images: collectionOfImages,
        music: base64Music,
    };
    
    // Make the API call
    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache',
    'Connection': 'close'},
            timeout: 480000, // 8 minutes timeout for video processing (in milliseconds)
            responseType: 'arraybuffer' // Ensure response is treated as binary data
        });
        
        if (response.status === 200) {
            return Buffer.from(response.data);
        } else {
            throw new Error(`API call failed with status ${response.status}: ${response.data.toString()}`);
        }
    } catch (error) {
        throw new Error(`API call failed: ${error.message}`);
    }
}

export default async function getfilefrompython(collectionOfImages){
    try{
    const base64Music = await getRandomMusicFile();
    const apiUrl = 'http://127.0.0.1:5000/create-video';
    const videoContent = await createVideoApiCall(
        apiUrl,
        collectionOfImages,
        base64Music
    );
    return videoContent;
    }
    catch(error){
    
        console.log("Got error in getfilefrompython",error);
    }
}

