'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Admins', 'settings')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Admins', 'settings', {
      type: Sequelize.DataTypes.JSONB,
      defaultValue: {
        confirmCode: null,
        confirmCodeValidUntil: null,
        changePasswordCode: null,
        changePasswordCodeValidUntil: null
      }
    })
  }
};
