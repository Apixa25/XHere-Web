const { Model } = require('objection');

class Badge extends Model {
  static get tableName() {
    return 'badges';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'criteria'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string' },
        criteria: { type: 'object' },
        icon_url: { type: 'string', maxLength: 255 },
        created_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'badges.id',
          through: {
            from: 'user_badges.badge_id',
            to: 'user_badges.user_id'
          },
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Badge; 