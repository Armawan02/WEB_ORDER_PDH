// Konstanta ID Spreadsheet untuk menyimpan data pesanan
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_ANDA';
const ADMIN_PASSWORD = 'admin'; // Password default, bisa diganti

/**
 * Menangani request GET dari Frontend (menampilkan tabel data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pemesanan');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      result.push({
        rowId: i + 1, // Baris di Google Sheet dimulai dari 1 (header di baris 1, data mulai baris 2)
        no: i,
        nama: row[0],
        ukuran: row[1],
        jenisPdh: row[3],
        volume: row[4],
        buktiTf: row[5],
        statusBayar: row[6],
        statusProses: row[7],
        waktu: row[9]
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify(result.reverse()))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menangani request POST dari Frontend (mengirim data pesanan, login admin, dan update)
 */
function doPost(e) {
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch(err) {
       return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Format data JSON tidak valid' }))
         .setMimeType(ContentService.MimeType.JSON);
    }

    // --- LOGIC LOGIN ADMIN ---
    if (data.action === 'login') {
      if (data.password === ADMIN_PASSWORD) {
         return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Login berhasil' })).setMimeType(ContentService.MimeType.JSON);
      } else {
         return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Password salah' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- LOGIC UPDATE STATUS ---
    if (data.action === 'update_status') {
       if (data.password !== ADMIN_PASSWORD) {
          return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Tidak memiliki izin' })).setMimeType(ContentService.MimeType.JSON);
       }
       const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
       const sheet = ss.getSheetByName('Pemesanan');
       
       if (data.type === 'bayar') {
          // Kolom ke-7 adalah Status Bayar (G)
          sheet.getRange(data.rowId, 7).setValue(data.value);
       } else if (data.type === 'proses') {
          // Kolom ke-8 adalah Status Proses (H)
          sheet.getRange(data.rowId, 8).setValue(data.value);
       }
       return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Status berhasil diperbarui' })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- LOGIC ORDER BARU (DEFAULT) ---
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pemesanan') || ss.insertSheet('Pemesanan');
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Nama', 'Ukuran', 'Divisi', 'Jenis PDH', 'volume', 'Bukti Trans', 'Status Bayar', 'Status Proses', 'Nomor WhatsApp', 'Waktu Pemesanan']);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#e0e0e0');
    }
    
    let fileUrl = '';
    if (data.base64File) {
      const splitBase = data.base64File.split(',');
      const base64Data = splitBase[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mimeType, data.fileName);
      
      const folderName = "Bukti Transfer PDH";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }
    
    const rowData = [
      data.nama,
      data.ukuran,
      data.divisi,
      data.jenisPdh,
      data.volume,
      fileUrl,
      'Pending', 
      'Proses',  
      "'" + data.noWa, 
      new Date() 
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Pesanan berhasil dikirim!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Terjadi kesalahan sistem: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
