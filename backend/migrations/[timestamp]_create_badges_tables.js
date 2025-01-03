exports.up = function(knex) {
  return knex.schema
    .createTable('badges', table => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.text('description');
      table.json('criteria').notNullable();
      table.string('icon_url', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('user_badges', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('badge_id').references('id').inTable('badges').onDelete('CASCADE');
      table.timestamp('awarded_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'badge_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('user_badges')
    .dropTable('badges');
}; 