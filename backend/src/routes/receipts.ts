import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import pdfParse from 'pdf-parse'
import logger from '../utils/logger'
import { Receipt, OCRData, ProcessingStatus } from '../../../shared/types'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and PDFs only
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only image and PDF files are allowed!'))
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter,
})

// In-memory storage for receipts (in production, use a database)
const receipts: Receipt[] = []

/**
 * @route   POST /api/receipts/upload
 * @desc    Upload receipt file
 * @access  Public
 */
router.post('/upload', upload.single('receipt'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const receipt: Receipt = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    }

    receipts.push(receipt)

    logger.info(`File uploaded: ${receipt.originalName} (${receipt.id})`)

    res.json({
      success: true,
      data: {
        receipt,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/receipts
 * @desc    Get all receipts with pagination
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const paginatedReceipts = receipts.slice(skip, skip + limit)

  res.json({
    success: true,
    data: {
      receipts: paginatedReceipts,
      total: receipts.length,
      page,
      limit,
    },
  })
})

/**
 * @route   GET /api/receipts/:id
 * @desc    Get receipt by ID
 * @access  Public
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const receipt = receipts.find(r => r.id === id)

  if (!receipt) {
    return res.status(404).json({
      success: false,
      error: 'Receipt not found',
    })
  }

  res.json({
    success: true,
    data: receipt,
  })
})

/**
 * @route   POST /api/receipts/:id/process
 * @desc    Process receipt with OCR
 * @access  Public
 */
router.post('/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const receipt = receipts.find(r => r.id === id)

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      })
    }

    // Update status to processing
    receipt.status = 'processing'

    logger.info(`Processing receipt: ${receipt.id}`)

    // Process the file based on type
    let ocrData: OCRData
    const filePath = path.join(process.env.UPLOAD_DIR || 'uploads', receipt.filename)

    if (receipt.mimeType.startsWith('image/')) {
      ocrData = await processImage(filePath)
    } else if (receipt.mimeType === 'application/pdf') {
      ocrData = await processPDF(filePath)
    } else {
      throw new Error('Unsupported file type')
    }

    // Update receipt with OCR data
    receipt.ocrData = ocrData
    receipt.status = 'completed'

    logger.info(`Receipt processed successfully: ${receipt.id}`)

    const status: ProcessingStatus = {
      receiptId: receipt.id,
      status: receipt.status,
      progress: 100,
      message: 'Processing completed successfully',
    }

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    const { id } = req.params
    const receipt = receipts.find(r => r.id === id)
    
    if (receipt) {
      receipt.status = 'failed'
      receipt.error = error instanceof Error ? error.message : 'Unknown error'
    }

    logger.error(`Failed to process receipt ${id}:`, error)
    next(error)
  }
})

/**
 * @route   POST /api/receipts/:id/submit
 * @desc    Submit expense to financial system
 * @access  Public
 */
router.post('/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { expenseData, connector = 'firefly' } = req.body

    const receipt = receipts.find(r => r.id === id)

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      })
    }

    // Store expense data
    receipt.expenseData = expenseData

    // Submit to connector (implementation would go here)
    // For now, just simulate success
    const transactionId = `tx_${uuidv4()}`
    receipt.fireflyTransactionId = transactionId

    logger.info(`Expense submitted to ${connector}: ${receipt.id}`)

    res.json({
      success: true,
      data: {
        transactionId,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Helper functions for OCR processing
async function processImage(filePath: string): Promise<OCRData> {
  try {
    // Optimize image for OCR
    const optimizedBuffer = await sharp(filePath)
      .greyscale()
      .normalise()
      .toBuffer()

    // Perform OCR
    const result = await Tesseract.recognize(optimizedBuffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      extractedData: extractDataFromText(result.data.text),
    }
  } catch (error) {
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function processPDF(filePath: string): Promise<OCRData> {
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdfParse(dataBuffer)

    return {
      text: data.text,
      confidence: 0.9, // PDF text extraction is generally reliable
      extractedData: extractDataFromText(data.text),
    }
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function extractDataFromText(text: string) {
  // Simple extraction logic - in production, use more sophisticated NLP
  const extractedData: any = {}

  // Extract amount (simple regex for currency)
  const amountMatch = text.match(/\$?\d+[.,]\d{2}|\$\d+/)
  if (amountMatch) {
    extractedData.amount = parseFloat(amountMatch[0].replace('$', '').replace(',', '.'))
  }

  // Extract date
  const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
  if (dateMatch) {
    extractedData.date = dateMatch[0]
  }

  // Extract merchant (first line that looks like a business name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  if (lines.length > 0) {
    extractedData.merchant = lines[0]
  }

  return extractedData
}

export default router
