import ffmpeg from 'fluent-ffmpeg';
import tempfile from 'tempfile';
import { Configuration, OpenAIApi } from 'openai';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fetch from 'node-fetch';
import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';

const { 
  APP_OPENAI_API_KEY,
  APP_PLAYHT_USER_ID,
  APP_PLAYHT_SECRET_KEY,
  APP_AWS_REGION,
  APP_AWS_ACCESS_KEY,
  APP_AWS_SECRET_ACCESS_KEY,
  APP_AWS_BUCKET_NAME,
} = process.env

const openai = new OpenAIApi(new Configuration({
  apiKey: APP_OPENAI_API_KEY,
}));

const s3Client = new S3Client({ 
  region: APP_AWS_REGION,
  credentials: {
    accessKeyId: APP_AWS_ACCESS_KEY,
    secretAccessKey: APP_AWS_SECRET_ACCESS_KEY
  }
});

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

async function getImagePrompt(text) {
  const prompt = `Take the following text and provide a condensed, yet comprehensive summary that encapsulates the key idea in just a 5-10 words and reads like a description of a painting. Include "oil painting" in the text. ${text}`

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: prompt}],
    max_tokens: 100
  });

  if (response.status !== 200) {
    throw new Error(`Failed to generate prompt, status code: ${response.status}`);
  }

  return response.data.choices[0].message.content;
}

async function getImage(prompt) {
  const response = await openai.createImage({
    prompt: prompt,
    n: 1,
    size: "256x256",
  });

  if (response.status !== 200) {
    throw new Error(`Failed to generate image, status code: ${response.status}`);
  }

  return response.data.data[0];
}

async function getAudio(text) {
  const headers = {
    'accept': 'text/event-stream',
    'content-type': 'application/json',
    'AUTHORIZATION': `Bearer ${APP_PLAYHT_SECRET_KEY}`,
    'X-USER-ID': APP_PLAYHT_USER_ID
  }
  const response = await fetch('https://play.ht/api/v2/tts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      quality: 'high',
      output_format: 'mp3',
      sample_rate: 24000,
      text: text,
      voice: 'larry'
    })
  });

  return new Promise((resolve, reject) => {
    response.body.on('error', reject);
    response.body.on('data', async (data) => {
      const strData = data.toString('utf8');
      try {
        if (strData.indexOf('event: completed') > -1) {
          const jsonMatch = strData.match(/{.*}/);
          resolve(JSON.parse(jsonMatch[0]));
        }
      } catch (err) {
        reject(err)
      }
    })
  })
}

async function downloadFile(url) {
  const response = await axios.get(url, {
    responseType: 'stream'
  });

  if (response.status !== 200) {
    throw new Error(`Failed to download file, status code: ${response.status}`);
  }

  let tempFilePath;
  if (response.headers['content-type'].includes('audio')) {
    tempFilePath = tempfile({ extension: '.mp3' });
  } else if (response.headers['content-type'].includes('image')) {
    tempFilePath = tempfile({ extension: '.png' });
  } else {
    throw new Error('Unsupported file type');
  }

  const fileStream = fs.createWriteStream(tempFilePath);
  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on('finish', () => resolve(tempFilePath));
    fileStream.on('error', reject);
  });
}

async function uploadToS3(bucketName, key, filePath) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: fs.createReadStream(filePath),
    },
  });

  const result = await upload.done();
  return result;
}

async function processVideo(imagePath, audioPath) {
  const outputPath = tempfile({ extension: '.mp4' });
  const response = await new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath) // Path to the image file
      .inputOptions('-loop 1') // Loop the image
      .input(audioPath) // Path to the audio file
      .outputOptions('-shortest') // Finish encoding when the shortest input stream ends
      .outputOptions('-c:v libx264') // Codec video: libx264
      .outputOptions('-tune stillimage') // Tune for still image input
      .outputOptions('-c:a aac') // Codec audio: aac
      .outputOptions('-b:a 192k') // Audio bitrate
      .outputOptions('-pix_fmt yuv420p') // Pixel format
      .output(outputPath) // Output file
      .on('end', async () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });

  return response;
}

export default async function handler(req, res) {
  const { text } = req.body;

  if (req.method !== 'POST') {
    return res.status(400).json({ 'error': 'Bad request' });
  }

  try {
    const audioOutput = await getAudio(text);
    // console.log('audioOutput', audioOutput)
    const audioFilePath = await downloadFile(audioOutput.url);
    // console.log('audioFilePath', audioFilePath)
    const imagePrompt = await getImagePrompt(text);
    // console.log('imagePrompt', imagePrompt)
    const imageOutput = await getImage(imagePrompt);
    // console.log('imageOutput', imageOutput)
    const imageFilePath = await downloadFile(imageOutput.url);
    // console.log('imageFilePath', imageFilePath)
    const videoFilePath = await processVideo(imageFilePath, audioFilePath);
    // console.log('videoFilePath', videoFilePath)

    const key = `voiceover/${path.basename(videoFilePath)}`; // update as needed
    const uploadResult = await uploadToS3(APP_AWS_BUCKET_NAME, key, videoFilePath);
    const s3Url = uploadResult.Location;

    return res.status(200).json({ url: s3Url });
  } catch (err) {
    console.error(err)
    return res.status(500).json({ 'error': 'An error occurred. Please try again.' });
  }
}