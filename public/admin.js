import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE CONFIG */

const firebaseConfig = {

   apiKey: "AIzaSyDqFD8RZIRvcIKbe3UfSMiI9wN1cj0ZRl8",
    authDomain: "typing-test-50171.firebaseapp.com",
    projectId: "typing-test-50171",
    storageBucket: "typing-test-50171.firebasestorage.app",
    messagingSenderId: "526601537443",
    appId: "1:526601537443:web:54ccd4135b96f6ad2ebc16"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

/* ADMIN EMAIL */

const ADMIN_EMAIL =
  "sharanr789@gmail.com";

const totalUsersEl =
  document.getElementById("totalUsers");

const totalTestsEl =
  document.getElementById("totalTests");

const highestWpmEl =
  document.getElementById("highestWpm");

const adminScores =
  document.getElementById("adminScores");

/* SECURITY */

onAuthStateChanged(auth,user=>{

  if(!user){

    location.href="/";

    return;

  }

  if(user.email !== ADMIN_EMAIL){

    alert("Access Denied");

    location.href="/";

    return;

  }

  loadDashboard();

});

/* LOAD DASHBOARD */

async function loadDashboard(){

  const snapshot =
    await getDocs(
      collection(db,"scores")
    );

  let totalTests = 0;

  let highestWpm = 0;

  let users = new Set();

  let html = "";

  snapshot.forEach(document=>{

    const data = document.data();

    totalTests++;

    users.add(data.name);

    if(data.wpm > highestWpm){

      highestWpm = data.wpm;

    }

    html += `

      <div class="leaderboard-item">

        <span>

          ${data.name}

          (${data.wpm} WPM)

        </span>

        <button
          onclick="deleteScore('${document.id}')">

          Delete

        </button>

      </div>

    `;

  });

  totalUsersEl.innerText =
    users.size;

  totalTestsEl.innerText =
    totalTests;

  highestWpmEl.innerText =
    highestWpm;

  adminScores.innerHTML = html;

}

/* DELETE SCORE */

window.deleteScore =
async function(id){

  const confirmDelete =
    confirm(
      "Delete score?"
    );

  if(!confirmDelete){

    return;

  }

  await deleteDoc(
    doc(db,"scores",id)
  );

  loadDashboard();

}