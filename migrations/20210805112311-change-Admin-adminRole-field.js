'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'adminRole', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Admins', 'adminRole', {
      type: Sequelize.DataTypes.STRING,
      defaultValue: "main"
    })
  }
};
