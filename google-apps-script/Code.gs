/**
 * 🎵 SonicVault - Google Apps Script Backend (Database & Google Drive Storage)
 * 
 * CARA PAKAI:
 * 1. Buka https://script.google.com/ lalu klik "New Project".
 * 2. Hapus semua kode yang ada, lalu Paste seluruh isi file ini.
 * 3. Klik tombol "Deploy" (di kanan atas) -> "New deployment".
 * 4. Pilih icon Gear ⚙️ -> "Web app".
 * 5. Set:
 *    - Description: "SonicVault Backend"
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 6. Klik "Deploy" dan Berikan izin akses (Authorize access).
 * 7. Copy "Web App URL" (berakhiran /exec) dan paste ke pengaturan SonicVault di aplikasi.
 */

const FOLDER_NAME = 'SonicVault Music';
const SHEET_NAME = 'SonicVault_Database';

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_NAME);
}

function getOrCreateSheet() {
  const files = DriveApp.getFilesByName(SHEET_NAME);
  let ss;
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    const songsSheet = ss.getActiveSheet();
    songsSheet.setName('Songs');
    songsSheet.appendRow(['id', 'title', 'artist', 'album', 'duration', 'fileSize', 'driveFileId', 'coverArt', 'favorite', 'playCount', 'dateAdded']);
    
    const playlistsSheet = ss.insertSheet('Playlists');
    playlistsSheet.appendRow(['id', 'name', 'songIdsJson', 'createdAt']);
  }
  return ss;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    const ss = getOrCreateSheet();

    if (action === 'ping') {
      return createJsonResponse({ status: 'ok', message: 'SonicVault Google Apps Script Backend Active!' });
    }

    if (action === 'getSongs') {
      const sheet = ss.getSheetByName('Songs');
      const data = sheet.getDataRange().getValues();
      const songs = [];
      
      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        
        const driveFileId = row[6];
        // Generate direct streaming URL from Google Drive
        const streamUrl = 'https://docs.google.com/uc?export=download&id=' + driveFileId;

        songs.push({
          id: String(row[0]),
          title: String(row[1] || 'Unknown Title'),
          artist: String(row[2] || 'Unknown Artist'),
          album: String(row[3] || 'SonicVault'),
          duration: Number(row[4]) || 0,
          fileSize: Number(row[5]) || 0,
          driveFileId: String(driveFileId),
          streamUrl: streamUrl,
          coverArt: String(row[7] || ''),
          favorite: Boolean(row[8]),
          playCount: Number(row[9]) || 0,
          dateAdded: Number(row[10]) || Date.now(),
        });
      }
      
      return createJsonResponse({ status: 'success', songs: songs });
    }

    if (action === 'getPlaylists') {
      const sheet = ss.getSheetByName('Playlists');
      const data = sheet.getDataRange().getValues();
      const playlists = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        let songIds = [];
        try {
          songIds = JSON.parse(row[2] || '[]');
        } catch (err) {}

        playlists.push({
          id: String(row[0]),
          name: String(row[1] || 'Playlist'),
          songIds: songIds,
          createdAt: Number(row[3]) || Date.now(),
        });
      }

      return createJsonResponse({ status: 'success', playlists: playlists });
    }

    return createJsonResponse({ status: 'error', message: 'Action not found' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action;
    const ss = getOrCreateSheet();

    // 1. Upload Song File & Metadata
    if (action === 'uploadSong') {
      const folder = getOrCreateFolder();
      const base64Data = payload.base64Data; // data:[<mediatype>];base64,<data>
      const filename = payload.filename || (payload.title + '.mp3');
      const mimeType = payload.mimeType || 'audio/mpeg';

      // Clean base64 header if present
      const rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const decodedBytes = Utilities.base64Decode(rawBase64);
      const blob = Utilities.newBlob(decodedBytes, mimeType, filename);
      
      // Create file in Drive folder
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileId = file.getId();
      const songId = payload.id || ('song_' + Date.now());
      const coverArt = payload.coverArt || '';

      // Save row to Sheets
      const sheet = ss.getSheetByName('Songs');
      sheet.appendRow([
        songId,
        payload.title || 'Unknown Title',
        payload.artist || 'Unknown Artist',
        payload.album || 'SonicVault',
        Number(payload.duration) || 0,
        Number(payload.fileSize) || decodedBytes.length,
        fileId,
        coverArt,
        false, // favorite
        0,     // playCount
        Date.now()
      ]);

      const streamUrl = 'https://docs.google.com/uc?export=download&id=' + fileId;

      return createJsonResponse({
        status: 'success',
        song: {
          id: songId,
          title: payload.title,
          artist: payload.artist,
          album: payload.album,
          duration: payload.duration,
          fileSize: decodedBytes.length,
          driveFileId: fileId,
          streamUrl: streamUrl,
          coverArt: coverArt,
          favorite: false,
          playCount: 0,
          dateAdded: Date.now()
        }
      });
    }

    // 2. Delete Song from Drive & Sheets
    if (action === 'deleteSong') {
      const songId = payload.songId;
      const sheet = ss.getSheetByName('Songs');
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(songId)) {
          const driveFileId = data[i][6];
          if (driveFileId) {
            try {
              DriveApp.getFileById(driveFileId).setTrashed(true);
            } catch (err) {}
          }
          sheet.deleteRow(i + 1);
          break;
        }
      }

      return createJsonResponse({ status: 'success', deletedId: songId });
    }

    // 3. Toggle Favorite
    if (action === 'toggleFavorite') {
      const songId = payload.songId;
      const sheet = ss.getSheetByName('Songs');
      const data = sheet.getDataRange().getValues();
      let newFav = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(songId)) {
          const currentFav = Boolean(data[i][8]);
          newFav = !currentFav;
          sheet.getRange(i + 1, 9).setValue(newFav);
          break;
        }
      }

      return createJsonResponse({ status: 'success', isFavorite: newFav });
    }

    // 4. Save Playlist
    if (action === 'savePlaylist') {
      const pl = payload.playlist;
      const sheet = ss.getSheetByName('Playlists');
      const data = sheet.getDataRange().getValues();
      let updated = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(pl.id)) {
          sheet.getRange(i + 1, 2).setValue(pl.name);
          sheet.getRange(i + 1, 3).setValue(JSON.stringify(pl.songIds || []));
          updated = true;
          break;
        }
      }

      if (!updated) {
        sheet.appendRow([pl.id, pl.name, JSON.stringify(pl.songIds || []), Date.now()]);
      }

      return createJsonResponse({ status: 'success', playlist: pl });
    }

    // 5. Delete Playlist
    if (action === 'deletePlaylist') {
      const playlistId = payload.playlistId;
      const sheet = ss.getSheetByName('Playlists');
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(playlistId)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }

      return createJsonResponse({ status: 'success', deletedId: playlistId });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown post action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}
