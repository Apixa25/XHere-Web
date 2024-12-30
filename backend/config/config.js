const config = {
    development: {
        port: process.env.PORT || 3000,
        frontendUrl: 'http://localhost:3001',
        database: {
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'location_app',
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres'
        }
    },
    production: {
        port: process.env.PORT,
        frontendUrl: process.env.FRONTEND_URL || 'https://xhere-api.herokuapp.com',
        database: {
            url: process.env.DATABASE_URL,
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
        }
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 