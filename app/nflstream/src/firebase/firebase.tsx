// https://console.firebase.google.com/u/0/project/nflstream/database/nflstream-default-rtdb/data

import firebase from "firebase/app";
import "firebase/database";

const project = "nflstream";

const config = {
  databaseURL: `https://${project}-default-rtdb.firebaseio.com/`,
};

var database: { ref: (path: string) => any };
type ResultType = { val: () => BlobType | null };
type BlobType = any;

var initialized = false;
function _init(): void {
  if (initialized) return;
  initialized = true;
  try {
    firebase.initializeApp(config);
  } catch {}
  database = firebase.database();
}

function _push(path: string, obj: BlobType): void {
  database.ref(`${path}`).push(obj);
}

function _connect(path: string, callback: (value: BlobType) => void): void {
  database.ref(`${path}`).on("value", (snapshot: ResultType) => {
    var val = snapshot.val();
    console.log("firebase", val);
    callback(val);
  });
}

function _set(path: string, obj: BlobType, message: string = ""): void {
  database.ref(`${path}`).set(obj);
}

const ex = { _init, _push, _connect, _set };
export default ex;
