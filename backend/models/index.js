const User = require('./User');
const Location = require('./Location');
const LocationComment = require('./LocationComment');
const Message = require('./Message');
const Badge = require('./Badge');
const CreditTransaction = require('./CreditTransaction');
const UserCreditStats = require('./UserCreditStats');

// Set up associations
const models = {
  User,
  Location,
  LocationComment,
  Message,
  Badge,
  CreditTransaction,
  UserCreditStats
};

// Call associate function for each model if it exists
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models; 