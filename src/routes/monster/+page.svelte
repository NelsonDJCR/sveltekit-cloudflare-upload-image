<script lang="ts">
	let imageFile: File | null = null;
	let webpBlob: Blob | null = null;
	let originalSize: number = 0;
	let compressedSize: number = 0;
	let quality: number = 0.2;
	let message: string = '';
	let uploadedImageUrl: string = '';
	let reductionPercentage: string = '';

	const handleImageChange = async (event: Event): Promise<void> => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		originalSize = file.size;
		if (originalSize > 1000 * 1024) {
			message = 'La imagen supera 500 KB. Por favor, optimízala primero en Squoosh.';
			return;
		}

		message = '';
		await compressAndConvertToWebP(file, 0);
		reductionPercentage = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);
	};

	const compressAndConvertToWebP = (file: File, attempts: number): Promise<void> => {
		return new Promise((resolve) => {
			if (attempts > 3) {
				message = 'No se pudo reducir la imagen a menos de 50 KB después de 3 intentos.';
				resolve();
				return;
			}

			const reader = new FileReader();
			reader.onload = function (e: ProgressEvent<FileReader>) {
				const img = new Image();
				img.src = e.target?.result as string;

				img.onload = function () {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						message = 'Error al procesar la imagen.';
						resolve();
						return;
					}

					canvas.width = img.width;
					canvas.height = img.height;

					ctx.drawImage(img, 0, 0);

					canvas.toBlob(
						(blob) => {
							if (blob) {
								webpBlob = blob;
								compressedSize = webpBlob.size;

								if (compressedSize > 50 * 1024 && attempts < 3) {
									quality -= 0.05;
									compressAndConvertToWebP(file, attempts + 1).then(resolve);
								} else {
									resolve();
								}
							} else {
								message = 'No se pudo generar el blob de la imagen.';
								resolve();
							}
						},
						'image/webp',
						quality
					);
				};
			};
			reader.readAsDataURL(file);
		});
	};

	const uploadImage = async (): Promise<void> => {
		if (!webpBlob) return;

		const getPresignedUrlResponse = await fetch('/api/upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileName: 'compressed-image.webp', fileType: webpBlob.type })
		});

		if (!getPresignedUrlResponse.ok) {
			message = 'Error al obtener la URL prefirmada.';
			return;
		}

		const { presignedUrl, objectKey } = await getPresignedUrlResponse.json();

		const uploadToR2Response = await fetch(presignedUrl, {
			method: 'PUT',
			headers: { 'Content-Type': webpBlob.type },
			body: webpBlob
		});

		if (!uploadToR2Response.ok) {
			message = 'Error al subir la imagen a R2.';
			return;
		}

		uploadedImageUrl = `https://cdn.gastroflow.app/${objectKey}`;
	};
</script>

<div class="flex justify-center items-center min-h-screen bg-gray-900 text-white">
	<div class="bg-black p-8 rounded-xl shadow-lg w-96">
		<input
			type="file"
			on:change={handleImageChange}
			class="w-full bg-gray-800 text-white p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition"
		/>

		{#if message}
			<p class="mt-4 text-red-500 text-sm">{message}</p>
		{/if}

		{#if webpBlob}
			<div class="mt-6">
				<p class="text-gray-300">Tamaño original: {(originalSize / 1024).toFixed(2)} KB</p>
				<p class="text-gray-300">Tamaño comprimido: {(compressedSize / 1024).toFixed(2)} KB</p>
				<p class="text-gray-300">Reducción: {reductionPercentage}%</p>
				<button
					on:click={uploadImage}
					class="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
					>Subir a Cloudflare</button
				>
			</div>
		{/if}

		{#if uploadedImageUrl}
			<div class="mt-6">
				<p class="text-green-500 text-sm">Imagen subida exitosamente. URL:</p>
				<a href={uploadedImageUrl} target="_blank" class="block text-blue-400 mt-2 truncate"
					>{uploadedImageUrl}</a
				>
				<img
					src={uploadedImageUrl}
					alt="Imagen subida"
					class="mt-4 w-full h-auto rounded-lg shadow-md"
				/>
			</div>
		{/if}
	</div>
</div>
