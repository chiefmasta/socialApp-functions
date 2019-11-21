const functions = require('firebase-functions');

const app = require('express')();

const fbAuth = require('./utilities/fbAuth');

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
} = require('./handlers/users');

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', fbAuth, deleteScream);
app.get('/scream/:screamId/like', fbAuth, likeScream);
app.get('/scream/:screamId/unlike', fbAuth, unlikeScream);
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

// Signup Route
app.post('/signup', signUp);
app.post('/login', signIn);
app.post('/user/image', fbAuth, uploadImage);
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
