<script lang="ts">
	import { PUBLIC_R2_BUCKET_DOMAIN, PUBLIC_R2_BUCKET_NAME } from '$env/static/public';
	import { Fileupload } from 'flowbite-svelte';

	let uploadedFileUrl: string | undefined = undefined;	
	const R2_ACCOUNT_ID = 'a3b8c0b4e8ad04fe9acb90b863bda25e'
	let url: string | undefined = undefined;
	const handleFileUpload = async (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const getPresignedUrlResponse = await fetch('/api/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fileName: file.name,
					fileType: file.type
				})
			});

			if (!getPresignedUrlResponse.ok) {
				console.error('Failed to get presigned URL');
			}

			const { presignedUrl, objectKey } = await getPresignedUrlResponse.json();

			const uploadToR2Response = await fetch(presignedUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type
				},
				body: file
			});

			if (!uploadToR2Response.ok) {
				console.error('Failed to upload file to R2');
			}
			url =  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${PUBLIC_R2_BUCKET_NAME}/${objectKey}`;
			
			uploadedFileUrl = `${PUBLIC_R2_BUCKET_DOMAIN}/${objectKey}`;
		}
	};
</script>

<svelte:head>
	<title>Upload picture R2</title>
</svelte:head>

<main class="max-w-5xl py-12 mx-auto space-y-12">
	<h1>Upload picture R2</h1>

	<Fileupload id="with_helper" class="mb-2" on:change={handleFileUpload} />
	<br>

	<p> fail: {uploadedFileUrl}</p>
	<p> url: {url}</p>
</main>
