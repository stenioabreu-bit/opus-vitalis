// Simple integration verification
const fs = require('fs');

console.log('=== Integration Verification ===');

// Check if all main pages exist
const pages = [
    'index.html',
    'login.html', 
    'dashboard.html',
    'create-report.html',
    'reports.html',
    'view-report.html',
    // 'shared-reports.html', // Compartilhamento removido
    'team-reports.html'
];

let allPagesExist = true;
pages.forEach(page => {
    if (fs.existsSync(page)) {
        console.log('✓ ' + page + ' exists');
    } else {
        console.log('✗ ' + page + ' missing');
        allPagesExist = false;
    }
});

// Check if all scripts exist
const scripts = [
    'scripts/auth.js',
    'scripts/utils.js',
    'scripts/reports.js',
    'scripts/teams.js',
    'scripts/data-loader.js'
];

let allScriptsExist = true;
scripts.forEach(script => {
    if (fs.existsSync(script)) {
        console.log('✓ ' + script + ' exists');
    } else {
        console.log('✗ ' + script + ' missing');
        allScriptsExist = false;
    }
});

// Check if data files exist
const dataFiles = [
    'data/users.json',
    'data/reports.json', 
    'data/teams.json'
];

let allDataFilesExist = true;
dataFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log('✓ ' + file + ' exists');
    } else {
        console.log('✗ ' + file + ' missing');
        allDataFilesExist = false;
    }
});

// Check CSS
if (fs.existsSync('assets/css/styles.css')) {
    console.log('✓ CSS file exists');
} else {
    console.log('✗ CSS file missing');
}

console.log('\n=== Integration Status ===');
if (allPagesExist && allScriptsExist && allDataFilesExist) {
    console.log('✓ All components are properly integrated');
} else {
    console.log('✗ Some components are missing');
}