let isPaused = false;

async function loadModels() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = 'در حال بارگذاری مدل‌ها...';
    document.getElementById('progress').classList.remove('hidden');
    document.getElementById('progressBar').style.width = '0%';

    try {
        const modelPath = './models';
        console.log('Attempting to load models from:', modelPath);
        
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
        document.getElementById('progressBar').style.width = '33%';
        console.log('SSD Mobilenet V1 loaded');
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        document.getElementById('progressBar').style.width = '66%';
        console.log('Face Landmark 68 loaded');
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
        document.getElementById('progressBar').style.width = '100%';
        console.log('Face Recognition loaded');

        statusDiv.innerText = 'مدل‌ها با موفقیت بارگذاری شدند';
        document.getElementById('progress').classList.add('hidden');
    } catch (error) {
        statusDiv.innerText = 'خطا در بارگذاری مدل‌ها. لطفاً کنسول را بررسی کنید.';
        document.getElementById('progress').classList.add('hidden');
        console.error('Error loading models:', error);
        throw error;
    }
}

function showPreview(input, previewDivId) {
    const previewDiv = document.getElementById(previewDivId);
    previewDiv.innerHTML = '';
    const files = input.files;
    for (let file of files) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.classList.add('max-w-full', 'h-auto', 'rounded');
        previewDiv.appendChild(img);
    }
}

async function findFace() {
    const referenceImage = document.getElementById('referenceImage').files[0];
    const imageFiles = document.getElementById('imageFolder').files;
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('status');
    const progressBar = document.getElementById('progressBar');
    const progressDiv = document.getElementById('progress');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const searchButton = document.getElementById('searchButton');

    if (!referenceImage || imageFiles.length === 0) {
        statusDiv.innerText = 'لطفاً تصویر مرجع و حداقل یک تصویر برای جستجو آپلود کنید.';
        return;
    }

    statusDiv.innerText = 'در حال پردازش تصاویر...';
    resultsDiv.innerHTML = '';
    progressDiv.classList.remove('hidden');
    progressBar.style.width = '0%';
    pauseButton.classList.remove('hidden');
    searchButton.classList.add('hidden');

    try {
        const referenceImg = await faceapi.bufferToImage(referenceImage);
        console.log('Reference image loaded');
        const referenceDescriptor = await faceapi
            .detectSingleFace(referenceImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!referenceDescriptor) {
            statusDiv.innerText = 'چهره‌ای در تصویر مرجع یافت نشد.';
            progressDiv.classList.add('hidden');
            pauseButton.classList.add('hidden');
            searchButton.classList.remove('hidden');
            return;
        }

        const totalFiles = imageFiles.length;
        let processedFiles = 0;

        for (let file of imageFiles) {
            if (isPaused) {
                statusDiv.innerText = 'پردازش متوقف شد. برای ادامه کلیک کنید.';
                resumeButton.classList.remove('hidden');
                pauseButton.classList.add('hidden');
                await new Promise(resolve => {
                    resumeButton.onclick = () => {
                        isPaused = false;
                        resumeButton.classList.add('hidden');
                        pauseButton.classList.remove('hidden');
                        statusDiv.innerText = 'در حال پردازش تصاویر...';
                        resolve();
                    };
                });
            }

            console.log('Processing image:', file.name);
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
                    console.log(`Match found in ${file.name}, distance: ${distance}`);
                }
            }

            if (isMatch) {
                resultImg.classList.add('match');
            }
            resultsDiv.appendChild(resultImg);

            processedFiles++;
            progressBar.style.width = `${(processedFiles / totalFiles) * 100}%`;
        }

        statusDiv.innerText = 'جستجو تکمیل شد!';
        progressDiv.classList.add('hidden');
        pauseButton.classList.add('hidden');
        searchButton.classList.remove('hidden');
    } catch (error) {
        statusDiv.innerText = 'خطا در پردازش تصاویر. لطفاً کنسول را بررسی کنید.';
        console.error('Error processing images:', error);
        progressDiv.classList.add('hidden');
        pauseButton.classList.add('hidden');
        searchButton.classList.remove('hidden');
    }
}

window.onload = async () => {
    try {
        await loadModels();

        document.getElementById('referenceImage').addEventListener('change', () => {
            showPreview(document.getElementById('referenceImage'), 'referencePreview');
        });
        document.getElementById('imageFolder').addEventListener('change', () => {
            showPreview(document.getElementById('imageFolder'), 'imagesPreview');
        });
        document.getElementById('searchButton').addEventListener('click', findFace);
        document.getElementById('pauseButton').addEventListener('click', () => {
            isPaused = true;
        });
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};