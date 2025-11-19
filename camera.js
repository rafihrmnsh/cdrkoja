let currentStream;

async function startStream(constraints) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const video = document.getElementById('camera-feed');
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;
    return stream;
  } catch (err) {
    console.error("Error starting camera stream: ", err);
    alert('Could not start the camera. Please check your browser settings and permissions.');
    throw err; // re-throw to be caught by caller
  }
}

export async function openCamera(onPhotoTaken) {
  const cameraModal = createCameraModal();
  document.body.appendChild(cameraModal);

  const video = document.getElementById('camera-feed');
  const captureButton = document.getElementById('capture-btn');
  const closeButton = document.getElementById('close-camera-btn');
  const cameraSelect = document.getElementById('camera-select');
  const cameraSelectContainer = document.getElementById('camera-select-container');

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length > 1) {
      cameraSelectContainer.style.display = 'block';
      videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
      });

      cameraSelect.onchange = () => {
        startStream({ video: { deviceId: { exact: cameraSelect.value } } });
      };
    }

    // Try to start with the environment camera first
    await startStream({ video: { facingMode: 'environment' } });

  } catch (err) {
    console.error("Error opening camera: ", err);
    document.body.removeChild(cameraModal);
    return; // Stop execution if camera fails
  }

  captureButton.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add timestamp
    const timestamp = new Date().toLocaleString();
    context.font = '20px Arial';
    context.fillStyle = 'white';
    context.fillText(timestamp, 10, 30);
    
    const dataUrl = canvas.toDataURL('image/png');
    onPhotoTaken(dataUrl);

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    document.body.removeChild(cameraModal);
  };

  closeButton.onclick = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    document.body.removeChild(cameraModal);
  };
}

function createCameraModal() {
  const modal = document.createElement('div');
  modal.id = 'camera-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  modal.innerHTML = `
    <video id="camera-feed" autoplay playsinline style="width: 80%; max-width: 600px;"></video>
    <div id="camera-select-container" class="mt-3" style="display: none;">
      <select id="camera-select" class="form-select"></select>
    </div>
    <div class="mt-3">
        <button id="capture-btn" class="btn btn-primary">Capture</button>
        <button id="close-camera-btn" class="btn btn-secondary">Close</button>
    </div>
  `;
  return modal;
}
