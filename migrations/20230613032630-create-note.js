'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notes', { 
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          table: 'users',
          key: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      noteContent: {
          type: Sequelize.STRING,
          allowNull: false
      },
      mediaId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            table: 'media',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
      },
      noteCreatedTS: {
          type: Sequelize.DATE,
          allowNull: false, 
          defaultValue: Sequelize.NOW
      },
      noteUpdatedTS: {
          type: Sequelize.DATE,
          allowNull: true
      },
      noteDeletedTS: {
          type: Sequelize.DATE,
          allowNull: true
      },
      replyToNoteId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            table: 'notes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notes');
  }
};
