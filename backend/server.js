const loginResponse = await fetch(loginURL, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    st: 'login', 
    data: {username: 'xxx', password: 'xxx'}
  })
});
const loginData = await loginResponse.json();
const token = loginData.t;

const revenueResponse = await fetch(revenueURL, {
  method: 'GET',
  headers: {
    'auth-token': token
  }
});
const revenueData = await revenueResponse.json();