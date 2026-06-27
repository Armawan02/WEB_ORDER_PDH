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

function checkExclusive() {
    const items = document.querySelectorAll('.pesanan-item');
    items.forEach(item => {
        const select = item.querySelector('.jenisPdh-input');
        const karyaGroup = item.querySelector('.karya-group-local');
        const fileKarya = item.querySelector('.fileKarya-local');
        
        if (select.value === 'Exclusive') {
            karyaGroup.style.display = 'block';
            fileKarya.required = true;
        } else {
            karyaGroup.style.display = 'none';
            fileKarya.required = false;
        }
    });
}

document.getElementById('pesanan-container').addEventListener('change', function(e) {
    if (e.target.classList.contains('jenisPdh-input')) {
        checkExclusive();
    }
});

document.getElementById('btn-tambah-pesanan').addEventListener('click', function() {
    const container = document.getElementById('pesanan-container');
    const firstItem = container.querySelector('.pesanan-item');
    const newItem = firstItem.cloneNode(true);
    
    // Reset values
    newItem.querySelector('.jenisPdh-input').value = '';
    newItem.querySelector('.ukuran-input').value = '';
    newItem.querySelector('.volume-input').value = '1';
    newItem.querySelector('.karya-group-local').style.display = 'none';
    newItem.querySelector('.fileKarya-local').value = '';
    newItem.querySelector('.fileKarya-local').required = false;
    
    // Add delete button
    if (!newItem.querySelector('.btn-hapus-pesanan')) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-hapus-pesanan';
        delBtn.style.cssText = 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px dashed rgba(239, 68, 68, 0.5); width: 100%; padding: 8px; border-radius: 8px; margin-top: 10px; cursor: pointer; transition: all 0.3s ease;';
        delBtn.textContent = 'Hapus Pesanan Ini';
        delBtn.onclick = function() {
            newItem.remove();
            checkExclusive();
        };
        newItem.appendChild(delBtn);
    } else {
        newItem.querySelector('.btn-hapus-pesanan').onclick = function() {
            newItem.remove();
            checkExclusive();
        };
    }
    
    container.appendChild(newItem);
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
      items: [],
      base64File: base64File,
      fileName: file.name,
      mimeType: file.type
    };

    const pesananItems = document.querySelectorAll('.pesanan-item');
    for (let item of pesananItems) {
       const jp = item.querySelector('.jenisPdh-input').value;
       const uk = item.querySelector('.ukuran-input').value;
       const vol = item.querySelector('.volume-input').value;
       
       let itemData = {
           jenisPdh: jp,
           ukuran: uk,
           volume: vol
       };
       
       if (jp === 'Exclusive') {
           const karyaInput = item.querySelector('.fileKarya-local');
           const fileKarya = karyaInput.files[0];
           if (!fileKarya) throw new Error("Dokumen Pendukung wajib diunggah untuk tipe Exclusive.");
           if (fileKarya.size > 5 * 1024 * 1024) throw new Error("Ukuran file dokumen terlalu besar. Maksimal 5MB.");
           
           itemData.karyaBase64 = await getBase64(fileKarya);
           itemData.karyaFileName = fileKarya.name;
           itemData.karyaMimeType = fileKarya.type;
       }
       
       formData.items.push(itemData);
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

let globalData = [];
let currentPassword = '';

let countdownInterval;
let serverConfig = { isOpen: 'auto', openTime: '', closeTime: '' };

async function updateAdminConfigUI() {
    if (!isAdmin) return;
    if (serverConfig.openTime) {
        document.getElementById('config-open').value = serverConfig.openTime.substring(0, 16);
    }
    if (serverConfig.closeTime) {
        document.getElementById('config-close').value = serverConfig.closeTime.substring(0, 16);
    }
    const statusText = document.getElementById('current-schedule-status');
    if (serverConfig.isOpen === 'true') {
        statusText.innerHTML = '<span style="color:#10b981;">BUKA PAKSA</span>';
    } else if (serverConfig.isOpen === 'false') {
        statusText.innerHTML = '<span style="color:#ef4444;">TUTUP PAKSA</span>';
    } else {
        statusText.innerHTML = '<span style="color:#3b82f6;">JADWAL OTOMATIS</span>';
    }
}

function startCountdown() {
    clearInterval(countdownInterval);
    const banner = document.getElementById('countdown-banner');
    const formContainer = document.getElementById('form-container-wrapper');

    countdownInterval = setInterval(() => {
        let isCurrentlyOpen = false;
        let timeRemaining = 0;
        let countdownType = '';

        if (serverConfig.isOpen === 'true') {
            isCurrentlyOpen = true;
        } else if (serverConfig.isOpen === 'false') {
            isCurrentlyOpen = false;
        } else {
            const now = new Date().getTime();
            const openTimeMs = serverConfig.openTime ? new Date(serverConfig.openTime).getTime() : 0;
            const closeTimeMs = serverConfig.closeTime ? new Date(serverConfig.closeTime).getTime() : Infinity;

            if (now >= openTimeMs && now <= closeTimeMs) {
                isCurrentlyOpen = true;
                if (closeTimeMs !== Infinity) {
                    timeRemaining = closeTimeMs - now;
                    countdownType = 'tutup';
                }
            } else if (now < openTimeMs) {
                timeRemaining = openTimeMs - now;
                countdownType = 'buka';
            }
        }

        if (!isCurrentlyOpen) {
            banner.style.display = 'block';
            banner.style.background = 'rgba(239, 68, 68, 0.1)';
            banner.style.color = '#ef4444';
            banner.style.border = '1px dashed rgba(239, 68, 68, 0.3)';
            formContainer.style.display = 'none';
            
            if (countdownType === 'buka') {
                banner.innerHTML = `Pemesanan akan dibuka dalam: <strong>${formatDuration(timeRemaining)}</strong>`;
            } else {
                banner.innerHTML = `Pemesanan saat ini sedang <strong>DITUTUP</strong>`;
            }
        } else {
            formContainer.style.display = 'block';
            if (countdownType === 'tutup') {
                banner.style.display = 'block';
                banner.style.background = 'rgba(16, 185, 129, 0.1)';
                banner.style.color = '#10b981';
                banner.style.border = '1px dashed rgba(16, 185, 129, 0.3)';
                banner.innerHTML = `Pemesanan ditutup dalam: <strong>${formatDuration(timeRemaining)}</strong>`;
            } else {
                banner.style.display = 'none';
            }
        }
    }, 1000);
}

function formatDuration(ms) {
    if (ms <= 0) return '00:00:00';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    let str = '';
    if (days > 0) str += `${days} Hari `;
    str += `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return str;
}

async function sendConfigUpdate(isOpen) {
    const openLocal = document.getElementById('config-open').value;
    const closeLocal = document.getElementById('config-close').value;
    
    const openISO = openLocal ? openLocal + ':00+08:00' : '';
    const closeISO = closeLocal ? closeLocal + ':00+08:00' : '';

    const btn = document.getElementById('btn-save-schedule');
    const oldBtnText = btn.textContent;
    btn.textContent = 'Menyimpan...';

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'update_config',
                password: currentPassword,
                config: {
                    isOpen: isOpen,
                    openTime: openISO,
                    closeTime: closeISO
                }
            })
        });
        const res = await response.json();
        if (res.success) {
            alert(res.message);
            loadDataPesanan();
        } else {
            alert('Gagal: ' + res.message);
        }
    } catch (err) {
        alert('Terjadi kesalahan: ' + err.message);
    }
    btn.textContent = oldBtnText;
}

if (document.getElementById('btn-save-schedule')) {
    document.getElementById('btn-save-schedule').addEventListener('click', () => sendConfigUpdate('auto'));
}
if (document.getElementById('btn-force-open')) {
    document.getElementById('btn-force-open').addEventListener('click', () => {
        if(confirm('Yakin ingin membuka pesanan sekarang juga (Buka Paksa)?')) sendConfigUpdate('true');
    });
}
if (document.getElementById('btn-force-close')) {
    document.getElementById('btn-force-close').addEventListener('click', () => {
        if(confirm('Yakin ingin menutup pesanan sekarang juga (Tutup Paksa)?')) sendConfigUpdate('false');
    });
}

async function loadDataPesanan() {
  const tbody = document.getElementById('table-body');
  
  if (GAS_API_URL === 'GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT_ANDA' || !GAS_API_URL.startsWith('http')) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center" style="color: var(--warning);">Sistem menunggu konfigurasi URL Backend...</td></tr>';
      return;
  }

  try {
    const response = await fetch(GAS_API_URL);
    const rawData = await response.json();
    
    if (rawData.error) throw new Error(rawData.error);

    let data;
    if (Array.isArray(rawData)) {
        data = rawData;
    } else {
        data = rawData.data;
        serverConfig = rawData.config;
        updateAdminConfigUI();
        startCountdown();
    }

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

      let vols = String(item.volume).split(',').map(s => parseInt(s.trim()) || 1);
      let jenisPdhs = String(item.jenisPdh).split(',').map(s => s.trim().toLowerCase());
      
      let calcNominal = 0;
      let pendingNominal = 0;

      for (let i = 0; i < vols.length; i++) {
          let v = vols[i];
          let typePdh = (jenisPdhs[i] || '');
          let val = (item.validasi || '').toLowerCase();
          
          if (typePdh.includes('exclusive')) {
              if (val === 'disetujui' || val === 'lulus') {
                  calcNominal += v * 155000;
              } else if (val === 'tidak disetujui' || val === 'ditolak') {
                  // Ditolak = 0
              } else {
                  pendingNominal += v * 155000;
              }
          } else {
              calcNominal += v * 155000;
          }
      }

      let nominalStr = `Rp ${calcNominal.toLocaleString('id-ID')}`;
      if (pendingNominal > 0) {
          nominalStr += `<br><span style="font-size:11px; color:#f59e0b; font-weight:normal;">(+Rp ${pendingNominal.toLocaleString('id-ID')} Menunggu Validasi)</span>`;
      }

      let buktiTfCell = item.buktiTf ? `<button type="button" onclick="openImageModal('${item.buktiTf}')" class="btn-sm" style="background: none; border: 1px solid var(--border); color: var(--text); padding: 4px 8px; cursor: pointer; border-radius: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> TF</button>` : '-';
      
      let karyaCell = '-';
      if (item.karya) {
          let urls = item.karya.split(',').map(s => s.trim()).filter(s => s);
          if (urls.length > 0) {
              karyaCell = urls.map((u, idx) => `<button type="button" onclick="openImageModal('${u}')" class="btn-sm" style="background: none; border: 1px solid var(--border); color: var(--text); padding: 4px 8px; cursor: pointer; border-radius: 4px; margin: 2px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg> Dokumen ${urls.length > 1 ? idx+1 : ''}</button>`).join(' ');
          }
      }

      let bayarCell = '';
      let prosesCell = '';
      let validasiCell = '';
      
      let sp = item.statusProses;
      if (sp === 'Proses') sp = 'Pending'; // fallback for old data

      if(isAdmin) {
          bayarCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'bayar', this.value)">
              <option value="Pending" ${item.statusBayar==='Pending'?'selected':''}>Pending</option>
              <option value="DP" ${item.statusBayar==='DP'?'selected':''}>DP</option>
              <option value="Lunas" ${item.statusBayar==='Lunas'?'selected':''}>Lunas</option>
          </select>`;
          prosesCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'proses', this.value)">
              <option value="Pending" ${sp==='Pending'?'selected':''}>Pending</option>
              <option value="Proses Cetak" ${sp==='Proses Cetak'?'selected':''}>Proses Cetak</option>
              <option value="Selesai" ${sp==='Selesai'?'selected':''}>Selesai</option>
          </select>`;
          if (item.jenisPdh.includes('Exclusive')) {
              let val = item.validasi;
              if (val === 'Lulus') val = 'Disetujui';
              if (val === 'Ditolak') val = 'Tidak Disetujui';
              
              validasiCell = `<select class="admin-select" onchange="updateStatus(${item.rowId}, 'validasi', this.value)">
                  <option value="Menunggu" ${val==='Menunggu'?'selected':''}>Menunggu</option>
                  <option value="Disetujui" ${val==='Disetujui'?'selected':''}>Disetujui</option>
                  <option value="Tidak Disetujui" ${val==='Tidak Disetujui'?'selected':''}>Tidak Disetujui</option>
              </select>`;
          } else {
              validasiCell = '-';
          }
      } else {
          let badgeBayar = item.statusBayar.toLowerCase().includes('lunas') ? 'success' : (item.statusBayar.toLowerCase().includes('dp') ? 'primary' : 'warning');
          let badgeProses = sp.toLowerCase().includes('selesai') ? 'success' : (sp.toLowerCase().includes('cetak') ? 'primary' : 'warning');
          bayarCell = `<span class="badge ${badgeBayar}">${item.statusBayar.toUpperCase()}</span>`;
          prosesCell = `<span class="badge ${badgeProses}">${sp.toUpperCase()}</span>`;
          
          if (item.jenisPdh.includes('Exclusive') && item.validasi) {
              let val = item.validasi;
              if (val === 'Lulus') val = 'Disetujui';
              if (val === 'Ditolak') val = 'Tidak Disetujui';
              
              let badgeVal = val.toLowerCase() === 'disetujui' ? 'success' : (val.toLowerCase() === 'tidak disetujui' ? 'danger' : (val.toLowerCase() === 'menunggu' ? 'warning' : 'primary'));
              validasiCell = `<span class="badge ${badgeVal}">${val.toUpperCase()}</span>`;
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
        <td style="color: #ef4444; font-weight: bold;">${nominalStr}</td>
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
    let totalOmset = 0;
    let dist = { S: {std:0, exc:0}, M: {std:0, exc:0}, L: {std:0, exc:0}, XL: {std:0, exc:0}, XXL: {std:0, exc:0} };

    data.forEach(item => {
        let vols = String(item.volume).split(',').map(s => parseInt(s.trim()) || 1);
        let ukurans = String(item.ukuran).split(',').map(s => s.trim().toUpperCase());
        let jenisPdhs = String(item.jenisPdh).split(',').map(s => s.trim().toLowerCase());

        let calcNominal = 0;
        let totalVol = vols.reduce((a, b) => a + b, 0);
        
        for (let i = 0; i < vols.length; i++) {
            let v = vols[i];
            let typePdh = (jenisPdhs[i] || '');
            let val = (item.validasi || '').toLowerCase();
            
            if (typePdh.includes('exclusive')) {
                if (val === 'disetujui' || val === 'lulus') {
                    calcNominal += v * 155000;
                }
            } else {
                calcNominal += v * 155000;
            }
        }
        
        totalOmset += calcNominal;

        if(item.statusBayar.toLowerCase().includes('lunas')) lunas += totalVol;
        else if(item.statusBayar.toLowerCase().includes('dp')) dp += totalVol;
        else pending += totalVol;

        if(item.statusProses.toLowerCase().includes('selesai')) selesai += totalVol;
        else if(item.statusProses.toLowerCase().includes('proses')) proses += totalVol;
        
        for (let i = 0; i < ukurans.length; i++) {
            let uk = ukurans[i];
            if(uk === '2XL') uk = 'XXL';
            let typePdh = (jenisPdhs[i] || '').includes('standard') ? 'std' : 'exc';
            let vol = vols[i] || 1;
            if(dist[uk]) {
                dist[uk][typePdh] += vol;
            }
        }
    });

    document.getElementById('stat-lunas').textContent = lunas;
    document.getElementById('stat-dp').textContent = dp;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-proses').textContent = proses;
    document.getElementById('stat-selesai').textContent = selesai;
    
    const nominalElem = document.getElementById('stat-nominal');
    if (nominalElem) nominalElem.textContent = 'Rp ' + totalOmset.toLocaleString('id-ID');

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

// Status updates for Admin
window.updateStatus = async function(rowId, type, value) {
    if (!confirm(`Yakin ingin mengubah status menjadi ${value}?`)) {
        loadDataPesanan();
        return;
    }
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
                    if(type === 'validasi') item.validasi = value;
                }
                return item;
            });
            renderDashboard(globalData);
            alert('Status berhasil diperbarui!');
            loadDataPesanan();
        } else {
            alert('Gagal update: ' + result.message);
            loadDataPesanan(); 
        }
    } catch(e) {
        alert('Terjadi kesalahan saat update.');
    }
}

// Modal Handler (Universal for Image & PDF)
window.openImageModal = function(url) {
    if(!url) return;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if(match && match[1]) {
        const fileId = match[1];
        const iframeUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        const modal = document.getElementById('image-modal');
        const modalIframe = document.getElementById('modal-iframe');
        
        modalIframe.src = iframeUrl;
        modal.style.display = 'flex';
    } else {
        window.open(url, '_blank');
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
            currentPassword = pwd;
            loginModal.classList.remove('show');
            msg.style.display = 'none';
            document.getElementById('admin-badge').style.display = 'inline-block';
            document.getElementById('admin-dashboard').style.display = 'block';
            document.getElementById('btn-logout').style.display = 'inline-block';
            document.querySelector('.form-card').style.display = 'none'; 
            renderTable(globalData);
            renderDashboard(globalData);
            updateAdminConfigUI();
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
