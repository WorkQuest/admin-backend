'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'settings', {
      type: Sequelize.DataTypes.JSONB,
      allowNull: false,
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'settings', {
      type: Sequelize.DataTypes.JSONB,
      defaultValue: {
        security: null
      }
    })
  }
};
