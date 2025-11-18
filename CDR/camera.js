export function openCamera(onPhotoTaken) {
  const cameraModal = createCameraModal();
  document.body.appendChild(cameraModal);

  const video = document.getElementById('camera-feed');
  const captureButton = document.getElementById('capture-btn');
  const closeButton = document.getElementById('close-camera-btn');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Error accessing camera: ", err);
      alert('Could not access the camera. Please check your browser settings and permissions.');
      document.body.removeChild(cameraModal);
    });

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

    // Stop camera stream and remove modal
    video.srcObject.getTracks().forEach(track => track.stop());
    document.body.removeChild(cameraModal);
  };

  closeButton.onclick = () => {
    video.srcObject.getTracks().forEach(track => track.stop());
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
    <video id="camera-feed" autoplay style="width: 80%; max-width: 600px;"></video>
    <div class="mt-3">
        <button id="capture-btn" class="btn btn-primary">Capture</button>
        <button id="close-camera-btn" class="btn btn-secondary">Close</button>
    </div>
  `;
  return modal;
}