// to run this script: node scripts/backup-database.js

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create backups directory if it doesn't exist
const backupPath = path.join(__dirname, '../backups');
if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log('Created backups directory');
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `location_app_backup_${timestamp}.sql`;
const filePath = path.join(backupPath, filename);

// Build the pg_dump command
const command = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST || 'localhost'} location_app > "${filePath}"`;

console.log('Starting database backup...');
console.log('Using command:', command.replace(process.env.DB_USER, '[USER]')); // Hide actual username in logs

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('Backup failed:', error);
        console.error('Command output:', stderr);
        return;
    }

    // Verify the backup file was created and has content
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error verifying backup file:', err);
            return;
        }

        const sizeMB = stats.size / (1024 * 1024);
        console.log(`Backup completed successfully!`);
        console.log(`File: ${filePath}`);
        console.log(`Size: ${sizeMB.toFixed(2)} MB`);
    });
}); 