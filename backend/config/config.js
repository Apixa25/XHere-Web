const config = {
    development: {
        mongodb: 'mongodb://127.0.0.1:27017/location-app',
        port: process.env.PORT || 3000,
        frontendUrl: 'http://localhost:3001'
    },
    production: {
        mongodb: process.env.MONGODB_URI,
        port: process.env.PORT,
        frontendUrl: process.env.FRONTEND_URL || 'https://xhere-api.herokuapp.com'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 