exports.seed = function(knex) {
  return knex('badges').del()
    .then(function () {
      return knex('badges').insert([
        {
          name: 'First 5 Upvotes',
          description: 'Received 5 upvotes on your locations',
          criteria: JSON.stringify({
            type: 'upvotes',
            threshold: 5
          }),
          icon_url: '/badges/first-5-upvotes.png'
        },
        {
          name: 'Verified Contributor',
          description: 'Has at least one verified location',
          criteria: JSON.stringify({
            type: 'verified_locations',
            threshold: 1
          }),
          icon_url: '/badges/verified-contributor.png'
        },
        {
          name: 'Top Explorer',
          description: 'Added 10 or more locations',
          criteria: JSON.stringify({
            type: 'locations_added',
            threshold: 10
          }),
          icon_url: '/badges/top-explorer.png'
        }
      ]);
    });
}; 