// Browser console migration script
// Copy and paste this into your browser console when logged into the application

async function migrateLostWeeklySettings() {
  console.log('🚀 Starting browser-based weekly settings migration...');
  
  try {
    // First, let's see what weeks we can check
    console.log('📅 Checking for existing weekly settings...');
    
    const today = new Date();
    const weeksToCheck = [];
    
    // Check past 8 weeks and next 4 weeks
    for (let i = -8; i <= 4; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + (i * 7));
      
      // Get Sunday of the week (week start)
      const weekStart = new Date(checkDate);
      const dayOfWeek = weekStart.getDay(); // 0 = Sunday
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      weeksToCheck.push({
        weekStart: weekStartStr,
        offset: i,
        date: new Date(weekStart)
      });
    }
    
    console.log(`Checking ${weeksToCheck.length} weeks for existing data...`);
    
    let foundSettings = [];
    let needsMigration = [];
    
    for (const week of weeksToCheck) {
      try {
        const response = await fetch(`/api/weekly-day-settings?weekStart=${week.weekStart}`);
        
        if (response.ok) {
          const data = await response.json();
          foundSettings.push({
            ...week,
            data: data
          });
          
          console.log(`Week ${week.weekStart}: Found settings`, data.enabledCategories ? 'with categories' : 'without categories');
          
          // Check if this has old format data that needs migration
          if (data.enabledDays && !data.enabledCategories) {
            needsMigration.push({
              ...week,
              oldData: data.enabledDays
            });
            console.log(`  📝 Needs migration from enabledDays:`, data.enabledDays);
          }
        } else if (response.status === 404) {
          // No settings for this week - that's normal
          console.log(`Week ${week.weekStart}: No settings found (normal)`);
        } else {
          console.log(`Week ${week.weekStart}: Error ${response.status}`);
        }
        
      } catch (error) {
        console.log(`Week ${week.weekStart}: Error -`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Found ${foundSettings.length} weeks with existing settings`);
    console.log(`- Found ${needsMigration.length} weeks that need migration`);
    
    // If we found data that needs migration, convert it
    if (needsMigration.length > 0) {
      console.log('\n🔄 Migrating old format data...');
      
      for (const weekData of needsMigration) {
        console.log(`\nMigrating week ${weekData.weekStart}:`);
        console.log('Old data:', weekData.oldData);
        
        // Convert enabledDays to enabledCategories
        const enabledCategories = convertDaysToCategories(weekData.oldData);
        console.log('New data:', enabledCategories);
        
        try {
          const response = await fetch('/api/weekly-day-settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              weekStart: weekData.weekStart,
              enabledCategories: enabledCategories
            }),
          });
          
          if (response.ok) {
            console.log(`✅ Successfully migrated week ${weekData.weekStart}`);
          } else {
            const errorData = await response.json();
            console.log(`❌ Failed to migrate week ${weekData.weekStart}:`, errorData);
          }
        } catch (error) {
          console.log(`❌ Error migrating week ${weekData.weekStart}:`, error);
        }
      }
      
    } else if (foundSettings.length === 0) {
      console.log('\n💡 No existing weekly settings found.');
      console.log('This could mean:');
      console.log('1. You haven\'t used the weekly planning feature yet');
      console.log('2. The data was lost during the schema change');
      console.log('3. You\'re using a fresh database');
      
      console.log('\n🔧 Creating default settings for current week...');
      
      const currentWeek = weeksToCheck.find(w => w.offset === 0);
      if (currentWeek) {
        const defaultCategories = {
          sunday: { breakfast: true, lunch: true, dinner: true, snack: true },
          monday: { breakfast: true, lunch: true, dinner: true, snack: true },
          tuesday: { breakfast: true, lunch: true, dinner: true, snack: true },
          wednesday: { breakfast: true, lunch: true, dinner: true, snack: true },
          thursday: { breakfast: true, lunch: true, dinner: true, snack: true },
          friday: { breakfast: true, lunch: true, dinner: true, snack: true },
          saturday: { breakfast: true, lunch: true, dinner: true, snack: true }
        };
        
        try {
          const response = await fetch('/api/weekly-day-settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              weekStart: currentWeek.weekStart,
              enabledCategories: defaultCategories
            }),
          });
          
          if (response.ok) {
            console.log(`✅ Created default settings for current week`);
          } else {
            console.log(`❌ Failed to create default settings`);
          }
        } catch (error) {
          console.log(`❌ Error creating default settings:`, error);
        }
      }
      
    } else {
      console.log('\n✅ All settings are already in the correct format!');
      console.log('No migration needed.');
    }
    
    console.log('\n🎉 Migration process completed!');
    console.log('📄 You can now refresh the page to see your restored settings.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
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

// Instructions for use
console.log(`
🚀 WEEKLY SETTINGS MIGRATION TOOL
==================================

To run this migration:

1. Make sure you're logged into the application
2. Copy and paste this entire script into your browser console (F12 > Console)
3. Run: migrateLostWeeklySettings()

This will:
- Check for existing weekly settings
- Convert any old day-based format to new category-based format
- Create default settings if none exist
- Preserve your previous enable/disable choices

Ready to run when you are!
`);

// Auto-run if in browser environment
if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
  console.log('🌐 Running in browser - starting migration automatically in 3 seconds...');
  setTimeout(() => {
    migrateLostWeeklySettings();
  }, 3000);
}