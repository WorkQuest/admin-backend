
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Admin', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      email: {
        type: Sequelize.DataTypes.STRING,
        unique: true,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
      },
      firstName: {
        type: Sequelize.DataTypes.STRING,
      },
      lastName: {
        type: Sequelize.DataTypes.STRING,
      },
      adminRole: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: 'main_admin',
      },
      adminStatus: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: 'unconfirmed'
      },
      settings: {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {
          confirmCode: null,
          confirmCodeValidUntil: null,
          changePasswordCode: null,
          changePasswordCodeValidUntil: null
        }
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Admin');
  }
};
