const functions = require("firebase-functions");
const admin = require("firebase-admin");

const app = require("express")();
admin.initializeApp({
  credential: admin.credential.cert(require("./key.json")),
});

const config = {
  apiKey: "AIzaSyCG5JEMGZsSL4yYC-fgAatgVRtDQAn-Sws",
  authDomain: "habits-firebase-48ef6.firebaseapp.com",
  databaseURL: "https://habits-firebase-48ef6.firebaseio.com",
  projectId: "habits-firebase-48ef6",
  storageBucket: "habits-firebase-48ef6.appspot.com",
  messagingSenderId: "234852682769",
  appId: "1:234852682769:web:15cf87ed960f821f8235b0",
  measurementId: "G-QXEJMELBZL",
};


const firebase = require("firebase");
firebase.initializeApp(config);

const db = admin.firestore();

app.get("/getUsers", (req, res) => {
  db.collection("users1")
    .get()
    .then((data) => {
      let users = [];
      data.forEach((doc) => {
        users.push(doc.data());
      });
      return res.json(users);
    })
    .catch((err) => console.log(err));
});

app.post("/addUsers", (req, res) => {
  const newUser = {
    name: req.body.name,
    email: req.body.email,
    createdAt: new Date().toISOString(),
  };
  db.collection("users1")
    .add(newUser)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created sucessfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: `something went wrong` });
      console.log(err);
    });
});

// Signup route
app.post("/signup", (req, res) => {
  const newUser = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  };

  //TODO validate data
  let token, userId;
  db.doc(`/users/${newUser.name}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ name: "this name is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        name: newUser.name,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        //TODO Append token to imageUrl. Work around just add token from image in storage.
        userId,
      };
      return db.doc(`/users/${newUser.name}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already is use" });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
});

exports.api = functions.https.onRequest(app);
