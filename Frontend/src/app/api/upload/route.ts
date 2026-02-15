import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import config from '@/lib/config';

interface UploadResponse {
  imageUrl?: string;
  message?: string;
}

interface UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function sanitizeFilename(filename: string): string {
  const originalFilename = filename;
  // Remove common image dimension suffixes like " (1200 x 400 px)"
  const cleanedFilename = originalFilename.replace(/\s*\(\d+\s*x\s*\d+\s*px\)|\s*\(\d+x\d+\)\s*/gi, '');

  const sanitized = cleanedFilename
    .normalize('NFD') // Normalize to decompose combined characters
    .replace(/[̀-ͯ]/g, '') // Remove diacritics using Unicode range
    .replace(/\s+/g, '_') // Replace spaces with underscores first
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace non-alphanumeric, non-underscore, non-period with underscore
    .replace(/__+/g, '_') // Replace multiple underscores with a single underscore
    .replace(/^_+|_+$/g, '') // Trim underscores from start/end
    .toLowerCase(); // Convert to lowercase for consistency

  const fileExtension = sanitized.split('.').pop();
  const baseFilename = fileExtension ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized;

  // Append a unique timestamp to avoid collisions
  const uniqueSuffix = Date.now();
  return `${uniqueSuffix}_${baseFilename}.${fileExtension}`;
}

export async function POST(request: Request): Promise<NextResponse<UploadResponse>> {
  const headersList = headers();
  const authorization = headersList.get('authorization');

  // Basic authentication check (replace with your actual authentication logic)
  console.log('Authorization header:', authorization);
  if (!authorization || !authorization.startsWith('Bearer ')) {
    console.log('Authentication failed: Missing or invalid Bearer token');
    return NextResponse.json({ message: 'Unauthorized - Missing or invalid Bearer token' }, { status: 401 });
  }
  
  console.log('Authentication successful');

  // Check if required environment variables are set
  if (!process.env.AWS_S3_BUCKET_NAME) {
    console.error('AWS_S3_BUCKET_NAME environment variable is not set');
    return NextResponse.json({ message: 'Server configuration error: S3 bucket not configured' }, { status: 500 });
  }

  if (!process.env.AWS_S3_ACCESS_KEY_ID || !process.env.AWS_S3_SECRET_ACCESS_KEY) {
    console.error('AWS credentials not properly configured');
    return NextResponse.json({ message: 'Server configuration error: AWS credentials not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (e.g., images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File size too large' }, { status: 400 });
    }

    const originalFilename = file.name;
    const finalFilename = sanitizeFilename(originalFilename);

    console.log('Original Filename:', originalFilename);
    console.log('Sanitized and Final Filename for S3:', finalFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: finalFilename,
      Body: buffer,
      ContentType: file.type,
      // ACL removed - bucket doesn't support Access Control Lists
    };

    console.log('Attempting to upload to S3 with params:', {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      fileSize: buffer.length
    });

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const imageUrl = `https://${config.images.domain}/${finalFilename}`;

    console.log('Generated Image URL:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('InvalidAccessKeyId')) {
        return NextResponse.json({ message: 'AWS Access Key ID is invalid' }, { status: 500 });
      }
      if (error.message.includes('SignatureDoesNotMatch')) {
        return NextResponse.json({ message: 'AWS Secret Access Key is invalid' }, { status: 500 });
      }
      if (error.message.includes('NoSuchBucket')) {
        return NextResponse.json({ message: 'S3 bucket does not exist' }, { status: 500 });
      }
      return NextResponse.json({ message: `Upload failed: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Internal server error during upload' }, { status: 500 });
  }
}