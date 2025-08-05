import type { Knex } from 'knex'
import { ReceiptEntity, UserEntity, ConnectorEntity } from '../entities'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(ReceiptEntity.TABLE_NAME, (table) => {
    // Primary key
    table.string(ReceiptEntity.COLUMNS.ID).primary()
    
    // Foreign key to users
    table.string(ReceiptEntity.COLUMNS.USER_ID).notNullable()
    table.foreign(ReceiptEntity.COLUMNS.USER_ID)
         .references(UserEntity.COLUMNS.ID)
         .inTable(UserEntity.TABLE_NAME)
         .onDelete('CASCADE')
    
    // Optional foreign key to connectors
    table.string(ReceiptEntity.COLUMNS.CONNECTOR_ID).nullable()
    table.foreign(ReceiptEntity.COLUMNS.CONNECTOR_ID)
         .references(ConnectorEntity.COLUMNS.ID)
         .inTable(ConnectorEntity.TABLE_NAME)
         .onDelete('SET NULL')
    
    // File information
    table.string(ReceiptEntity.COLUMNS.FILE_NAME).notNullable()
    table.string(ReceiptEntity.COLUMNS.ORIGINAL_NAME).notNullable()
    table.integer(ReceiptEntity.COLUMNS.FILE_SIZE).notNullable()
    table.string(ReceiptEntity.COLUMNS.MIME_TYPE).notNullable()
    
    // OCR and extracted data
    table.text(ReceiptEntity.COLUMNS.OCR_TEXT).nullable()
    table.json(ReceiptEntity.COLUMNS.EXTRACTED_DATA).nullable()
    
    // Receipt details
    table.decimal(ReceiptEntity.COLUMNS.AMOUNT, 10, 2).nullable()
    table.string(ReceiptEntity.COLUMNS.CURRENCY, 3).nullable()
    table.date(ReceiptEntity.COLUMNS.DATE).nullable()
    table.string(ReceiptEntity.COLUMNS.MERCHANT).nullable()
    table.string(ReceiptEntity.COLUMNS.CATEGORY).nullable()
    table.text(ReceiptEntity.COLUMNS.DESCRIPTION).nullable()
    
    // Processing status
    table.string(ReceiptEntity.COLUMNS.STATUS).notNullable().defaultTo('uploaded')
    table.json(ReceiptEntity.COLUMNS.PROCESSING_ERRORS).nullable()
    table.string(ReceiptEntity.COLUMNS.EXTERNAL_ID).nullable()
    
    // Timestamps
    table.timestamp(ReceiptEntity.COLUMNS.CREATED_AT).defaultTo(knex.fn.now())
    table.timestamp(ReceiptEntity.COLUMNS.UPDATED_AT).defaultTo(knex.fn.now())
    
    // Indexes
    table.index([ReceiptEntity.COLUMNS.USER_ID], 'idx_receipts_user_id')
    table.index([ReceiptEntity.COLUMNS.CONNECTOR_ID], 'idx_receipts_connector_id')
    table.index([ReceiptEntity.COLUMNS.STATUS], 'idx_receipts_status')
    table.index([ReceiptEntity.COLUMNS.DATE], 'idx_receipts_date')
    table.index([ReceiptEntity.COLUMNS.CREATED_AT], 'idx_receipts_created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(ReceiptEntity.TABLE_NAME)
}
