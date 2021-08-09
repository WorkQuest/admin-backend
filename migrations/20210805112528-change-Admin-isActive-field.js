'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'isActive', {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'isActive', {
      type: Sequelize.DataTypes.BOOEAN,
      defaultValue: true
    })
  }
};
