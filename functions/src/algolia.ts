import * as functions from 'firebase-functions'
import * as algoliasearch from 'algoliasearch'

const ALGOLIA_ID = functions.config().algolia.app_id
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

const onSituationCreated = functions.firestore.document('situations/{situationId}').onCreate((snap, context) => {
    // Get the note document
    const situationData = snap.data()!

    // Add an 'objectID' field which Algolia requires
    situationData.objectID = context.params.situationId;

    // Write to the algolia index
    const index = client.initIndex("situations")
    return index.saveObject(situationData)
})

const onTaskDataCreated = functions.firestore.document('tasks/{taskId}').onCreate((snap, context) => {
  // Get the note document
  const taskData = snap.data()!

  // Add an 'objectID' field which Algolia requires
  taskData.objectID = context.params.taskId;

  // Write to the algolia index
  const index = client.initIndex("tasks")
  return index.saveObject(taskData)
})

export {
  onSituationCreated,
  onTaskDataCreated,
}