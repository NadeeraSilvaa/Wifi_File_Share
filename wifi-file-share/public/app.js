(function () {
  const fileListEl = document.getElementById('file-list');
  const fileInput = document.getElementById('file-input');
  const addFilesBtn = document.getElementById('add-files-btn');
  const dropZone = document.getElementById('drop-zone');
  const shareUrlEl = document.getElementById('share-url');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const qrCodeEl = document.getElementById('qr-code');
  const deviceLabelEl = document.getElementById('device-label');
  const nameDeviceBtn = document.getElementById('name-device-btn');

  function triggerDownload(url, filename) {
    fetch(url, { method: 'GET' })
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(function () { window.location.href = url; });
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFileList(files) {
    fileListEl.innerHTML = '';
    if (!files.length) {
      fileListEl.innerHTML = '<li class="empty">No files shared yet. Drop or add files above.</li>';
      return;
    }
    files.forEach(function (f) {
      const li = document.createElement('li');
      li.className = 'file-item';
      const fileUrl = '/files/' + encodeURIComponent(f.name);
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = f.name;
      a.className = 'file-name-link';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        triggerDownload(fileUrl, f.name);
      });
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      meta.textContent = formatSize(f.size);
      var deviceLabel = f.deviceName || (f.deviceId ? 'Device ' + f.deviceId : null);
      const deviceSpan = document.createElement('span');
      deviceSpan.className = 'file-device';
      deviceSpan.textContent = deviceLabel || '—';
      if (deviceLabel) deviceSpan.setAttribute('title', f.deviceId ? 'ID: ' + f.deviceId : '');
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'download-btn';
      downloadBtn.textContent = 'Download';
      downloadBtn.setAttribute('aria-label', 'Download ' + f.name);
      downloadBtn.addEventListener('click', function () {
        triggerDownload(fileUrl, f.name);
      });
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'delete-btn';
      delBtn.textContent = 'Delete';
      delBtn.setAttribute('aria-label', 'Delete ' + f.name);
      delBtn.addEventListener('click', function () {
        fetch('/api/files/' + encodeURIComponent(f.name), { method: 'DELETE' })
          .then(function (r) { if (r.ok) loadFileList(); });
      });
      li.appendChild(a);
      li.appendChild(meta);
      li.appendChild(deviceSpan);
      li.appendChild(downloadBtn);
      li.appendChild(delBtn);
      fileListEl.appendChild(li);
    });
  }

  function loadFileList() {
    fetch('/api/files')
      .then(function (r) { return r.json(); })
      .then(function (data) { renderFileList(data.files || []); })
      .catch(function () { renderFileList([]); });
  }

  function getDeviceId() {
    var key = 'wifi-share-device-id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  }

  function getDeviceName() {
    return localStorage.getItem('wifi-share-device-name') || '';
  }

  function updateDeviceLabel() {
    if (!deviceLabelEl) return;
    var name = getDeviceName();
    var id = getDeviceId();
    deviceLabelEl.textContent = 'Uploading as: ' + (name || 'Device ' + id);
  }

  function uploadFiles(files) {
    if (!files || !files.length) return;
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('files', files[i]);
    }
    var deviceId = getDeviceId();
    var deviceName = getDeviceName();
    fetch('/api/upload', {
      method: 'POST',
      headers: {
        'X-Device-Id': deviceId,
        'X-Device-Name': deviceName,
      },
      body: form,
    })
      .then(function (r) { return r.json(); })
      .then(function () { loadFileList(); })
      .catch(function () { loadFileList(); });
  }

  addFilesBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    const files = fileInput.files;
    if (files.length) uploadFiles(Array.from(files));
    fileInput.value = '';
  });

  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(Array.from(files));
  });

  fetch('/api/info')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var url = data.url || 'http://localhost:8080';
      shareUrlEl.textContent = url;
      if (qrCodeEl) {
        qrCodeEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
      }
    })
    .catch(function () {
      var url = window.location.origin;
      shareUrlEl.textContent = url;
      if (qrCodeEl) {
        qrCodeEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
      }
    });

  updateDeviceLabel();
  if (nameDeviceBtn) {
    nameDeviceBtn.addEventListener('click', function () {
      var current = getDeviceName();
      var name = window.prompt('Name this device (e.g. “Nadeera’s iPhone”). Leave blank to use device ID.', current || '');
      if (name !== null) {
        localStorage.setItem('wifi-share-device-name', name.trim());
        updateDeviceLabel();
      }
    });
  }

  copyUrlBtn.addEventListener('click', function () {
    const url = shareUrlEl.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        copyUrlBtn.textContent = 'Copied!';
        setTimeout(function () { copyUrlBtn.textContent = 'Copy'; }, 2000);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyUrlBtn.textContent = 'Copied!';
      setTimeout(function () { copyUrlBtn.textContent = 'Copy'; }, 2000);
    }
  });

  loadFileList();
  setInterval(loadFileList, 2 * 60 * 1000);
})();
