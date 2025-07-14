async function loadModels() {
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('./models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
        document.getElementById('status').innerText = 'مدل‌ها با موفقیت بارگذاری شدند';
        console.log('Models loaded successfully');
    } catch (error) {
        document.getElementById('status').innerText = 'خطا در بارگذاری مدل‌ها. لطفاً کنسول را بررسی کنید.';
        console.error('Error loading models:', error);
    }
}

async function findFace() {
    const referenceImage = document.getElementById('referenceImage').files[0];
    const imageFiles = document.getElementById('imageFolder').files;
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('status');

    if (!referenceImage || imageFiles.length === 0) {
        statusDiv.innerText = 'لطفاً تصویر مرجع و حداقل یک تصویر برای جستجو آپلود کنید.';
        return;
    }

    statusDiv.innerText = 'در حال پردازش...';
    resultsDiv.innerHTML = '';

    try {
        const referenceImg = await faceapi.bufferToImage(referenceImage);
        const referenceDescriptor = await faceapi
            .detectSingleFace(referenceImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!referenceDescriptor) {
            statusDiv.innerText = 'چهره‌ای در تصویر مرجع یافت نشد.';
            return;
        }

        for (let file of imageFiles) {
            const img = await faceapi.bufferToImage(file);
            const detections = await faceapi
                .detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resultImg = document.createElement('img');
            resultImg.src = URL.createObjectURL(file);
            let isMatch = false;

            for (const detection of detections) {
                const distance = faceapi.euclideanDistance(referenceDescriptor.descriptor, detection.descriptor);
                if (distance < 0.6) {
                    isMatch = true;
                }
            }

            if (isMatch) {
                resultImg.classList.add('match');
            }
            resultsDiv.appendChild(resultImg);
        }
        statusDiv.innerText = 'جستجو تکمیل شد!';
    } catch (error) {
        statusDiv.innerText = 'خطا در پردازش تصاویر. لطفاً کنسول را بررسی کنید.';
        console.error('Error processing images:', error);
    }
}

window.onload = async () => {
    await loadModels();
    document.getElementById('searchButton').addEventListener('click', findFace);
};