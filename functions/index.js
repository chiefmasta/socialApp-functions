const functions = require('firebase-functions');

const app = require('express')();

const fbAuth = require('./utilities/fbAuth');
const { db } = require('./utilities/admin');

const {
    getAllScreams,
    postOneScream,
    getScream,
    likeScream,
    unlikeScream,
    commentOnScream,
    deleteScream,
} = require('./handlers/screams');
const {
    signUp,
    signIn,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead,
} = require('./handlers/users');

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', fbAuth, deleteScream);
app.get('/scream/:screamId/like', fbAuth, likeScream);
app.get('/scream/:screamId/unlike', fbAuth, unlikeScream);
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

// User routes
app.post('/signup', signUp);
app.post('/login', signIn);
app.post('/user/image', fbAuth, uploadImage);
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', fbAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
    .document('likes/{id}')
    .onCreate(snapshot => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id,
                    });
                }
            })
            .catch(err => console.error(err));
    });

exports.deleteNotificationOnUnlike = functions.firestore
    .document('likes/{id}')
    .onDelete(snapshot => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(doc => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.createNotificationOnComment = functions.firestore
    .document('comments/{id}')
    .onCreate(snapshot => {
        db.doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        recipent: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        read: false,
                        screamId: doc.id,
                        type: 'comment',
                        createdAt: new Date().toISOString(),
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });
