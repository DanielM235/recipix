import type { Knex } from 'knex'
import { UserEntity } from '../entities'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(UserEntity.TABLE_NAME, table => {
    // Primary key
    table.string(UserEntity.COLUMNS.ID).primary()

    // User information
    table.string(UserEntity.COLUMNS.EMAIL).notNullable().unique()
    table.string(UserEntity.COLUMNS.PASSWORD).notNullable()
    table.string(UserEntity.COLUMNS.NAME).notNullable()
    table.string(UserEntity.COLUMNS.ROLE).notNullable().defaultTo('USER')

    // Timestamps
    table.timestamp(UserEntity.COLUMNS.CREATED_AT).defaultTo(knex.fn.now())
    table.timestamp(UserEntity.COLUMNS.UPDATED_AT).defaultTo(knex.fn.now())

    // Indexes
    table.index([UserEntity.COLUMNS.EMAIL], 'idx_users_email')
    table.index([UserEntity.COLUMNS.ROLE], 'idx_users_role')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(UserEntity.TABLE_NAME)
}
