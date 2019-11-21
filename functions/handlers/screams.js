const { db } = require('../utilities/admin');

// Get all screams
exports.getAllScreams = (req, res) => {
    db.collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    userHandle: doc.data().userHandle,
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                });
            });
            return res.json(screams);
        })
        .catch(err => console.error(err));
};

// Add one scream
exports.postOneScream = (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    };

    db.collection('screams')
        .add(newScream)
        .then(doc => {
            const resScream = newScream;
            resScream.screamId = doc.id;
            res.json(resScream);
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' });
            console.error(err);
        });
};

// Get a scream details
exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists)
                return res.status(404).json({ error: 'scream not found' });
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', req.params.screamId)
                .get();
        })
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data());
            });
            return res.json(screamData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

//comment on a scream
exports.commentOnScream = (req, res) => {
    if (req.body.body.trim() === '')
        return res.status(400).json({ error: 'Comment must not be empty' });

    const newComment = {
        screamId: req.params.screamId,
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
    };

    db.doc(`/screams/${req.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found !' });
            }
            return doc.ref.update({
                commentCount: doc.data().commentCount + 1,
            });
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            res.json(newComment);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
};

// Like a scream
exports.likeScream = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;

    screamDocument
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found !' });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        })
        .then(data => {
            if (data.empty) {
                return db
                    .collection('likes')
                    .add({
                        screamId: req.params.screamId,
                        userHandle: req.user.handle,
                    })
                    .then(() => {
                        screamData.likeCount++;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    .then(() => {
                        return res.json(screamData);
                    });
            } else {
                return res.status(400).json({ error: 'Scream already liked' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

// Unlike scream
exports.unlikeScream = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;

    screamDocument
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found !' });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        })
        .then(data => {
            if (!data.empty) {
                return db
                    .doc(`/likes/${data.docs[0].id}`)
                    .delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({
                            likeCount: screamData.likeCount,
                        });
                    })
                    .then(() => {
                        return res.json(screamData);
                    });
            } else {
                return res.status(400).json({ error: 'Scream not liked' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

// Delete Scream
exports.deleteScream = (req, res) => {
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
    // Get all the scream's likes
    const likesDocument = db
        .collection('likes')
        .where('screamId', '==', req.params.screamId);
    // Get all the scream's comment
    const commentsDocument = db
        .collection('comments')
        .where('screamId', '==', req.params.screamId);

    screamDocument
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' });
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' });
            } else {
                return likesDocument.get();
            }
        })
        .then(data => {
            // delete all the scream's likes
            if (!data.empty) {
                data.docs.forEach(elm => {
                    elm.ref.delete();
                });
            }
            return commentsDocument.get();
        })
        .then(data => {
            // delete all the scream's comments
            if (!data.empty) {
                data.docs.forEach(elm => {
                    elm.ref.delete();
                });
            }
            // delete the scream
            return screamDocument.delete();
        })
        .then(() => {
            res.json({ message: 'Scream deleted successfully' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};
