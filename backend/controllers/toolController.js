// File: backend/controllers/toolController.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let sessionToken = null;
let sessionExpiry = null;

async function loginAndGetToken() {
  console.log('Attempting to log in to central API to get a token...');
  sessionToken = null;
  const loginUrl = process.env.CENTRAL_API_LOGIN_URL;
  const username = process.env.CENTRAL_API_USER;
  const password = process.env.CENTRAL_API_PASS;
  try {
    const response = await axios.post(loginUrl, {
      st: 'login',
      data: { username, password }
    });
    if (response.data && response.data.t) {
      sessionToken = response.data.t;
      console.log('Successfully obtained a new token.');
      sessionExpiry = new Date().getTime() + (55 * 60 * 1000);
    } else {
      throw new Error('Login response did not contain a token.');
    }
  } catch (error) {
    console.error('Failed to log in to central API:', error.message);
    throw new Error('Authentication with central API failed.');
  }
}

async function fetchData(dataUrl, dataName) {
    const now = new Date().getTime();
    if (!sessionToken || (sessionExpiry && now > sessionExpiry)) {
        console.log(`No valid session token for ${dataName}. Logging in...`);
        await loginAndGetToken();
    }
    console.log(`Fetching ${dataName} data using auth-token header...`);
    const headers = { 'auth-token': sessionToken };
    let response = await axios.get(dataUrl, { headers });

    if (response.data && response.data.m === "Your session expired, please relogin!") {
        console.log(`Token was rejected for ${dataName}. Retrying once...`);
        await loginAndGetToken();
        response = await axios.get(dataUrl, { headers: { 'auth-token': sessionToken } });
    }

    if (response.data && response.data.s === true && Array.isArray(response.data.d)) {
        return response.data.d;
    } else {
        console.warn(`Warning: Response for ${dataName} is not in the expected format or failed. Response:`, response.data);
        return [];
    }
}

export const httpFetchCentralRevenueData = async (req, res) => {
  try {
    const data = await fetchData(process.env.CENTRAL_API_REVENUE_URL, 'Revenue');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const httpFetchCentralNcxData = async (req, res) => {
  try {
    const data = await fetchData(process.env.CENTRAL_API_NCX_URL, 'NCX');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const httpFetchCentralSalesData = async (req, res) => {
  try {
    const data = await fetchData(process.env.CENTRAL_API_SALES_URL, 'Sales');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const internalFetchRevenueData = () => fetchData(process.env.CENTRAL_API_REVENUE_URL, 'Revenue');
export const internalFetchNcxData = () => fetchData(process.env.CENTRAL_API_NCX_URL, 'NCX');
export const internalFetchSalesData = () => fetchData(process.env.CENTRAL_API_SALES_URL, 'Sales');
