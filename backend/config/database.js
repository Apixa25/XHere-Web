const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Debug logging
console.log('🔍 Database Configuration Debug:');
console.log('Environment:', env);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'location_app',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

let sequelize;
if (env === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in production environment!');
    console.error('Available environment variables:', Object.keys(process.env));
    throw new Error('DATABASE_URL is required in production environment');
  }
  
  console.log('✅ Using production database configuration');
  sequelize = new Sequelize(config[env].url, config[env]);
} else {
  console.log('✅ Using development database configuration');
  sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    config[env]
  );
}

module.exports = sequelize; 