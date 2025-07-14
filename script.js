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
  document.body.classList.toggle("dark-mode");
});

faceInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) showPreview(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#00aa00";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    faceInput.files = e.dataTransfer.files;
    showPreview(file);
  }
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
  console.log("تصاویر انتخاب‌شده:", folderFiles.length);
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

pauseBtn.addEventListener("click", () => {
  isPaused = true;
});

resumeBtn.addEventListener("click", () => {
  isPaused = false;
});

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
    alert("چهره‌ای در تصویر ورودی یافت نشد.");
    return;
  }

  let current = 0;
  let matchedFiles =