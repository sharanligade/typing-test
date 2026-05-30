import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

  getAuth,

  GoogleAuthProvider,

  signInWithPopup,

  signOut,

  onAuthStateChanged,

  setPersistence,

  browserLocalPersistence

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

  getFirestore,

  collection,

  addDoc,

  getDocs,

  query,

  orderBy,

  limit,

  serverTimestamp,

  doc,

  getDoc,

  setDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

  apiKey: "AIzaSyDqFD8RZIRvcIKbe3UfSMiI9wN1cj0ZRl8",

  authDomain: "typing-test-50171.firebaseapp.com",

  projectId: "typing-test-50171",

  storageBucket: "typing-test-50171.firebasestorage.app",

  messagingSenderId: "526601537443",

  appId: "1:526601537443:web:54ccd4135b96f6ad2ebc16"

};

/* =========================================================
   INIT
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider =
  new GoogleAuthProvider();

/* =========================================================
   DOM
========================================================= */

const loginBtn =
  document.getElementById("login");

const logoutBtn =
  document.getElementById("logout");

const username =
  document.getElementById("username");

const profilePic =
  document.getElementById("profilePic");

const leaderboardList =
  document.getElementById("leaderboardList");

const bestWpmEl =
  document.getElementById("bestWpm");

const avgAccuracyEl =
  document.getElementById("avgAccuracy");

const testsCompletedEl =
  document.getElementById("testsCompleted");

const defaultImage =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

let currentUser = null;

/* =========================================================
   PERSIST LOGIN
========================================================= */

await setPersistence(

  auth,

  browserLocalPersistence

);

/* =========================================================
   LOGIN
========================================================= */

loginBtn.addEventListener(

  "click",

  async ()=>{

    try {

      loginBtn.disabled = true;

      loginBtn.innerText =
        "Loading...";

      const result =
        await signInWithPopup(

          auth,

          provider

        );

      currentUser =
        result.user;

    } catch(error){

      console.error(error);

      alert(error.message);

    } finally {

      loginBtn.disabled = false;

      loginBtn.innerText =
        "Login";

    }

  }

);

/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener(

  "click",

  async ()=>{

    try {

      await signOut(auth);

    } catch(error){

      console.error(error);

    }

  }

);

/* =========================================================
   USER STATS
========================================================= */

async function loadUserStats(uid){

  if(!bestWpmEl) return;

  const userRef =
    doc(db,"users",uid);

  const userSnap =
    await getDoc(userRef);

  if(!userSnap.exists()){

    bestWpmEl.innerText = "0";

    avgAccuracyEl.innerText =
      "0%";

    testsCompletedEl.innerText =
      "0";

    return;

  }

  const data =
    userSnap.data();

  bestWpmEl.innerText =
    data.bestWpm || 0;

  avgAccuracyEl.innerText =
    (data.avgAccuracy || 0) + "%";

  testsCompletedEl.innerText =
    data.testsCompleted || 0;

}

/* =========================================================
   AUTH OBSERVER
========================================================= */

onAuthStateChanged(

  auth,

  async user=>{

    if(user){

      currentUser = user;

      username.innerText =
        user.displayName ||
        "Anonymous";

      profilePic.src =
        user.photoURL ||
        defaultImage;

      loginBtn.style.display =
        "none";

      logoutBtn.style.display =
        "inline-flex";

      await loadUserStats(
        user.uid
      );

    }else{

      currentUser = null;

      username.innerText =
        "Guest";

      profilePic.src =
        defaultImage;

      loginBtn.style.display =
        "inline-flex";

      logoutBtn.style.display =
        "none";

    }

  }

);

/* =========================================================
   SAVE SCORE
========================================================= */

let canSave = true;

window.saveScore =
async function(

  wpm,

  accuracy

){

  if(!currentUser){

    alert(
      "Please login first to save score."
    );

    return;

  }

  if(!canSave){

    return;

  }

  if(wpm > 300 || wpm < 0){

    return;

  }

  canSave = false;

  setTimeout(()=>{

    canSave = true;

  },5000);

  try {

    const accuracyNum =

      Number(

        accuracy.replace(
          "%",
          ""
        )

      );

    await addDoc(

      collection(db,"scores"),

      {

        name:
          currentUser.displayName
          || "Anonymous",

        photo:
          currentUser.photoURL
          || defaultImage,

        wpm:Number(wpm),

        accuracy:
          accuracyNum,

        created:
          serverTimestamp()

      }

    );

    const userRef =

      doc(
        db,
        "users",
        currentUser.uid
      );

    const userSnap =

      await getDoc(userRef);

    if(!userSnap.exists()){

      await setDoc(

        userRef,

        {

          uid:
            currentUser.uid,

          name:
            currentUser.displayName,

          bestWpm:
            Number(wpm),

          avgAccuracy:
            accuracyNum,

          highestAccuracy:
            accuracyNum,

          testsCompleted:
            1

        }

      );

    }else{

      const old =
        userSnap.data();

      const tests =

        old.testsCompleted + 1;

      const avg =

        (

          old.avgAccuracy *

          old.testsCompleted

          +

          accuracyNum

        ) / tests;

      await setDoc(

        userRef,

        {

          uid:
            currentUser.uid,

          name:
            currentUser.displayName,

          bestWpm:
            Math.max(
              old.bestWpm,
              Number(wpm)
            ),

          avgAccuracy:
            Number(
              avg.toFixed(1)
            ),

          highestAccuracy:
            Math.max(
              old.highestAccuracy,
              accuracyNum
            ),

          testsCompleted:
            tests

        }

      );

    }

    await loadUserStats(
      currentUser.uid
    );

    loadLeaderboard();

  } catch(error){

    console.error(error);

  }

};

/* =========================================================
   LEADERBOARD
========================================================= */

async function loadLeaderboard(){

  leaderboardList.innerHTML =
    "";

  try {

    const q = query(

      collection(db,"scores"),

      orderBy("wpm","desc"),

      limit(10)

    );

    const snapshot =

      await getDocs(q);

    let html = "";

    let rank = 1;

    snapshot.forEach(doc=>{

      const data =
        doc.data();

      html += `

      <div class="leaderboard-item">

        <span>

          #${rank}
          ${data.name}

        </span>

        <strong>

          ${data.wpm} WPM

        </strong>

      </div>

      `;

      rank++;

    });

    leaderboardList.innerHTML =
      html;

  } catch(error){

    console.error(error);

  }

}

/* =========================================================
   START
========================================================= */

loadLeaderboard();