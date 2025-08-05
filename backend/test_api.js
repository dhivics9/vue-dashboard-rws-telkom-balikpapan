import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const loginUrl = process.env.CENTRAL_API_LOGIN_URL;
const username = process.env.CENTRAL_API_USER;
const password = process.env.CENTRAL_API_PASS;
const revenueUrl = process.env.CENTRAL_API_REVENUE_URL;
const ncxUrl = process.env.CENTRAL_API_NCX_URL;
const salesUrl = process.env.CENTRAL_API_SALES_URL;

let sessionToken = null;

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
      console.log(JSON.stringify(response.data, null, 2));
      
      // Extract token dari response
      if (response.data && response.data.t) {
        sessionToken = response.data.t;
        console.log('\n✅ Token berhasil diekstrak:', sessionToken.substring(0, 20) + '...');
        
        // Test semua API endpoints
        await testAllEndpoints();
      } else {
        console.error('❌ Token tidak ditemukan dalam response');
      }
    } else {
      console.error(`\n[GAGAL] Server merespons dengan status: ${response.status}`);
      console.log('Data Respons:', response.data);
    }

  } catch (error) {
    console.error('\n--- TES LOGIN GAGAL ---');
    if (error.response) {
      console.error(`Server merespons dengan error: ${error.response.status}`);
      console.error('Detail Error:', error.response.data);
    } else if (error.request) {
      console.error('Tidak ada respons dari server. Pastikan URL benar dan Anda terhubung ke VPN (GlobalProtect).');
    } else {
      console.error('Terjadi error saat mengirim permintaan:', error.message);
    }
  }
}

async function testAllEndpoints() {
  console.log('\n='.repeat(80));
  console.log('MEMULAI TES SEMUA API ENDPOINTS');
  console.log('='.repeat(80));

  // Test Revenue API
  await testEndpoint('REVENUE', revenueUrl);
  
  // Test NCX API
  await testEndpoint('NCX', ncxUrl);
  
  // Test Sales API
  await testEndpoint('SALES', salesUrl);
}

async function testEndpoint(name, url) {
  console.log(`\n--- Testing ${name} API ---`);
  console.log(`URL: ${url}`);
  
  if (!url) {
    console.error(`❌ URL untuk ${name} tidak ditemukan di .env`);
    return;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'auth-token': sessionToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 detik timeout
    });

    console.log(`✅ ${name} API Response Status: ${response.status}`);
    console.log(`📊 Response Type: ${typeof response.data}`);
    
    // Analisis struktur response
    if (response.data) {
      console.log(`🔍 Response Keys: [${Object.keys(response.data).join(', ')}]`);
      
      // Cek berbagai kemungkinan struktur data
      let actualData = null;
      let dataLocation = '';
      
      if (Array.isArray(response.data)) {
        actualData = response.data;
        dataLocation = 'response.data (direct array)';
      } else if (response.data.data && Array.isArray(response.data.data)) {
        actualData = response.data.data;
        dataLocation = 'response.data.data';
      } else if (response.data.result && Array.isArray(response.data.result)) {
        actualData = response.data.result;
        dataLocation = 'response.data.result';
      } else if (response.data.items && Array.isArray(response.data.items)) {
        actualData = response.data.items;
        dataLocation = 'response.data.items';
      } else if (response.data.records && Array.isArray(response.data.records)) {
        actualData = response.data.records;
        dataLocation = 'response.data.records';
      } else if (response.data.d && Array.isArray(response.data.d)) {
        actualData = response.data.d;
        dataLocation = 'response.data.d';
      }
      
      if (actualData && Array.isArray(actualData)) {
        console.log(`📍 Data Location: ${dataLocation}`);
        console.log(`📈 Total Rows: ${actualData.length}`);
        
        if (actualData.length > 0) {
          // Analisis kolom dari record pertama
          const firstRecord = actualData[0];
          const columns = Object.keys(firstRecord);
          
          console.log(`📋 Total Columns: ${columns.length}`);
          console.log(`🏷️  Column Names:`);
          columns.forEach((col, index) => {
            const value = firstRecord[col];
            const valueType = typeof value;
            const displayValue = value === null ? 'null' : 
                               value === undefined ? 'undefined' :
                               valueType === 'string' ? `"${value}"` :
                               value;
            console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${col.padEnd(25)} | ${valueType.padEnd(8)} | ${displayValue}`);
          });
          
          // Sample data (3 records pertama)
          console.log(`\n📄 Sample Data (first ${Math.min(3, actualData.length)} records):`);
          actualData.slice(0, 3).forEach((record, index) => {
            console.log(`\n   Record ${index + 1}:`);
            console.log('   ' + JSON.stringify(record, null, 4).replace(/\n/g, '\n   '));
          });
          
        } else {
          console.log('⚠️  Array kosong - tidak ada data');
        }
      } else {
        console.log('❌ Data bukan array atau tidak ditemukan');
        console.log('🔍 Full Response Structure:');
        console.log(JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('❌ Response data kosong');
    }

  } catch (error) {
    console.error(`❌ Error testing ${name} API:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   Tidak ada response dari server');
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log(`\n${'─'.repeat(60)}`);
}

async function runAllTests() {
  try {
    await testApiLogin();
  } catch (error) {
    console.error('Error dalam test:', error.message);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('TES SELESAI');
    console.log('='.repeat(80));
  }
}

runAllTests();
