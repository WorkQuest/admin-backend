'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('UserAvatars');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('UserAvatars', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId:{
        type: Sequelize.DataTypes.STRING,
        references: {
          model: {
            tableName: 'Users',
            schema: 'public',
          },
          key: 'id'
        }
      },
      image: {
        type: Sequelize.DataTypes.BLOB,
      },
    })
  }
};
