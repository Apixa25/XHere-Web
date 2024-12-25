const config = {
    development: {
        mongodb: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/location-app',
        port: process.env.PORT || 3000,
        frontendUrl: 'http://localhost:3001'
    },
    production: {
        mongodb: process.env.MONGODB_URI,
        port: process.env.PORT,
        frontendUrl: 'https://your-app-name.herokuapp.com'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 