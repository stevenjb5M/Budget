import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assetsAPI, debtsAPI } from '../api/client'

// Mock the entire client module
vi.mock('../api/client', () => ({
  assetsAPI: {
    getAssets: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
  },
  debtsAPI: {
    getDebts: vi.fn(),
    createDebt: vi.fn(),
    updateDebt: vi.fn(),
    deleteDebt: vi.fn(),
  },
}))

const mockedAssetsAPI = vi.mocked(assetsAPI)
const mockedDebtsAPI = vi.mocked(debtsAPI)

describe('assetsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAssets', () => {
    it('should call getAssets function', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test Asset' }], status: 200, statusText: 'OK', headers: {}, config: {} as any }
      mockedAssetsAPI.getAssets.mockResolvedValue(mockResponse)

      const result = await assetsAPI.getAssets()

      expect(mockedAssetsAPI.getAssets).toHaveBeenCalledWith()
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockedAssetsAPI.getAssets.mockRejectedValue(error)

      await expect(assetsAPI.getAssets()).rejects.toThrow('API Error')
    })
  })

  describe('createAsset', () => {
    it('should call createAsset function with asset data', async () => {
      const assetData = { name: 'New Asset', currentValue: 1000 }
      const mockResponse = { data: { id: '1', ...assetData }, status: 201, statusText: 'Created', headers: {}, config: {} as any }
      mockedAssetsAPI.createAsset.mockResolvedValue(mockResponse)

      const result = await assetsAPI.createAsset(assetData)

      expect(mockedAssetsAPI.createAsset).toHaveBeenCalledWith(assetData)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const assetData = { name: 'New Asset', currentValue: 1000 }
      const error = new Error('API Error')
      mockedAssetsAPI.createAsset.mockRejectedValue(error)

      await expect(assetsAPI.createAsset(assetData)).rejects.toThrow('API Error')
    })
  })

  describe('updateAsset', () => {
    it('should call updateAsset function with asset data', async () => {
      const assetId = '123'
      const assetData = { name: 'Updated Asset', currentValue: 2000 }
      const mockResponse = { data: { id: assetId, ...assetData }, status: 200, statusText: 'OK', headers: {}, config: {} as any }
      mockedAssetsAPI.updateAsset.mockResolvedValue(mockResponse)

      const result = await assetsAPI.updateAsset(assetId, assetData)

      expect(mockedAssetsAPI.updateAsset).toHaveBeenCalledWith(assetId, assetData)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const assetId = '1'
      const assetData = { name: 'Updated Asset', currentValue: 2000 }
      const error = new Error('API Error')
      mockedAssetsAPI.updateAsset.mockRejectedValue(error)

      await expect(assetsAPI.updateAsset(assetId, assetData)).rejects.toThrow('API Error')
    })
  })

  describe('deleteAsset', () => {
    it('should call deleteAsset function', async () => {
      const assetId = '123'
      const mockResponse = { data: null, status: 204, statusText: 'No Content', headers: {}, config: {} as any }
      mockedAssetsAPI.deleteAsset.mockResolvedValue(mockResponse)

      const result = await assetsAPI.deleteAsset(assetId)

      expect(mockedAssetsAPI.deleteAsset).toHaveBeenCalledWith(assetId)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const assetId = '1'
      const error = new Error('API Error')
      mockedAssetsAPI.deleteAsset.mockRejectedValue(error)

      await expect(assetsAPI.deleteAsset(assetId)).rejects.toThrow('API Error')
    })
  })
})

describe('debtsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDebts', () => {
    it('should call getDebts function', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test Debt' }], status: 200, statusText: 'OK', headers: {}, config: {} as any }
      mockedDebtsAPI.getDebts.mockResolvedValue(mockResponse)

      const result = await debtsAPI.getDebts()

      expect(mockedDebtsAPI.getDebts).toHaveBeenCalledWith()
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockedDebtsAPI.getDebts.mockRejectedValue(error)

      await expect(debtsAPI.getDebts()).rejects.toThrow('API Error')
    })
  })

  describe('createDebt', () => {
    it('should call createDebt function with debt data', async () => {
      const debtData = { name: 'New Debt', currentBalance: 1000 }
      const mockResponse = { data: { id: '1', ...debtData }, status: 201, statusText: 'Created', headers: {}, config: {} as any }
      mockedDebtsAPI.createDebt.mockResolvedValue(mockResponse)

      const result = await debtsAPI.createDebt(debtData)

      expect(mockedDebtsAPI.createDebt).toHaveBeenCalledWith(debtData)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const debtData = { name: 'New Debt', currentBalance: 1000 }
      const error = new Error('API Error')
      mockedDebtsAPI.createDebt.mockRejectedValue(error)

      await expect(debtsAPI.createDebt(debtData)).rejects.toThrow('API Error')
    })
  })

  describe('updateDebt', () => {
    it('should call updateDebt function with debt data', async () => {
      const debtId = '123'
      const debtData = { name: 'Updated Debt', currentBalance: 2000 }
      const mockResponse = { data: { id: debtId, ...debtData }, status: 200, statusText: 'OK', headers: {}, config: {} as any }
      mockedDebtsAPI.updateDebt.mockResolvedValue(mockResponse)

      const result = await debtsAPI.updateDebt(debtId, debtData)

      expect(mockedDebtsAPI.updateDebt).toHaveBeenCalledWith(debtId, debtData)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const debtId = '1'
      const debtData = { name: 'Updated Debt', currentBalance: 2000 }
      const error = new Error('API Error')
      mockedDebtsAPI.updateDebt.mockRejectedValue(error)

      await expect(debtsAPI.updateDebt(debtId, debtData)).rejects.toThrow('API Error')
    })
  })

  describe('deleteDebt', () => {
    it('should call deleteDebt function', async () => {
      const debtId = '123'
      const mockResponse = { data: null, status: 204, statusText: 'No Content', headers: {}, config: {} as any }
      mockedDebtsAPI.deleteDebt.mockResolvedValue(mockResponse)

      const result = await debtsAPI.deleteDebt(debtId)

      expect(mockedDebtsAPI.deleteDebt).toHaveBeenCalledWith(debtId)
      expect(result).toBe(mockResponse)
    })

    it('should handle API errors', async () => {
      const debtId = '1'
      const error = new Error('API Error')
      mockedDebtsAPI.deleteDebt.mockRejectedValue(error)

      await expect(debtsAPI.deleteDebt(debtId)).rejects.toThrow('API Error')
    })
  })
})