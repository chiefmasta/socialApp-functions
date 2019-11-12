const { db } = require("../utilities/admin");

// Get all screams
exports.getAllScreams = (req, res) => {
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
};

// Add one scream
exports.postOneScream = (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
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
};

// Get a scream details
exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists)
                return res.status(404).json({ error: "scream not found" });
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db
                .collection("comments")
                .orderBy("createdAt", "desc")
                .where("screamId", "==", req.params.screamId)
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
    if (req.body.body.trim() === "")
        return res.status(400).json({ error: "Comment must not be empty" });

    const newComment = {
        screamId: req.params.screamId,
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString()
    };

    db.doc(`/screams/${req.params.screamId}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found !" });
            }
            return db.collection("comments").add(newComment);
        })
        .then(() => {
            res.json(newComment);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Something went wrong" });
        });
};
