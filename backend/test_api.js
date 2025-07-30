import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const loginUrl = process.env.CENTRAL_API_LOGIN_URL;
const username = process.env.CENTRAL_API_USER;
const password = process.env.CENTRAL_API_PASS;

async function testApiLogin() {
  console.log('--- Memulai Tes Login ke API Pusat ---');
  if (!loginUrl || !username || !password) {
    console.error('[GAGAL] Harap pastikan CENTRAL_API_LOGIN_URL, CENTRAL_API_USER, dan CENTRAL_API_PASS sudah diatur di file .env Anda.');
    return;
  }

  console.log(`Mencoba login sebagai "${username}" ke URL: ${loginUrl}`);

  try {
    const requestBody = {
      st: 'login',
      data: {
        username: username,
        password: password
      }
    };

    const response = await axios.post(loginUrl, requestBody);

    if (response.status >= 200 && response.status < 300) {
      console.log('\n[BERHASIL!] Login sukses.');
      console.log('Status Respons:', response.status);
      console.log('Data yang Diterima:');
      console.log(response.data);
    } else {
      console.error(`\n[GAGAL] Server merespons dengan status: ${response.status}`);
      console.log('Data Respons:', response.data);
    }

  } catch (error) {
    console.error('\n--- TES GAGAL ---');
    if (error.response) {
      console.error(`Server merespons dengan error: ${error.response.status}`);
      console.error('Detail Error:', error.response.data);
    } else if (error.request) {
      console.error('Tidak ada respons dari server. Pastikan URL benar dan Anda terhubung ke VPN (GlobalProtect).');
    } else {
      console.error('Terjadi error saat mengirim permintaan:', error.message);
    }
  } finally {
    console.log('\n--- Tes Selesai ---');
  }
}

testApiLogin();
