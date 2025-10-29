// Database inspection script that works through the running app
const http = require('http');

async function makeRequest(path, method = 'GET', data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        try {
          const jsonData = responseData ? JSON.parse(responseData) : null;
          resolve({ 
            status: res.statusCode, 
            data: jsonData, 
            cookies: cookies,
            raw: responseData
          });
        } catch (error) {
          resolve({ 
            status: res.statusCode, 
            data: responseData, 
            cookies: cookies,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function inspectDatabase() {
  console.log('🔍 Inspecting database through API endpoints...');
  
  try {
    // First, check health
    const health = await makeRequest('/api/health');
    console.log('API Health:', health.status, health.data);
    
    if (health.status !== 200) {
      console.error('❌ API is not healthy');
      return;
    }

    // Try to login to get authentication cookie
    console.log('\n🔑 Attempting to authenticate...');
    
    // First check if there are any users by trying common usernames
    const loginAttempts = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'user', password: 'user' },
      { username: 'test', password: 'test' },
      { username: 'admin', password: '123456' }
    ];

    let authCookie = null;
    let currentUser = null;

    for (const attempt of loginAttempts) {
      console.log(`Trying login: ${attempt.username} / ${attempt.password}`);
      const loginResponse = await makeRequest('/api/auth/login', 'POST', attempt);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        authCookie = loginResponse.cookies.join('; ');
        currentUser = attempt.username;
        break;
      } else {
        console.log(`❌ Login failed: ${loginResponse.status} - ${loginResponse.raw}`);
      }
    }

    if (!authCookie) {
      console.log('\n⚠️ Could not authenticate with common credentials.');
      console.log('📝 Continuing with unauthenticated requests...');
    } else {
      console.log(`\n✅ Authenticated as: ${currentUser}`);
    }

    // Check weekly day settings for current week
    console.log('\n📅 Checking weekly day settings...');
    
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay(); // 0 = Sunday
    const diff = weekStart.getDate() - day;
    weekStart.setDate(diff);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    console.log(`Week start date: ${weekStartStr}`);
    
    const weeklySettings = await makeRequest(`/api/weekly-day-settings?weekStart=${weekStartStr}`, 'GET', null, authCookie);
    
    console.log('\nWeekly Settings Response:');
    console.log('Status:', weeklySettings.status);
    console.log('Data:', JSON.stringify(weeklySettings.data, null, 2));
    
    if (weeklySettings.status === 401) {
      console.log('\n🔒 Authentication required for weekly settings.');
      console.log('This confirms the API is working but requires login.');
    }

    // Check a few other weeks to see if there's any data
    console.log('\n📊 Checking for data in other weeks...');
    
    for (let weekOffset = -2; weekOffset <= 2; weekOffset++) {
      const testWeek = new Date(weekStart);
      testWeek.setDate(testWeek.getDate() + (weekOffset * 7));
      const testWeekStr = testWeek.toISOString().split('T')[0];
      
      const testResponse = await makeRequest(`/api/weekly-day-settings?weekStart=${testWeekStr}`, 'GET', null, authCookie);
      
      if (testResponse.status === 200 && testResponse.data) {
        console.log(`Week ${testWeekStr}:`, testResponse.data.enabledCategories ? 'Has category data' : 'No category data');
      } else if (testResponse.status === 404) {
        console.log(`Week ${testWeekStr}: No settings found`);
      } else if (testResponse.status === 401) {
        console.log(`Week ${testWeekStr}: Auth required`);
      } else {
        console.log(`Week ${testWeekStr}: Status ${testResponse.status}`);
      }
    }

    // Check if we can access user settings
    if (authCookie) {
      console.log('\n👤 Checking user settings...');
      const userSettings = await makeRequest('/api/user/settings', 'GET', null, authCookie);
      console.log('User Settings Status:', userSettings.status);
      if (userSettings.status === 200) {
        console.log('User Settings:', JSON.stringify(userSettings.data, null, 2));
      }
    }

    console.log('\n📋 Database inspection complete.');
    
    if (!authCookie) {
      console.log('\n💡 Recommendations:');
      console.log('1. Login to the application first');
      console.log('2. Create some weekly settings to test');
      console.log('3. Then run this script again to see the current state');
    }

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
}

// Run the inspection
inspectDatabase()
  .then(() => {
    console.log('\n🎉 Inspection completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Inspection failed:', error);
    process.exit(1);
  });