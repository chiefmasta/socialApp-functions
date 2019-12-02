const { admin, db } = require('../utilities/admin');

const config = require('../utilities/config');

const firebase = require('firebase');

const {
    validateSignUpData,
    validateLogInData,
    reduceUserDetails,
} = require('../utilities/validators');

firebase.initializeApp(config);

// Sign user up
exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    const { valid, error } = validateSignUpData(newUser);

    if (!valid) return res.status(400).json(errors);

    const defaultImg = 'default-avatar.jpg';

    let token, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ handle: 'this handle is already taken' });
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
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImg}?alt=media`,
                userId,
            };
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res
                    .status(400)
                    .json({ email: 'email is already in use' });
            } else {
                return res.status(500).json({
                    general: 'Something went wrong, please try again',
                });
            }
        });
};

// Log user in
exports.signIn = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    const { valid, error } = validateLogInData(user);

    if (!valid) return res.status(400).json(errors);

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
            return res
                .status(403)
                .json({ general: 'Wrong credentials, please try again.' });
        });
};

// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`)
        .update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Get any user's datails
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.user = doc.data();
                return db
                    .collection('screams')
                    .where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get()
                    .then(data => {
                        userData.screams = [];
                        data.forEach(doc => {
                            userData.screams.push({
                                body: doc.data().body,
                                createdAt: doc.data().createdAt,
                                userHandle: doc.data().userHandle,
                                userImage: doc.data().userImage,
                                likeCount: doc.data().likeCount,
                                commentCount: doc.data().commentCount,
                                screamId: doc.id,
                            });
                        });
                        return res.json(userData);
                    });
            } else {
                return res.status(404).json({ errror: 'User not found' });
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db
                    .collection('likes')
                    .where('userHandle', '==', req.user.handle)
                    .get();
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data());
            });
            return db
                .collection('notifications')
                .where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        })
        .then(data => {
            userData.notifications = [];
            data.forEach(doc => {
                userData.notifications.push({
                    recipent: doc.data().recipent,
                    sender: doc.data().sender,
                    read: doc.data().read,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    createdAt: doc.data().createdAt,
                });
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Upload a profile image for the user
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    // The os module provides operating system-related utility methods and properties.
    const os = require('os');
    // The fs module provides an API for interacting with the file system.
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToUpload = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' });
        }
        // Get the ext of the file :
        // for example my.image.png we need to get the 'png' only
        const imageExtension = filename.split('.')[
            filename.split('.').length - 1
        ];
        // generate a random name for the image to upload
        imageFileName = `${Math.round(
            Math.random() * 1000000000000
        )}.${imageExtension}`;
        // os.tmpdir : Returns the operating system's default directory for temporary files as a string.
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToUpload = {
            filePath,
            mimetype,
        };
        file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToUpload.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToUpload.mimetype,
                    },
                },
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
            })
            .then(() => {
                return res.json({ message: 'Image uploaded successfully' });
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: err.code });
            });
    });
    busboy.end(req.rawBody);
};

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, { read: true });
    });
    batch
        .commit()
        .then(() => {
            return res.json({ message: 'Notifications marked read' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};
