// PENTING: Ganti string ini dengan URL Web App (Deployment) dari Google Apps Script Anda!
const GAS_API_URL = 'GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT_ANDA';

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
        throw new Error("PENTING: Konfigurasi sistem belum selesai! Anda harus mengganti variabel GAS_API_URL di script.js dengan URL hasil deploy backend Google Apps Script.");
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
      tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color: var(--warning);">Sistem menunggu konfigurasi URL Backend...</td></tr>';
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

      let buktiTfCell = item.buktiTf ? `<a href="${item.buktiTf}" target="_blank" class="btn-sm"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Cek TF</a>` : '-';

      let bayarCell = '';
      let prosesCell = '';
      
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
      } else {
          let badgeBayar = item.statusBayar.toLowerCase().includes('lunas') ? 'success' : (item.statusBayar.toLowerCase().includes('dp') ? 'primary' : 'warning');
          let badgeProses = item.statusProses.toLowerCase().includes('selesai') ? 'success' : (item.statusProses.toLowerCase().includes('proses') ? 'primary' : 'warning');
          bayarCell = `<span class="badge ${badgeBayar}">${item.statusBayar.toUpperCase()}</span>`;
          prosesCell = `<span class="badge ${badgeProses}">${item.statusProses.toUpperCase()}</span>`;
      }

      tr.innerHTML = `
        <td>${item.no}</td>
        <td style="font-weight: 600;">${item.nama}</td>
        <td style="color: var(--primary); font-weight: bold;">${item.ukuran}</td>
        <td>${item.jenisPdh}</td>
        <td>${item.volume} Pcs</td>
        <td>${buktiTfCell}</td>
        <td>${bayarCell}</td>
        <td>${prosesCell}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderDashboard(data) {
    let lunas = 0, dp = 0, pending = 0, proses = 0, selesai = 0;
    let dist = { S: {pdk:0, pjg:0}, M: {pdk:0, pjg:0}, L: {pdk:0, pjg:0}, XL: {pdk:0, pjg:0}, XXL: {pdk:0, pjg:0} };

    data.forEach(item => {
        let vol = parseInt(item.volume) || 1;
        if(item.statusBayar.toLowerCase().includes('lunas')) lunas += vol;
        else if(item.statusBayar.toLowerCase().includes('dp')) dp += vol;
        else pending += vol;

        if(item.statusProses.toLowerCase().includes('selesai')) selesai += vol;
        else if(item.statusProses.toLowerCase().includes('proses')) proses += vol;
        
        let uk = item.ukuran.toUpperCase();
        if(uk === '2XL') uk = 'XXL'; // Just in case old data has 2XL
        let lgn = item.jenisPdh.toLowerCase().includes('pendek') ? 'pdk' : 'pjg';
        if(dist[uk]) {
            dist[uk][lgn] += vol;
        }
    });

    document.getElementById('stat-lunas').textContent = lunas;
    document.getElementById('stat-dp').textContent = dp;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-proses').textContent = proses;
    document.getElementById('stat-selesai').textContent = selesai;

    let distHtml = '';
    for(let uk in dist) {
        let total = dist[uk].pdk + dist[uk].pjg;
        distHtml += `
        <div class="dist-item">
           <div class="dist-size">${uk}: ${total}</div>
           <div class="dist-detail">${dist[uk].pdk} Pdk | ${dist[uk].pjg} Pjg</div>
        </div>`;
    }
    document.getElementById('dist-grid').innerHTML = distHtml;
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
            msg.textContent = 'Password salah!';
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
