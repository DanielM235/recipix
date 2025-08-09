import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Image, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import apiService from '../services/api'
import type { Receipt } from '../../../shared/types'

function History() {
  const { t } = useTranslation()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReceipts = async (page = 1) => {
    try {
      setIsLoading(true)
      const response = await apiService.getReceipts(page, 20)
      setReceipts(response.receipts)
      setTotalPages(Math.ceil(response.total / 20))
      setCurrentPage(page)
    } catch {
      // Handle error silently or show user-friendly message
      setReceipts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [])

  const getStatusIcon = (status: Receipt['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-5 w-5 text-green-500' />
      case 'failed':
        return <XCircle className='h-5 w-5 text-red-500' />
      case 'processing':
        return <AlertCircle className='h-5 w-5 text-yellow-500' />
      default:
        return <Clock className='h-5 w-5 text-gray-500' />
    }
  }

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className='h-5 w-5' />
    } else if (mimeType === 'application/pdf') {
      return <FileText className='h-5 w-5' />
    }
    return <FileText className='h-5 w-5' />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2)
  }

  if (isLoading) {
    return (
      <div className='max-w-6xl mx-auto'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6'></div>
          <div className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-20 bg-gray-200 dark:bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
          {t('history.title')}
        </h1>
        <p className='text-gray-600 dark:text-gray-300'>
          Track your processed receipts and their status
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className='card text-center py-12'>
          <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            {t('history.empty')}
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>Start by uploading your first receipt</p>
        </div>
      ) : (
        <>
          {/* Receipts List */}
          <div className='card overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-800'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      File
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Amount
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Date Uploaded
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                  {receipts.map(receipt => (
                    <tr key={receipt.id} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='text-gray-500 dark:text-gray-400 mr-3'>
                            {getFileIcon(receipt.mimeType)}
                          </div>
                          <div>
                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                              {receipt.originalName}
                            </div>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                              {receipt.mimeType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          {getStatusIcon(receipt.status)}
                          <span
                            className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}
                          >
                            {t(`history.status.${receipt.status}`)}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                        {receipt.expenseData?.amount
                          ? `$${receipt.expenseData.amount.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                        {formatDate(receipt.uploadedAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                        {formatFileSize(receipt.size)} MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-6'>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Page {currentPage} of {totalPages}
              </div>

              <div className='flex space-x-2'>
                <button
                  onClick={() => fetchReceipts(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='btn btn-outline px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>

                <button
                  onClick={() => fetchReceipts(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='btn btn-outline px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default History
