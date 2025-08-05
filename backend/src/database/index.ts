import DatabaseService from './connection'
import { UserRepository } from './repositories'

class RepositoryService {
  private static instance: RepositoryService
  private readonly databaseService: DatabaseService
  private _userRepository: UserRepository | null = null

  private constructor() {
    this.databaseService = DatabaseService.getInstance()
  }

  public static getInstance(): RepositoryService {
    if (!RepositoryService.instance) {
      RepositoryService.instance = new RepositoryService()
    }
    return RepositoryService.instance
  }

  public async initialize(): Promise<void> {
    await this.databaseService.initialize()
  }

  public get userRepository(): UserRepository {
    this._userRepository ??= new UserRepository(this.databaseService.db)
    return this._userRepository
  }

  public async close(): Promise<void> {
    await this.databaseService.close()
  }

  public async testConnection(): Promise<boolean> {
    return this.databaseService.testConnection()
  }
}

export default RepositoryService
