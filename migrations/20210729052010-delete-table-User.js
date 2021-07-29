'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      password:{
        type: Sequelize.DataTypes.STRING,
      },
    })
  }
};