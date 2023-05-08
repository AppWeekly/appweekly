import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import tempfile from 'tempfile';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { URL } from 'url';
import path from 'path';
import os from 'os';

const { 
  NEXT_PUBLIC_OPENAI_API_KEY,
  NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY 
} = process.env

const openai = new OpenAIApi(new Configuration({
  apiKey: NEXT_PUBLIC_OPENAI_API_KEY,
}));

// Support for local (mac) & production (linux)
let ffmpegPath;
if (os.type() === 'Linux') {
  ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg');
} else if (os.type() === 'Darwin') {
  ffmpegPath = 'ffmpeg'; // This assumes FFmpeg is installed via Homebrew and available in the system PATH
} else {
  throw new Error('Unsupported platform');
}
ffmpeg.setFfmpegPath(ffmpegPath);

async function googleDriveVideoDownload(fileId) {
  try {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY}`;
    const response = await axios.get(downloadUrl, { responseType: 'stream' });

    if (response.status !== 200) {
      console.error(`Failed to download the video, status code: ${response.status}`);
      return null;
    }

    const tempFile = tempfile({ extension: '.mp4' });
    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return tempFile;
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    return null;
  }
}

function getDriveId(url) {
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split('/');
  return pathParts.length > 2 ? pathParts[3] : null;
}

async function downloadVideo(url) {
  if (url.includes('drive.google.com')) {
    const driveId = getDriveId(url);
    if (driveId) {
      return await googleDriveVideoDownload(driveId);
    }
  } else {
    try {
      const response = await axios.get(url, { responseType: 'stream' });

      if (response.status !== 200) {
        console.error(`Failed to download the video, status code: ${response.status}`);
        return null;
      }

      const tempFile = tempfile({ extension: '.mp4' });
      const writer = fs.createWriteStream(tempFile);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return tempFile;
    } catch (error) {
      console.error(`An error occurred: ${error}`);
      return null;
    }
  }
}

async function transcribeAudio(audioFile) {
  // const url = 'https://api.openai.com/v1/audio/transcriptions';
  const fileData = fs.createReadStream(audioFile);
  try {
    const response = await openai.createTranscription(fileData, 'whisper-1');

    if (response.status !== 200) {
      console.error(`Failed to transcribe the audio, status code: ${response.status}`);
      return null;
    }

    return response.data.text; // Update this line to access the 'text' property from the response data
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    return null;
  }
}

async function getAudioDurationInSeconds(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

async function processAudio(videoPath) {
  const duration = await getAudioDurationInSeconds(videoPath);
  const blockDuration = 10 * 60; // 10 minutes in seconds
  const numBlocks = Math.ceil(duration / blockDuration);

  let transcription = '';
  for (let i = 0; i < numBlocks; i++) {
    const startTime = i * blockDuration;
    const endTime = Math.min((i + 1) * blockDuration, duration);
    const outputFile = tempfile({ extension: '.mp3' });

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .noVideo()
        .audioCodec('libmp3lame')
        .output(outputFile)
        .on('end', async () => {
          const chunkTranscription = await transcribeAudio(outputFile);
          transcription += chunkTranscription + ' ';
          await fs.promises.unlink(outputFile);
          resolve();
        })
        .on('error', (err) => {
          console.error(`An error occurred: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  return transcription;
}

export default async function handler(req, res) {
  const videoUrl = req.query.videoUrl;

  if (!videoUrl) {
    res.status(400).json({ error: "No video URL provided" });
    return;
  }

  const videoPath = await downloadVideo(videoUrl);
  if (!videoPath) {
    res.status(500).json({ error: "Failed to download the video" });
    return;
  }

  const stats = await fs.promises.stat(videoPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  console.log(`Video file size: ${fileSizeInMegabytes} MB`);

  try {
    // Process the audio in 10-minute chunks and transcribe each chunk
    const transcription = await processAudio(videoPath);

    await fs.promises.unlink(videoPath);

    res.status(200).json({ transcription });
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    res.status(500).json({ error: "An error occurred during audio processing" });
  }
}