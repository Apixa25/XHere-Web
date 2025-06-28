const config = {
    development: {
        username: 'postgres',
        password: '1234',
        database: 'location_app',
        host: 'localhost',
        dialect: 'postgres',
        port: 5432,
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