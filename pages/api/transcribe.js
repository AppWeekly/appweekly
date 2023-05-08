import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import tempfile from 'tempfile';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { URL } from 'url';

const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function googleDriveVideoDownload(fileId) {
  try {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
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
  const fileData = fs.createReadStream(audioFile);

  try {
    const response = await openai.createTranscription(
      fileData,
      "whisper-1"
    );

    if (response.status !== 200) {
      console.error(`Failed to transcribe the audio, status code: ${response.status}`);
      return null;
    }

    return response.transcription;
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    return null;
  }
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

  const audioOutput = tempfile({ extension: '.mp3' });
  ffmpeg(videoPath)
    .noVideo()
    .audioCodec('libmp3lame')
    .output(audioOutput)
    .on('end', async () => {
      try {
        await fs.unlink(videoPath);

        // Transcribe the audio using Whisper ASR API
        const transcription = await transcribeAudio(audioOutput);
        await fs.unlink(audioOutput);

        res.status(200).json({ transcription });
      } catch (error) {
        console.error(`An error occurred: ${error}`);
        res.status(500).json({ error: "An error occurred during audio processing" });
      }
    })
    .on('error', (err) => {
      console.error(`An error occurred: ${err.message}`);
      res.status(500).json({ error: "An error occurred during audio processing" });
    })
    .run();
}