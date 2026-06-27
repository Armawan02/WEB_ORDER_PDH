// PENTING: Ganti string ini dengan URL Web App (Deployment) dari Google Apps Script Anda!
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyzHqAx49RV-iKTrwZYJboSnsOynhc4t2sCngZOVst2gVtqih82qfrjQ9APjzgFSDevdw/exec';

let isAdmin = false;
let globalData = [];

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

document.getElementById('jenisPdh').addEventListener('change', function(e) {
  const karyaGroup = document.getElementById('karya-group');
  const fileKarya = document.getElementById('fileKarya');
  if (e.target.value === 'Exclusive') {
    karyaGroup.style.display = 'block';
    fileKarya.required = true;
  } else {
    karyaGroup.style.display = 'none';
    fileKarya.required = false;
  }
});

document.getElementById('form-pesanan').addEventListener('submit', async function(event) {
  event.preventDefault();
  
  const btnSubmit = document.getElementById('btn-submit');
  const messageDiv = document.getElementById('message');
  
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<svg class="spinner" viewBox="0 0 50 50" style="width:20px;height:20px;animation:spin 1s linear infinite;margin-right:8px"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"></circle></svg> MEMPROSES...';
  messageDiv.style.display = 'none';
  messageDiv.className = 'message';
  
  try {
    if (GAS_API_URL === 'GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT_ANDA' || !GAS_API_URL.startsWith('http')) {
        throw new Error("PENTING: Konfigurasi sistem belum selesai! Anda harus mengganti variabel GAS_API_URL di baris ke-2 script.js dengan URL hasil deploy backend Google Apps Script.");
    }

    const fileInput = document.getElementById('buktiTrans');
    const file = fileInput.files[0];
    
    if (!file) throw new Error("File Bukti Transfer wajib diunggah.");
    if(file.size > 5 * 1024 * 1024) throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");

    const base64File = await getBase64(file);
    
    const formData = {
      action: 'order',
      nama: document.getElementById('nama').value,
      noWa: document.getElementById('noWa').value,
      divisi: document.getElementById('divisi').value,
      jenisPdh: document.getElementById('jenisPdh').value,
      ukuran: document.getElementById('ukuran').value,
      volume: document.getElementById('volume').value,
      base64File: base64File,
      fileName: file.name,
      mimeType: file.type
    };

    if (formData.jenisPdh === 'Exclusive') {
      const karyaInput = document.getElementById('fileKarya');
      const fileKarya = karyaInput.files[0];
      if (!fileKarya) throw new Error("File Karya/Ajuan wajib diunggah untuk tipe Exclusive.");
      if(fileKarya.size > 5 * 1024 * 1024) throw new Error("Ukuran file karya terlalu besar. Maksimal 5MB.");
      formData.karyaBase64 = await getBase64(fileKarya);
      formData.karyaFileName = fileKarya.name;
      formData.karyaMimeType = fileKarya.type;
    }
    
    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> KIRIM PESANAN';
    
    messageDiv.style.display = 'block';
    if (result.success) {
      messageDiv.classList.add('success');
      messageDiv.textContent = result.message;
      document.getElementById('form-pesanan').reset();
      loadDataPesanan();
    } else {
      messageDiv.classList.add('error');
      messageDiv.textContent = result.message;
    }
  } catch (err) {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> KIRIM PESANAN';
    messageDiv.style.display = 'block';
    messageDiv.classList.add('error');
    messageDiv.textContent = err.message;
  }
});

async function loadDataPesanan() {
  const tbody = document.getElementById('table-body');
  
  if (GAS_API_URL === 'GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT_ANDA' || !GAS_API_URL.startsWith('http')) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center" style="color: var(--warning);">Sistem menunggu konfigurasi URL Backend...</td></tr>';
      return;
  }

  try {
    const response = await fetch(GAS_API_URL);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);

    globalData = data;
    renderTable(globalData);
    if(isAdmin) renderDashboard(globalData);

  } catch (err) {
    document.getElementById('table-body').innerHTML = '<tr><td colspan="9" class="text-center" style="color: var(--danger);">Gagal memuat data dari server.</td></tr>';
    console.error(err);
  }
}

function renderTable(data) {
    const tbody = document.getElementById('table-body');
    const badge = document.getElementById('total-order-badge');
    tbody.innerHTML = ''; 
    
    badge.textContent = `Total Order: ${data.length}`;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding: 20px; color: var(--text-muted);">Belum ada data pesanan.</td></tr>';
      return;
    }
    
    data.forEach((item) => {
      const tr = document.createElement('tr');
      
      let dateStr = item.waktu;
      if(dateStr && dateStr.length > 15) {
         const d = new Date(dateStr);
         if(!isNaN(d)) {
             dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
         }
      }

      let buktiTfCell = item.buktiTf ? `<a href="${item.buktiTf}" target="_blank" class="btn-sm"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> TF</a>` : '-';
      let karyaCell = item.karya ? `<a href="${item.karya}" target="_blank" class="btn-sm"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg> Karya</a>` : '-';

      let bayarCell = '';
      let prosesCell = '';
      let validasiCell = '';
      
      if(isAdmin) {
          bayarCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'bayar', this.value)">
              <option value="Pending" ${item.statusBayar==='Pending'?'selected':''}>Pending</option>
              <option value="DP" ${item.statusBayar==='DP'?'selected':''}>DP</option>
              <option value="Lunas" ${item.statusBayar==='Lunas'?'selected':''}>Lunas</option>
          </select>`;
          prosesCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'proses', this.value)">
              <option value="Pending" ${item.statusProses==='Pending'?'selected':''}>Pending</option>
              <option value="Proses Cetak" ${item.statusProses==='Proses Cetak'?'selected':''}>Proses Cetak</option>
              <option value="Selesai" ${item.statusProses==='Selesai'?'selected':''}>Selesai</option>
          </select>`;
          if (item.jenisPdh === 'Exclusive') {
              validasiCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'validasi', this.value)">
                  <option value="Menunggu" ${item.validasi==='Menunggu'?'selected':''}>Menunggu</option>
                  <option value="Lulus" ${item.validasi==='Lulus'?'selected':''}>Lulus</option>
                  <option value="Ditolak" ${item.validasi==='Ditolak'?'selected':''}>Ditolak</option>
              </select>`;
          } else {
              validasiCell = '-';
          }
      } else {
          let badgeBayar = item.statusBayar.toLowerCase().includes('lunas') ? 'success' : (item.statusBayar.toLowerCase().includes('dp') ? 'primary' : 'warning');
          let badgeProses = item.statusProses.toLowerCase().includes('selesai') ? 'success' : (item.statusProses.toLowerCase().includes('proses') ? 'primary' : 'warning');
          bayarCell = `<span class="badge ${badgeBayar}">${item.statusBayar.toUpperCase()}</span>`;
          prosesCell = `<span class="badge ${badgeProses}">${item.statusProses.toUpperCase()}</span>`;
          
          if (item.jenisPdh === 'Exclusive' && item.validasi) {
              let badgeVal = item.validasi.toLowerCase() === 'lulus' ? 'success' : (item.validasi.toLowerCase() === 'ditolak' ? 'danger' : (item.validasi.toLowerCase() === 'menunggu' ? 'warning' : 'primary'));
              validasiCell = `<span class="badge ${badgeVal}">${item.validasi.toUpperCase()}</span>`;
          } else {
              validasiCell = '-';
          }
      }

      tr.innerHTML = `
        <td>${item.no}</td>
        <td style="font-weight: 600;">${item.nama}</td>
        <td style="color: var(--primary); font-weight: bold;">${item.ukuran}</td>
        <td>${item.divisi || '-'}</td>
        <td>${item.jenisPdh}</td>
        <td>${item.volume} Pcs</td>
        <td>${item.noWa || '-'}</td>
        <td>${buktiTfCell}</td>
        <td>${karyaCell}</td>
        <td>${validasiCell}</td>
        <td>${bayarCell}</td>
        <td>${prosesCell}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderDashboard(data) {
    let lunas = 0, dp = 0, pending = 0, proses = 0, selesai = 0;
    let dist = { S: {std:0, exc:0}, M: {std:0, exc:0}, L: {std:0, exc:0}, XL: {std:0, exc:0}, XXL: {std:0, exc:0} };

    data.forEach(item => {
        let vol = parseInt(item.volume) || 1;
        if(item.statusBayar.toLowerCase().includes('lunas')) lunas += vol;
        else if(item.statusBayar.toLowerCase().includes('dp')) dp += vol;
        else pending += vol;

        if(item.statusProses.toLowerCase().includes('selesai')) selesai += vol;
        else if(item.statusProses.toLowerCase().includes('proses')) proses += vol;
        
        let uk = item.ukuran.toUpperCase();
        if(uk === '2XL') uk = 'XXL'; // Just in case old data has 2XL
        let typePdh = item.jenisPdh.toLowerCase().includes('standard') ? 'std' : 'exc';
        if(dist[uk]) {
            dist[uk][typePdh] += vol;
        }
    });

    document.getElementById('stat-lunas').textContent = lunas;
    document.getElementById('stat-dp').textContent = dp;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-proses').textContent = proses;
    document.getElementById('stat-selesai').textContent = selesai;

    const distGrid = document.getElementById('dist-grid');
    distGrid.innerHTML = '';
    const ukurans = ['S','M','L','XL','XXL'];
    ukurans.forEach(uk => {
       const std = dist[uk].std;
       const exc = dist[uk].exc;
       const total = std + exc;
       
       const distItem = document.createElement('div');
       distItem.className = 'dist-item';
       distItem.innerHTML = `
          <div class="dist-size">${uk}</div>
          <div class="dist-bar-container" style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; margin: 5px 0;">
             <div style="width: ${total > 0 ? (std/total)*100 : 0}%; background: #3b82f6;"></div>
             <div style="width: ${total > 0 ? (exc/total)*100 : 0}%; background: #a855f7;"></div>
          </div>
          <div class="dist-details" style="font-size: 11px; color: var(--text-muted); display:flex; gap:5px;">
             <span style="color:#3b82f6;">STD: ${std}</span> | 
             <span style="color:#a855f7;">EXC: ${exc}</span>
          </div>
       `;
       distGrid.appendChild(distItem);
    });
}

window.updateStatus = async function(rowId, type, value) {
    if(!isAdmin) return;
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'text/plain;charset=utf-8'},
            body: JSON.stringify({
                action: 'update_status',
                password: document.getElementById('admin-password').value,
                rowId: rowId,
                type: type,
                value: value
            })
        });
        const result = await response.json();
        if(result.success) {
            globalData = globalData.map(item => {
                if(item.rowId === rowId) {
                    if(type === 'bayar') item.statusBayar = value;
                    if(type === 'proses') item.statusProses = value;
                }
                return item;
            });
            renderDashboard(globalData);
        } else {
            alert('Gagal update: ' + result.message);
            loadDataPesanan(); 
        }
    } catch(e) {
        alert('Terjadi kesalahan saat update.');
    }
}

// Admin Modal Logic
const loginModal = document.getElementById('login-modal');
const btnShowLogin = document.getElementById('logo-btn');
const closeModal = document.getElementById('close-modal');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const togglePassword = document.getElementById('toggle-password');
const adminPassword = document.getElementById('admin-password');
const eyeIconShow = document.getElementById('eye-icon-show');
const eyeIconHide = document.getElementById('eye-icon-hide');

togglePassword.addEventListener('click', () => {
    if (adminPassword.type === 'password') {
        adminPassword.type = 'text';
        eyeIconShow.style.display = 'none';
        eyeIconHide.style.display = 'block';
    } else {
        adminPassword.type = 'password';
        eyeIconShow.style.display = 'block';
        eyeIconHide.style.display = 'none';
    }
});

btnShowLogin.addEventListener('click', () => loginModal.classList.add('show'));
closeModal.addEventListener('click', () => {
    loginModal.classList.remove('show');
    document.getElementById('login-message').style.display = 'none';
});

btnLogin.addEventListener('click', async () => {
    const pwd = document.getElementById('admin-password').value;
    const msg = document.getElementById('login-message');
    if(!pwd) return;
    
    msg.style.display = 'block';
    msg.className = 'message';
    msg.textContent = 'Memeriksa sandi...';
    btnLogin.disabled = true;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'text/plain;charset=utf-8'},
            body: JSON.stringify({ action: 'login', password: pwd })
        });
        const result = await response.json();
        btnLogin.disabled = false;
        
        if(result.success) {
            isAdmin = true;
            loginModal.classList.remove('show');
            msg.style.display = 'none';
            document.getElementById('admin-badge').style.display = 'inline-block';
            document.getElementById('admin-dashboard').style.display = 'block';
            document.getElementById('btn-logout').style.display = 'inline-block';
            document.querySelector('.form-card').style.display = 'none'; 
            renderTable(globalData);
            renderDashboard(globalData);
        } else {
            msg.classList.add('error');
            msg.textContent = result.message || 'Login gagal';
        }
    } catch(err) {
        btnLogin.disabled = false;
        msg.classList.add('error');
        msg.textContent = 'Gagal menghubungi server.';
    }
});

btnLogout.addEventListener('click', () => {
    isAdmin = false;
    document.getElementById('admin-badge').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'none';
    document.querySelector('.form-card').style.display = 'block';
    document.getElementById('admin-password').value = '';
    renderTable(globalData);
});

window.addEventListener('DOMContentLoaded', () => {
  loadDataPesanan();
});
