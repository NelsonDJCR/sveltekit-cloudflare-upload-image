import { PUBLIC_R2_BUCKET_NAME } from '$env/static/public';
import { S3 } from '$lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { json } from '@sveltejs/kit';

const slugifyString = (str: string) => {
	return str
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/\./g, '-')
		.replace(/-+/g, '-')
		.replace(/[^a-z0-9-]/g, '-');
};

export const POST = async ({ request }) => {
	const { fileName, fileType } = (await request.json()) as {
		fileName: string | undefined;
		fileType: string | undefined;
	};

	if (!fileName || !fileType || fileName.trim() === '' || fileType.trim() === '') {
		return json({ message: 'Missing required parameters.' }, { status: 400 });
	}

	const objectKey = `images/food/${slugifyString(Date.now().toString())}-${slugifyString(fileName)}`;

	const presignedUrl = await getSignedUrl(
		S3,
		new PutObjectCommand({
			Bucket: PUBLIC_R2_BUCKET_NAME,
			Key: objectKey,
			ContentType: fileType,
			ACL: 'public-read'
		})
	);

	return json({ presignedUrl, objectKey });
};
