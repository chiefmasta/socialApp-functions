const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyBGnzLEj2tS4dWf6LBDzdR5AwhUwKm_HkM",
    authDomain: "socialapp-87edf.firebaseapp.com",
    databaseURL: "https://socialapp-87edf.firebaseio.com",
    projectId: "socialapp-87edf",
    storageBucket: "socialapp-87edf.appspot.com",
    messagingSenderId: "642470426620",
    appId: "1:642470426620:web:24b126026a72ba42342479",
    measurementId: "G-3Q2X1CKG7D"
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/screams", (req, res) => {
    db.collection("screams")
        .orderBy("createdAt", "desc")
        .get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    userHandle: doc.data().userHandle,
                    body: doc.data().body,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(screams);
        })
        .catch(err => console.error(err));
});

app.post("/scream", (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db.collection("screams")
        .add(newScream)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully` });
        })
        .catch(err => {
            res.status(500).json({ error: "something went wrong" });
            console.error(err);
        });
});

const isEmpty = string => {
    if (string.trim() === "") return true;
    else return false;
};

const isEmailValid = email => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
};

// Signup Route
app.post("/signup", (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = "Email must not be empty";
    } else if (!isEmailValid(newUser.email)) {
        errors.email = "Email must be a valid email adress";
    }

    if (isEmpty(newUser.password))
        errors.password = "Password must not be empty";
    if (newUser.password !== newUser.confirmPassword)
        errors.confirmPassword = "Passwords must be the same";

    if (isEmpty(newUser.handle)) errors.handle = "Handle must not be empty";

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    // TODO Validate Data
    let token, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ handle: "this handle is already taken" });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                return res
                    .status(400)
                    .json({ email: "email is already in use" });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
});

app.post("/login", (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if (isEmpty(user.email)) errors.email = "Email must not be empty";
    if (isEmpty(user.password)) errors.password = "Password must not be empty";

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json(token);
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/wrong-password") {
                return res
                    .status(403)
                    .json({ general: "Wrong credentials, please try again." });
            }
            return res.status(500).json({ error: err.code });
        });
});

exports.api = functions.https.onRequest(app);
