const config = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'location_app',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: process.env.PORT || 3000,
        frontendUrl: 'http://localhost:3001'
    },
    production: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        port: process.env.PORT,
        frontendUrl: process.env.FRONTEND_URL || 'https://xhere-api.herokuapp.com'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 