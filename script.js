const toggleBtn = document.getElementById("toggle-theme");
const faceInput = document.getElementById("face-input");
const previewImage = document.getElementById("preview-image");
const fileInfo = document.getElementById("file-info");
const dropZone = document.getElementById("drag-drop");
const folderInput = document.getElementById("folder-input");
const progressBar = document.getElementById("progress-bar");

const startBtn = document.getElementById("start-search");
const pauseBtn = document.getElementById("pause-search");
const resumeBtn = document.getElementById("resume-search");
const cancelBtn = document.getElementById("cancel-search");

let folderFiles = [];
let isPaused = false;
let isCancelled = false;

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

faceInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) showPreview(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("ring", "ring-blue-500");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("ring", "ring-blue-500");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    faceInput.files = e.dataTransfer.files;
    showPreview(file);
  }
  dropZone.classList.remove("ring", "ring-blue-500");
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    fileInfo.textContent = `نام فایل: ${file.name} | حجم: ${(file.size / 1024).toFixed(1)}KB`;
  };
  reader.readAsDataURL(file);
}

folderInput.addEventListener("change", (e) => {
  folderFiles = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
  console.log("📂 تعداد فایل‌های پوشه:", folderFiles.length);
});

startBtn.addEventListener("click", async () => {
  if (!folderFiles.length || !faceInput.files.length) {
    alert("لطفاً تصویر چهره و پوشه تصاویر را انتخاب کنید.");
    return;
  }
  isPaused = false;
  isCancelled = false;
  await startSearch();
});

pauseBtn.addEventListener("click", () => { isPaused = true; });
resumeBtn.addEventListener("click", () => { isPaused = false; });
cancelBtn.addEventListener("click", () => {
  isCancelled = true;
  progressBar.value = 0;
});

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('./models/');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./models/');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./models/');
  console.log("✅ مدل‌ها بارگذاری شدند.");
}
window.addEventListener("DOMContentLoaded", loadModels);

async function getFaceDescriptor(imageFile) {
  const img = await faceapi.bufferToImage(imageFile);
  const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  return detection ? detection.descriptor : null;
}

async function startSearch() {
  const targetDescriptor = await getFaceDescriptor(faceInput.files[0]);
  if (!targetDescriptor) {
    alert("❌ چهره‌ای در تصویر ورودی یافت نشد.");
    return;
  }

  let current = 0;
  let matchedFiles = [];

  async function loop() {
    if (isCancelled) return;
    if (isPaused) return setTimeout(loop, 500);
    if (current >= folderFiles.length) {
      alert(`✅ جستجو کامل شد. تصاویر مشابه یافت‌شده: ${matchedFiles.length}`);
      console.log("تصاویر مشابه:", matchedFiles);
      return;
    }

    const file = folderFiles[current];
    const descriptor = await getFaceDescriptor(file);
    if (descriptor) {
      const distance = faceapi.euclideanDistance(targetDescriptor, descriptor);
      if (distance < 0.6) matchedFiles.push({ file, distance });
    }

    current++;
    progressBar.value = (current / folderFiles.length) * 100;
    setTimeout(loop, 80);
  }

  loop();
}