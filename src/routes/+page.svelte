<script lang="ts">
	let uploadedFileUrl: string | undefined = undefined;
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
			uploadedFileUrl = `https://cdn.gastroflow.app/${objectKey}`;
		}
	};
</script>

<svelte:head>
	<title>Upload picture R2</title>
</svelte:head>
<input type="file" name="" id="with_helper" class="mb-2" on:change={handleFileUpload} />
<img src={uploadedFileUrl} alt="" />
