const User = require('./User');
const Location = require('./Location');
const LocationComment = require('./LocationComment');
const Message = require('./Message');
const Badge = require('./Badge');
const UserBadge = require('./UserBadge');
const CreditTransaction = require('./CreditTransaction');
const UserCreditStats = require('./UserCreditStats');
const LocationOwnership = require('./LocationOwnership');
const LocationOwnershipHistory = require('./LocationOwnershipHistory');
const LocationNomination = require('./LocationNomination');
const NominationVote = require('./NominationVote');

// Set up associations
const models = {
  User,
  Location,
  LocationComment,
  Message,
  Badge,
  UserBadge,
  CreditTransaction,
  UserCreditStats,
  LocationOwnership,
  LocationOwnershipHistory,
  LocationNomination,
  NominationVote
};

// Call associate function for each model if it exists
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models; 