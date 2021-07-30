'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Admins', 'adminStatus')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Admins', 'adminStatus', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: 'unconfirmed'
    })
  }
};
