// Jobs module exports

export {
  // Queues
  emailQueue,
  smsQueue,
  inventoryQueue,
  reportsQueue,
  scheduledQueue,
  
  // Job creators
  jobs,
  
  // Setup functions
  setupScheduledJobs,
  setupQueueMonitoring,
  closeQueues,
  
  // Connection
  getConnection,
} from './queues'

export {
  startWorkers,
  stopWorkers,
  emailWorker,
  smsWorker,
  inventoryWorker,
  reportsWorker,
  scheduledWorker,
} from './workers'

export type {
  EmailJobData,
  SMSJobData,
  InventoryJobData,
  ReportJobData,
  ScheduledJobData,
} from './queues'
