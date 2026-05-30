const keySound = new Audio("sounds/key.mp3");

const quote = document.getElementById("quote");
const input = document.getElementById("input");

const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const mistakesEl = document.getElementById("mistakes");

const restartBtn = document.getElementById("restart");
const themeBtn = document.getElementById("theme");

const quoteCategory =
  document.getElementById("quoteCategory");

const container =
  document.querySelector(".container");

let currentText = "";

let time = 60;
let timerStarted = false;
let countdownInterval = null;

/* =========================================================
   LOAD QUOTE
========================================================= */

async function loadParagraph() {

  quote.innerHTML = "Loading quote...";

  const category =
    quoteCategory?.value || "all";

  try {

    const response =
      await fetch(
        "https://dummyjson.com/quotes"
      );

    const data =
      await response.json();

    let quotes =
      data.quotes;

    if(category === "motivation"){

      quotes = quotes.filter(q =>

        q.quote.toLowerCase().includes("dream") ||

        q.quote.toLowerCase().includes("goal") ||

        q.quote.toLowerCase().includes("future") ||

        q.quote.toLowerCase().includes("work")

      );

    }

    if(category === "success"){

      quotes = quotes.filter(q =>

        q.quote.toLowerCase().includes("success")

      );

    }

    if(category === "life"){

      quotes = quotes.filter(q =>

        q.quote.toLowerCase().includes("life")

      );

    }

    if(category === "technology"){

      quotes = quotes.filter(q =>

        q.quote.toLowerCase().includes("technology") ||

        q.quote.toLowerCase().includes("computer") ||

        q.quote.toLowerCase().includes("science")

      );

    }

    if(quotes.length === 0){

      quotes = data.quotes;

    }

    const randomQuote =

      quotes[
        Math.floor(
          Math.random() * quotes.length
        )
      ];

    currentText =
      randomQuote.quote;

  } catch(error){

    console.error(error);

    currentText =
      "Typing practice improves speed and accuracy over time.";

  }

  quote.innerHTML = "";

  currentText.split("").forEach((char,index)=>{

    const span =
      document.createElement("span");

    span.innerText = char;

    if(index === 0){

      span.classList.add("current");

    }

    quote.appendChild(span);

  });

}

/* =========================================================
   RESET TEST
========================================================= */

async function resetTest() {

  clearInterval(countdownInterval);

  timerStarted = false;
  time = 60;

  timeEl.innerText = time;
  wpmEl.innerText = "0";
  accuracyEl.innerText = "100%";
  mistakesEl.innerText = "0";

  input.disabled = false;
  input.value = "";

  container.classList.remove(
    "active-typing"
  );

  await loadParagraph();

  input.focus();

}

/* =========================================================
   GLOBAL FOCUS
========================================================= */

/* =========================================================
   SMART FOCUS
========================================================= */

document.addEventListener("click", (e) => {

  const isControl =

    e.target.closest(".buttons") ||

    e.target.closest(".quote-controls") ||

    e.target.closest(".auth-buttons");

  if (isControl) {

    return;

  }

  if (!input.disabled) {

    input.focus();

  }

});

/* =========================================================
   TIMER
========================================================= */

function startTimer(){

  countdownInterval =
    setInterval(()=>{

      if(time > 0){

        time--;

        timeEl.innerText = time;

      }

      if(time <= 0){

        endTest();

      }

    },1000);

}

/* =========================================================
   END TEST
========================================================= */

function endTest(){

  clearInterval(
    countdownInterval
  );

  input.disabled = true;

  container.classList.remove(
    "active-typing"
  );

  if(typeof saveScore ===
    "function"){

    saveScore(

      Number(
        wpmEl.innerText
      ),

      accuracyEl.innerText

    );

  }

}

/* =========================================================
   INPUT EVENT
========================================================= */

input.addEventListener(
  "input",
  ()=>{

    keySound.currentTime = 0;

    keySound.play()
      .catch(()=>{});

    if(!timerStarted){

      timerStarted = true;

      startTimer();

    }

    if(
      input.value.length > 0
    ){

      container.classList.add(
        "active-typing"
      );

    }else{

      container.classList.remove(
        "active-typing"
      );

    }

    const chars =
      quote.querySelectorAll(
        "span"
      );

    const typed =
      input.value.split("");

    let mistakes = 0;

    chars.forEach(
      (char,index)=>{

        char.classList.remove(
          "correct",
          "incorrect",
          "current"
        );

        if(
          typed[index] == null
        ){

          if(
            index ===
            typed.length
          ){

            char.classList.add(
              "current"
            );

          }

        }else if(

          typed[index] ===
          char.innerText

        ){

          char.classList.add(
            "correct"
          );

        }else{

          char.classList.add(
            "incorrect"
          );

          mistakes++;

        }

      }
    );

    mistakesEl.innerText =
      mistakes;

    const correctChars =

      Math.max(
        0,
        typed.length -
        mistakes
      );

    const accuracy =

      typed.length

      ?

      (
        correctChars /
        typed.length
      ) * 100

      :

      100;

    accuracyEl.innerText =

      accuracy.toFixed(0)

      + "%";

    const minutes =

      (60 - time) / 60;

    const wpm =

      minutes > 0

      ?

      Math.round(
        (typed.length / 5)
        / minutes
      )

      :

      0;

    wpmEl.innerText =
      wpm;

    if(
      typed.length >=
      currentText.length
    ){

      endTest();

    }

  }
);

/* =========================================================
   RESTART
========================================================= */

restartBtn.addEventListener(
  "click",
  async ()=>{

    await resetTest();

  }
);

/* =========================================================
   CATEGORY CHANGE
========================================================= */

if (quoteCategory) {

  quoteCategory.addEventListener(
    "change",
    async () => {

      input.blur();

      await resetTest();

    }
  );

}

/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener(
  "click",
  ()=>{

    document.body.classList.toggle(
      "light-theme"
    );

    localStorage.setItem(

      "theme",

      document.body
        .classList
        .contains(
          "light-theme"
        )

        ?

        "light"

        :

        "dark"

    );

  }
);

if(
  localStorage.getItem(
    "theme"
  ) === "light"
){

  document.body.classList.add(
    "light-theme"
  );

}

/* =========================================================
   START APP
========================================================= */

(async ()=>{

  await resetTest();

  input.focus();

})();