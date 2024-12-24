document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const inferenceBtn = document.getElementById('inferenceBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const previewContainer = document.querySelector('.preview-container');
    const inputPreview = document.getElementById('inputPreview');
    const outputPreview = document.getElementById('outputPreview');

    let uploadedImage = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        });
    });

    // Handle file drop
    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    // Handle click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        uploadedImage = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            inputPreview.src = e.target.result;
            previewContainer.style.display = 'grid';
            inferenceBtn.disabled = false;
            outputPreview.src = '';
            downloadBtn.disabled = true;
        };
        
        reader.readAsDataURL(file);
    }

    // Handle inference
    inferenceBtn.addEventListener('click', async () => {
        if (!uploadedImage) return;

        // Add loading state
        inferenceBtn.disabled = true;
        inferenceBtn.classList.add('loading');
        
        try {
            const formData = new FormData();
            formData.append('file', uploadedImage);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Inference failed');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            outputPreview.src = imageUrl;
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Inference failed:', error);
            alert('Inference failed. Please ensure the server is running and try again.');
        } finally {
            inferenceBtn.disabled = false;
            inferenceBtn.classList.remove('loading');
        }
    });

    // Handle download
    downloadBtn.addEventListener('click', () => {
        if (!outputPreview.src) return;

        const link = document.createElement('a');
        link.download = 'yolov11_result.jpg';
        link.href = outputPreview.src;
        link.click();
    });

    // Check server health on load
    fetch('/health')
        .catch(error => {
            console.error('Server health check failed:', error);
            const warning = document.createElement('div');
            warning.className = 'server-warning';
            warning.textContent = '⚠️ Server not running. Please start the Python server to enable inference.';
            document.querySelector('.container').insertBefore(warning, document.querySelector('.upload-container'));
        });
});