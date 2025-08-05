import type { Knex } from 'knex'
import { ConnectorEntity, UserEntity } from '../entities'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(ConnectorEntity.TABLE_NAME, (table) => {
    // Primary key
    table.string(ConnectorEntity.COLUMNS.ID).primary()
    
    // Foreign key to users
    table.string(ConnectorEntity.COLUMNS.USER_ID).notNullable()
    table.foreign(ConnectorEntity.COLUMNS.USER_ID)
         .references(UserEntity.COLUMNS.ID)
         .inTable(UserEntity.TABLE_NAME)
         .onDelete('CASCADE')
    
    // Connector information
    table.string(ConnectorEntity.COLUMNS.NAME).notNullable()
    table.string(ConnectorEntity.COLUMNS.TYPE).notNullable()
    table.string(ConnectorEntity.COLUMNS.BASE_URL).notNullable()
    
    // Authentication fields (encrypted in application layer)
    table.text(ConnectorEntity.COLUMNS.API_KEY).nullable()
    table.text(ConnectorEntity.COLUMNS.CLIENT_ID).nullable()
    table.text(ConnectorEntity.COLUMNS.CLIENT_SECRET).nullable()
    table.text(ConnectorEntity.COLUMNS.ACCESS_TOKEN).nullable()
    table.text(ConnectorEntity.COLUMNS.REFRESH_TOKEN).nullable()
    
    // Status
    table.boolean(ConnectorEntity.COLUMNS.IS_ACTIVE).defaultTo(true)
    
    // Timestamps
    table.timestamp(ConnectorEntity.COLUMNS.CREATED_AT).defaultTo(knex.fn.now())
    table.timestamp(ConnectorEntity.COLUMNS.UPDATED_AT).defaultTo(knex.fn.now())
    
    // Indexes
    table.index([ConnectorEntity.COLUMNS.USER_ID], 'idx_connectors_user_id')
    table.index([ConnectorEntity.COLUMNS.TYPE], 'idx_connectors_type')
    table.index([ConnectorEntity.COLUMNS.IS_ACTIVE], 'idx_connectors_is_active')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(ConnectorEntity.TABLE_NAME)
}
