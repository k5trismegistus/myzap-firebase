import * as functions from 'firebase-functions'
const logger = functions.logger
import * as admin from 'firebase-admin'
const firestore = admin.firestore
admin.initializeApp(functions.config().firebase)
const db = firestore()

import * as algoliasearch from 'algoliasearch'

const ALGOLIA_ID = functions.config().algolia.app_id
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

const onSituationCreated = functions.firestore.document('users/{userId}/situations/{situationId}').onCreate((snap, context) => {
    const situationData = snap.data()

    // Add an 'objectID' field which Algolia requires
    situationData.objectID = context.params.situationId;
    situationData.userId = context.params.userId;

    // Write to the algolia index
    const index = client.initIndex("situationRefs")
    return index.saveObject(situationData)
})

const onTaskDataCreated = functions.firestore.document('users/{userId}/tasks/{taskId}').onCreate((snap, context) => {
  const taskData = snap.data()

  // Add an 'objectID' field which Algolia requires
  taskData.objectID = context.params.taskId;
  taskData.userId = context.params.userId;
  taskData.completed = false;

  // Write to the algolia index
  const index = client.initIndex("tasks")
  index.saveObject(taskData).then((task) => { return task }).catch((err) => { console.error(err) })



  // Increment reference counter of situation
  const promises = taskData.situationRefs
    .map((ref: admin.firestore.DocumentReference) => {
      const situation = db.doc(ref.path)

      return situation.update({referenceCount: admin.firestore.FieldValue.increment(1) })
        .catch((err) => logger.error(`Error on incrementing reference count: ${ref.path}`))
        .then(() => { logger.info(`Success on updating reference count: ${ref.path}`) })
    })

  return Promise.all(promises)
})

const onTaskDataChanged = functions.firestore.document('users/{userId}/tasks/{taskId}').onUpdate((change, context) => {
  // const before = change.before.data()!
  const after = change.after.data()
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