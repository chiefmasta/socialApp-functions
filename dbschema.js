let db = {
    users: [
        {
            userId: 'dh23ggj5h32g543j5gf43',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2019-11-11T23:23:14.377Z',
            imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
            bio: 'Hello, my name is user, nice to meet you',
            website: 'https://user.com',
            location: 'Casablanca, MA',
        },
    ],
    screams: [
        {
            userHandle: 'user',
            userImage:
                'https://firebasestorage.googleapis.com/v0/b/socialapp-87edf.appspot.com/o/856648942795.jpg?alt=media',
            body: 'This is a sample scream',
            createdAt: '2019-11-11T23:23:14.377Z',
            likeCount: 5,
            commentCount: 3,
        },
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'kdjsfgdksuufhgkdsufky',
            body: 'nice one mate!',
            createdAt: '2019-03-15T10:59:52.798Z',
        },
    ],
    notifications: [
        {
            recipent: 'user',
            sender: 'Anass',
            read: 'True | False',
            screamId: 'kdjsfgdksuufhgkdsufky',
            type: 'like | comment',
            createdAt: '2019-11-11T23:23:14.377Z',
        },
    ],
};
const userDetails = {
    // Redux data
    credentials: {
        userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2019-11-11T23:23:14.377Z',
        imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
        bio: 'Hello, my name is user, nice to meet you',
        website: 'https://user.com',
        location: 'Casablanca, MA',
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'hh7O5oWfWucVzGbHH2pa',
        },
        {
            userHandle: 'user',
            screamId: '3IOnFoQexRcofs5OhBXO',
        },
    ],
};
