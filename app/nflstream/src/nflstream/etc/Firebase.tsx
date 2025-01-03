import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
  Database,
  get,
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  set,
} from "firebase/database";
import React from "react";

var initialized = false;
var database: Database;
type ResultType = { val: () => BlobType | null };
type BlobType = any;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBwbpV7vb8U-4xKsViCZZ3MVoiUOLrlkw",
  authDomain: "nflstream.firebaseapp.com",
  databaseURL: "https://nflstream-default-rtdb.firebaseio.com",
  projectId: "nflstream",
  storageBucket: "nflstream.appspot.com",
  messagingSenderId: "240735247504",
  appId: "1:240735247504:web:ba802c87e43087169f0c15",
  measurementId: "G-KTTBDNJXF3",
};

function initialize() {
  if (initialized) return;
  initialized = true;

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  const analytics = getAnalytics(app);
  console.log("firebase", analytics);
}

function __ref(path: string) {
  return ref(database, `/${firebaseConfig.projectId}/${path}`);
}

function _connect(path: string, callback: (value: BlobType) => void): void {
  onValue(__ref(path), (snapshot: ResultType) => {
    var val = snapshot.val();
    console.log("firebase", Date.now() / 1000, window.location.href, val);
    callback(val);
  });
}

function _get(path: string): BlobType {
  return get(__ref(path));
}

function _set(path: string, obj: BlobType): Promise<void> {
  return set(__ref(path), obj);
}

function _push(path: string, obj: BlobType): Promise<string> {
  return push(__ref(path), obj).then((pushed) => pushed.key!);
}

function _delete(path: string): Promise<void> {
  return remove(__ref(path));
}

abstract class FirebaseWrapper<T, U = {}> extends React.Component<
  U,
  { state: T }
> {
  static firebaseWrapperComponent: FirebaseWrapper<any, any>;
  componentDidMount() {
    const oldComponent = FirebaseWrapper.firebaseWrapperComponent;
    FirebaseWrapper.firebaseWrapperComponent = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    } else {
      initialize();
      _connect(this.getFirebasePath(), (state) =>
        FirebaseWrapper.firebaseWrapperComponent.setState.bind(
          FirebaseWrapper.firebaseWrapperComponent
        )({ state })
      );
    }
  }

  abstract getFirebasePath(): string;

  render() {
    return <pre>{JSON.stringify(this.state?.state, null, 2)}</pre>;
  }
}

const ex = {
  initialize,
  FirebaseWrapper,
  _connect,
  _get,
  _set,
  _push,
  _delete,
};

export default ex;
