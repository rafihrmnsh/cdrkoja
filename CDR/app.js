import { openCamera } from './camera.js';

const takePhotoButton = document.getElementById('take-photo-btn');
takePhotoButton.addEventListener('click', () => {
  openCamera((dataUrl) => {
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    img.classList.add('img-fluid', 'rounded');
    imagePreview.appendChild(img);
    document.getElementById('photoUploadLabel').style.display = 'none';
  });
});

// Menangani submit form
const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
    event.preventDefault(); // Mencegah form mengirim secara default

    // Ambil semua data dari form
    const formData = new FormData(form);
    const formProps = Object.fromEntries(formData);

    // Ambil data gambar dari preview
    const imagePreview = document.getElementById('imagePreview');
    const imageElement = imagePreview.querySelector('img');
    formProps.damagePhoto = imageElement ? imageElement.src : null;

    // Tambahkan ID unik dan timestamp
    formProps.id = `draft_${new Date().getTime()}`;
    formProps.submittedAt = new Date().toISOString();

    // Ambil data laporan yang ada dari localStorage, atau buat array baru
    const existingReports = JSON.parse(localStorage.getItem('draftReports')) || [];
    
    // Tambahkan laporan baru
    existingReports.push(formProps);

    // Simpan kembali ke localStorage
    localStorage.setItem('draftReports', JSON.stringify(existingReports));

    console.log('Form submitted and saved to localStorage:', formProps);
    alert('Laporan berhasil disimpan sebagai draft!');
    
    // Reset form dan preview gambar
    form.reset();
    imagePreview.innerHTML = '';
    document.getElementById('photoUploadLabel').style.display = 'block';
});

// Script untuk upload foto dan signature pad tetap di sini agar terpusat
// Photo upload script
const damagePhotoInput = document.getElementById('damagePhotoInput');
const photoUploadLabel = document.getElementById('photoUploadLabel');
const imagePreview = document.getElementById('imagePreview');

damagePhotoInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('img-fluid', 'rounded');
      imagePreview.appendChild(img);
      photoUploadLabel.style.display = 'none';
    }
    reader.readAsDataURL(file);
  }
});

