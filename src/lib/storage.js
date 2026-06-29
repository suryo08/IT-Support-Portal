import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const UPLOAD_DRIVER = process.env.UPLOAD_DRIVER || 's3';
const OBJECT_STORAGE_ENDPOINT = process.env.OBJECT_STORAGE_ENDPOINT || 'https://is3.cloudhost.id';
const OBJECT_STORAGE_BUCKET = process.env.OBJECT_STORAGE_BUCKET || 'onechitra';
const OBJECT_STORAGE_PREFIX = process.env.OBJECT_STORAGE_PREFIX || 'upload';
const OBJECT_STORAGE_REGION = process.env.OBJECT_STORAGE_REGION || 'us-east-1';
const OBJECT_STORAGE_ACCESS_KEY_ID = process.env.OBJECT_STORAGE_ACCESS_KEY_ID || 'I2BBBINVCAQXY7G6M5OD';
const OBJECT_STORAGE_SECRET_ACCESS_KEY = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || 'c4YupRIPTlaetB3XIwIXOO8EBcZWZfTrEqghDN1A';

// Initialize S3 Client
const s3Client = new S3Client({
  endpoint: OBJECT_STORAGE_ENDPOINT,
  region: OBJECT_STORAGE_REGION,
  credentials: {
    accessKeyId: OBJECT_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: OBJECT_STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function putObject(path, data, contentType) {
  // Prepend prefix if set
  const fullKey = OBJECT_STORAGE_PREFIX ? `${OBJECT_STORAGE_PREFIX}/${path}`.replace(/\/+/g, '/') : path;
  
  try {
    const command = new PutObjectCommand({
      Bucket: OBJECT_STORAGE_BUCKET,
      Key: fullKey,
      Body: data,
      ContentType: contentType,
    });
    await s3Client.send(command);
    console.log(`Successfully uploaded file to S3: ${fullKey}`);
    return { path };
  } catch (err) {
    console.error('S3 putObject failed:', err.message);
    throw err;
  }
}

export async function getObject(path) {
  // Prepend prefix if set
  const fullKey = OBJECT_STORAGE_PREFIX ? `${OBJECT_STORAGE_PREFIX}/${path}`.replace(/\/+/g, '/') : path;
  
  try {
    const command = new GetObjectCommand({
      Bucket: OBJECT_STORAGE_BUCKET,
      Key: fullKey,
    });
    const response = await s3Client.send(command);
    
    // Convert stream to Buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      data: buffer,
      contentType: response.ContentType || 'application/pdf',
    };
  } catch (err) {
    console.error('S3 getObject failed:', err.message);
    throw err;
  }
}
