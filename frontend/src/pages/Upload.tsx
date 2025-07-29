import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import { Upload as UploadIcon, X, FileText, Image } from 'lucide-react'
import apiService from '../services/api'
import type { Receipt } from '../../shared/types'

function Upload() {
  const { t } = useTranslation()
  const [uploadedFiles, setUploadedFiles] = useState<Receipt[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('errors.fileTooBig'))
        continue
      }

      // Validate file type
      if (!file.type.match(/^(image\/(jpeg|jpg|png)|application\/pdf)$/)) {
        toast.error(t('errors.fileTypeNotSupported'))
        continue
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const response = await apiService.uploadReceipt(file, (progress) => {
          setUploadProgress(progress)
        })

        setUploadedFiles(prev => [...prev, response.receipt])
        toast.success(t('success.uploaded'))
      } catch (error) {
        toast.error(t('errors.uploadFailed'))
        console.error('Upload error:', error)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6" />
    }
    return <FileText className="h-6 w-6" />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('upload.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('upload.description')}
        </p>
      </div>

      {/* Upload Zone */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <UploadIcon className="h-12 w-12 text-gray-400 mb-4" />
            
            {isDragActive ? (
              <p className="text-lg text-primary-600 dark:text-primary-400 font-medium">
                {t('upload.dropzone.active')}
              </p>
            ) : (
              <>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t('upload.dropzone.title')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('upload.dropzone.subtitle')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('upload.preview.processing')}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('upload.preview.title')}
          </h2>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="text-gray-500 dark:text-gray-400 mr-3">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.status}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'completed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ {t('history.status.completed')}
                    </span>
                  )}
                  
                  {file.status === 'failed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      ✗ {t('history.status.failed')}
                    </span>
                  )}
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Upload
