
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('QuestBlockReasons', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      questId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model:{
            tableName: 'Quests',
            schema: 'public',
          },
          key: 'id',
        }
      },
      blockReason: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      previousStatus: {
        type: Sequelize.DataTypes.INTEGER,
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
    return queryInterface.dropTable('QuestBlockReasons');
  }
};
