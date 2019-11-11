const functions = require("firebase-functions");

const app = require("express")();

const fbAuth = require("./utilities/fbAuth");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signUp, signIn, uploadImage } = require("./handlers/users");

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", fbAuth, postOneScream);

// Signup Route
app.post("/signup", signUp);
app.post("/login", signIn);
app.post("/user/image", fbAuth, uploadImage);

exports.api = functions.https.onRequest(app);
