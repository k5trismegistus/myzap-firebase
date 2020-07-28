import * as functions from 'firebase-functions'
import * as algoliasearch from 'algoliasearch'

const ALGOLIA_ID = functions.config().algolia.app_id
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

const onSituationCreated = functions.firestore.document('users/{userId}/situations/{situationId}').onCreate((snap, context) => {
    const situationData = snap.data()!

    // Add an 'objectID' field which Algolia requires
    situationData.objectID = context.params.situationId;
    situationData.userId = context.params.userId;

    // Write to the algolia index
    const index = client.initIndex("situations")
    return index.saveObject(situationData)
})

const onTaskDataCreated = functions.firestore.document('users/{userId}/tasks/{taskId}').onCreate((snap, context) => {
  const taskData = snap.data()!

  // Add an 'objectID' field which Algolia requires
  taskData.objectID = context.params.taskId;
  taskData.userId = context.params.userId;
  taskData.completed = false;

  // Write to the algolia index
  const index = client.initIndex("tasks")
  return index.saveObject(taskData)
})

const onTaskDataChanged = functions.firestore.document('users/{userId}/tasks/{taskId}').onUpdate((change, context) => {
  // const before = change.before.data()!
  const after = change.after.data()!
  const index = client.initIndex('tasks')

  if (after.completion) {
    index.partialUpdateObject({
      objectID: context.params.taskId,
      completed: true,
    }).then((task) => { return task }).catch((err) => { console.error(err) })
  }

  return
})

export {
  onSituationCreated,
  onTaskDataCreated,
  onTaskDataChanged,
}