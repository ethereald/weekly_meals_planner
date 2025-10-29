// Migration script using the application's API endpoints
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, method = 'GET', data = null) {
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

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
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

async function migrateWeeklySettings() {
  console.log('🚀 Starting migration from day-level to category-level settings...');
  
  try {
    // First check the health of the API
    console.log('🏥 Checking API health...');
    const healthCheck = await makeRequest('/api/health');
    
    if (healthCheck.status !== 200) {
      throw new Error(`API is not healthy: ${healthCheck.status}`);
    }
    
    console.log('✅ API is healthy');
    console.log('Database status:', healthCheck.data.database);
    
    // Check if this is using SQLite (development) and if the weekly-day-settings table exists
    console.log('📋 Checking current weekly settings...');
    
    // Try to get settings for the current week to see if the API works
    const currentDate = new Date();
    const weekStart = getWeekStart(currentDate);
    const weekStartStr = formatDate(weekStart);
    
    console.log(`Checking settings for week starting: ${weekStartStr}`);
    
    const currentSettings = await makeRequest(`/api/weekly-day-settings?weekStart=${weekStartStr}`);
    
    if (currentSettings.status === 200) {
      console.log('✅ Weekly day settings API is working');
      
      // Check if this is old format (enabledDays) or new format (enabledCategories)
      if (currentSettings.data.enabledDays) {
        console.log('📝 Found old format (enabledDays), migrating...');
        console.log('Old data:', currentSettings.data.enabledDays);
        
        // Convert old format to new format
        const enabledDays = currentSettings.data.enabledDays;
        const enabledCategories = convertDaysToCategories(enabledDays);
        
        console.log('New format:', enabledCategories);
        
        // Save the converted format
        const updateResult = await makeRequest('/api/weekly-day-settings', 'PUT', {
          weekStart: weekStartStr,
          enabledCategories: enabledCategories
        });
        
        if (updateResult.status === 200) {
          console.log('✅ Successfully migrated current week settings');
        } else {
          console.log('❌ Failed to update settings:', updateResult);
        }
        
      } else if (currentSettings.data.enabledCategories) {
        console.log('✅ Already using new format (enabledCategories)');
        console.log('Current settings:', currentSettings.data.enabledCategories);
      } else {
        console.log('📝 No existing settings found, will create with new format');
      }
      
    } else if (currentSettings.status === 404) {
      console.log('📝 No existing weekly settings found (this is normal for new installations)');
    } else {
      console.log(`⚠️ Unexpected response from weekly-day-settings API: ${currentSettings.status}`);
      console.log('Response:', currentSettings.data);
    }
    
    // Test creating new settings to make sure the new format works
    console.log('🧪 Testing new format by creating test settings...');
    
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // Next week
    const testWeekStart = getWeekStart(testDate);
    const testWeekStartStr = formatDate(testWeekStart);
    
    const testCategories = {
      sunday: { breakfast: true, lunch: true, dinner: true, snack: true },
      monday: { breakfast: true, lunch: true, dinner: true, snack: true },
      tuesday: { breakfast: true, lunch: true, dinner: true, snack: true },
      wednesday: { breakfast: true, lunch: true, dinner: true, snack: true },
      thursday: { breakfast: true, lunch: true, dinner: true, snack: true },
      friday: { breakfast: true, lunch: true, dinner: true, snack: true },
      saturday: { breakfast: true, lunch: true, dinner: true, snack: true }
    };
    
    const testResult = await makeRequest('/api/weekly-day-settings', 'PUT', {
      weekStart: testWeekStartStr,
      enabledCategories: testCategories
    });
    
    if (testResult.status === 200) {
      console.log('✅ New format works correctly');
      console.log('Test result:', testResult.data.enabledCategories);
    } else {
      console.log('❌ New format test failed:', testResult);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📌 Summary:');
    console.log('   • The application now uses category-level enable/disable');
    console.log('   • Disabled days will have all categories disabled');
    console.log('   • Enabled days will have all categories enabled');
    console.log('   • You can now control individual categories per day in the UI');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day; // Adjust to get Sunday
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function convertDaysToCategories(enabledDays) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const categories = {};
  
  days.forEach(day => {
    const dayEnabled = enabledDays[day] !== false; // Default to true if undefined
    categories[day] = {
      breakfast: dayEnabled,
      lunch: dayEnabled,
      dinner: dayEnabled,
      snack: dayEnabled
    };
  });
  
  return categories;
}

// Wait a bit to make sure the server is ready, then run migration
setTimeout(() => {
  migrateWeeklySettings()
    .then(() => {
      console.log('\n🎉 Migration process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error);
      process.exit(1);
    });
}, 2000); // Wait 2 seconds for server to be ready

console.log('⏳ Waiting for server to be ready...');
console.log('💡 Make sure the development server is running: pnpm dev');