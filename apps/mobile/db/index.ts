import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema } from './schema'
import { Task } from './models/Task'
import { TaskPhoto } from './models/TaskPhoto'
import { ContractItem } from './models/ContractItem'
import { Cabinet } from './models/Cabinet'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'ftth_fieldops',
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [Task, TaskPhoto, ContractItem, Cabinet],
})

export { Task, TaskPhoto, ContractItem, Cabinet }
