'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Admins', 'isActive', {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Admins', 'settings')
  }
};
