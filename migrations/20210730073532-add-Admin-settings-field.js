'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Admins', 'settings', {
      type: Sequelize.DataTypes.JSONB,
      defaultValue: {
        security: null
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Admins', 'settings')
  }
};
