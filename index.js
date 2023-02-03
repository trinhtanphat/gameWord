(function () {
  var canvas = document.querySelector(".canvas");
  console.log(canvas);
  var ctx = canvas.getContext("2d");
  var WIDTH = 320;
  var HEIGHT = 320;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  clearCanvas();

  var particles = [];
  for (var i = 0; i < WIDTH; i++) {
    particles.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 2 + 1,
    });
  }

  function draw() {
    clearCanvas();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();

    for (let i = 0; i < WIDTH; i++) {
      let p = particles[i];
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
    }
    ctx.fill();
    update();
  }

  function update() {
    for (let i = 0; i < WIDTH; i++) {
      let p = particles[i];
      p.y += p.r;
      if (p.y > canvas.height) {
        particles[i] = {
          x: Math.random() * canvas.width,
          y: -10,
          r: p.r,
        };
      }
    }
  }
  var timer = setInterval(draw, 50);

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
})();

// ---------------------------------
function handleSlideTym() {
  var settings = {
    particles: {
      length: 500, // maximum amount of particles

      duration: 2, // particle duration in sec

      velocity: 100, // particle velocity in pixels/sec

      effect: -0.75, // play with this for a nice effect

      size: 30, // particle size in pixels
    },
  };

  /*

      * RequestAnimationFrame polyfill by Erik Möller

      */

  (function () {
    var b = 0;
    var c = ["ms", "moz", "webkit", "o"];
    for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
      window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
      window.cancelAnimationFrame =
        window[c[a] + "CancelAnimationFrame"] ||
        window[c[a] + "CancelRequestAnimationFrame"];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (h, e) {
        var d = new Date().getTime();
        var f = Math.max(0, 16 - (d - b));
        var g = window.setTimeout(function () {
          h(d + f);
        }, f);
        b = d + f;
        return g;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (d) {
        clearTimeout(d);
      };
    }
  })();

  /*

      * Point class

      */

  var Point = (function () {
    function Point(x, y) {
      this.x = typeof x !== "undefined" ? x : 0;

      this.y = typeof y !== "undefined" ? y : 0;
    }

    Point.prototype.clone = function () {
      return new Point(this.x, this.y);
    };

    Point.prototype.length = function (length) {
      if (typeof length == "undefined")
        return Math.sqrt(this.x * this.x + this.y * this.y);

      this.normalize();

      this.x *= length;

      this.y *= length;

      return this;
    };

    Point.prototype.normalize = function () {
      var length = this.length();

      this.x /= length;

      this.y /= length;

      return this;
    };

    return Point;
  })();

  /*

      * Particle class

      */

  var Particle = (function () {
    function Particle() {
      this.position = new Point();

      this.velocity = new Point();

      this.acceleration = new Point();

      this.age = 0;
    }

    Particle.prototype.initialize = function (x, y, dx, dy) {
      this.position.x = x;

      this.position.y = y;

      this.velocity.x = dx;

      this.velocity.y = dy;

      this.acceleration.x = dx * settings.particles.effect;

      this.acceleration.y = dy * settings.particles.effect;

      this.age = 0;
    };

    Particle.prototype.update = function (deltaTime) {
      this.position.x += this.velocity.x * deltaTime;

      this.position.y += this.velocity.y * deltaTime;

      this.velocity.x += this.acceleration.x * deltaTime;

      this.velocity.y += this.acceleration.y * deltaTime;

      this.age += deltaTime;
    };

    Particle.prototype.draw = function (context, image) {
      function ease(t) {
        return -t * t * t + 1;
      }

      var size = image.width * ease(this.age / settings.particles.duration);

      context.globalAlpha = 1 - this.age / settings.particles.duration;

      context.drawImage(
        image,
        this.position.x - size / 2,
        this.position.y - size / 2,
        size,
        size
      );
    };

    return Particle;
  })();

  /*

      * ParticlePool class

      */

  var ParticlePool = (function () {
    var particles,
      firstActive = 0,
      firstFree = 0,
      duration = settings.particles.duration;

    function ParticlePool(length) {
      // create and populate particle pool

      particles = new Array(length);

      for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
    }

    ParticlePool.prototype.add = function (x, y, dx, dy) {
      particles[firstFree].initialize(x, y, dx, dy);

      // handle circular queue

      firstFree++;

      if (firstFree == particles.length) firstFree = 0;

      if (firstActive == firstFree) firstActive++;

      if (firstActive == particles.length) firstActive = 0;
    };

    ParticlePool.prototype.update = function (deltaTime) {
      var i;

      // update active particles

      if (firstActive < firstFree) {
        for (i = firstActive; i < firstFree; i++)
          particles[i].update(deltaTime);
      }

      if (firstFree < firstActive) {
        for (i = firstActive; i < particles.length; i++)
          particles[i].update(deltaTime);

        for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
      }

      // remove inactive particles

      while (
        particles[firstActive].age >= duration &&
        firstActive != firstFree
      ) {
        firstActive++;

        if (firstActive == particles.length) firstActive = 0;
      }
    };

    ParticlePool.prototype.draw = function (context, image) {
      // draw active particles

      if (firstActive < firstFree) {
        for (var i = firstActive; i < firstFree; i++)
          particles[i].draw(context, image);
      }

      if (firstFree < firstActive) {
        for (var i = firstActive; i < particles.length; i++)
          particles[i].draw(context, image);

        for (i = 0; i < firstFree; i++) particles[i].draw(context, image);
      }
    };

    return ParticlePool;
  })();

  /*

      * Putting it all together

      */

  (function (canvas) {
    var context = canvas.getContext("2d"),
      particles = new ParticlePool(settings.particles.length),
      particleRate = settings.particles.length / settings.particles.duration, // particles/sec
      time;

    // get point on heart with -PI <= t <= PI

    function pointOnHeart(t) {
      return new Point(
        160 * Math.pow(Math.sin(t), 3),

        130 * Math.cos(t) -
          50 * Math.cos(2 * t) -
          20 * Math.cos(3 * t) -
          10 * Math.cos(4 * t) +
          25
      );
    }

    // creating the particle image using a dummy canvas

    var image = (function () {
      var canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

      canvas.width = settings.particles.size;

      canvas.height = settings.particles.size;

      // helper function to create the path

      function to(t) {
        var point = pointOnHeart(t);

        point.x =
          settings.particles.size / 2 +
          (point.x * settings.particles.size) / 350;

        point.y =
          settings.particles.size / 2 -
          (point.y * settings.particles.size) / 350;

        return point;
      }

      // create the path

      context.beginPath();

      var t = -Math.PI;

      var point = to(t);

      context.moveTo(point.x, point.y);

      while (t < Math.PI) {
        t += 0.01; // baby steps!

        point = to(t);

        context.lineTo(point.x, point.y);
      }

      context.closePath();

      // create the fill
      // #ea80b0
      context.fillStyle = "#df2b2b";
      context.fill();

      // create the image

      var image = new Image();

      image.src = canvas.toDataURL();

      return image;
    })();

    // render that thing!

    function render() {
      // next animation frame

      requestAnimationFrame(render);

      // update time

      var newTime = new Date().getTime() / 1000,
        deltaTime = newTime - (time || newTime);

      time = newTime;

      // clear canvas

      context.clearRect(0, 0, canvas.width, canvas.height);

      // create new particles

      var amount = particleRate * deltaTime;

      for (var i = 0; i < amount; i++) {
        var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());

        var dir = pos.clone().length(settings.particles.velocity);

        particles.add(
          canvas.width / 2 + pos.x,
          canvas.height / 2 - pos.y,
          dir.x,
          -dir.y
        );
      }

      // update and draw particles

      particles.update(deltaTime);

      particles.draw(context, image);
    }

    // handle (re-)sizing of the canvas

    function onResize() {
      canvas.width = canvas.clientWidth;

      canvas.height = canvas.clientHeight;
    }

    window.onresize = onResize;

    // delay rendering bootstrap

    setTimeout(function () {
      onResize();

      render();
    }, 10);
  })(document.getElementById("pinkboard"));
}

// ---------------------
import { words, nameUser } from "./words.js";
const wordText = document.querySelector(".word");
const questionText = document.querySelector(".question"),
  resultWord = document.querySelector(".result"),
  numberQuestion = document.querySelector(".number-question"),
  input = document.querySelector("input"),
  audioMusic = document.querySelector(".audio_music"),
  audioMusicIcon = document.querySelectorAll(".audio_music  i"),
  form = document.querySelector("form");

const timeText = document.querySelector(".time"),
  checkWord = document.querySelector(".check-word"),
  start = document.querySelector(".start"),
  textQuestion = document.querySelector(".text"),
  contents = document.querySelector(".contents"),
  container = document.querySelector(".container"),
  inputWords = document.querySelector(".input_words"),
  nameDragon = document.querySelector(".box-text .text "),
  containerContent = document.querySelector(".container-content"),
  boxDragon = document.querySelector(".box_Dragon"),
  btnDragon = document.querySelector(".btn-dragon"),
  loginUser = document.querySelector(".login_user"),
  tym = document.querySelector(".tym"),
  btnLogin = document.querySelector(".btn-login"),
  resetGame = document.querySelector(".game-reset"),
  btnTym = document.querySelector(".btn-tym"),
  valueInputLogin = document.querySelector(".login_user input"),
  btnMarry = document.querySelector(".btn_marry");

audioMusic.addEventListener("click", () => handleMusic());
let a = false;
const audio = new Audio();
const handleMusic = () => {
  a = !a;
  audio.src = "music.mp3.mp3";
  console.log(audioMusicIcon);
  if (a) {
    audioMusicIcon[0].classList.add("none");
    audioMusicIcon[1].classList.remove("none");
    audio.play();
  } else {
    audioMusicIcon[0].classList.remove("none");
    audioMusicIcon[1].classList.add("none");
    audio.pause();
  }
};
btnMarry.addEventListener("click", () => {
  contents.classList.add("none");
  containerContent.classList.remove("none");
});

start.addEventListener("click", () => handleStart());

btnLogin.addEventListener("click", () => handleSubmit());
btnDragon.addEventListener("click", () => handleDragon());
btnTym.addEventListener("click", () => handleTym());
resetGame.addEventListener("click", () => handleResetGame());
// start
function handleStart() {
  setTime();
  appWord(0);

  textQuestion.classList.remove("none");
  inputWords.classList.remove("none");
  start.classList.add("none");
  checkWord.classList.remove("none");
  checkWord.addEventListener(
    "click",
    () => (
      (checkWord.style.pointerEvent = "none"),
      inputWords.value
        ? handleCheck("start")
        : alert("không được spam kiểm tra đáp án")
    )
  );
}
function handleDragon() {
  boxDragon.classList.add("none");
  if (
    valueInputLogin.value.trim().toLowerCase() ===
      nameUser.name.trim().toLowerCase() ||
    nameUser.keyName.trim().toLowerCase()
  ) {
    handleSlideTym();
    tym.classList.remove("none");
  } else {
    form.classList.remove("none");
  }
}
let index = 0;
function handleCheck(check) {
  if (check === "start") {
    console.log("index logic", index);
    checkWord.style.pointerEvents = "none";
    let inputValue = inputWords.value.trim().toLowerCase().replace(/\s/g, "");

    let wordValue = words[index].word
      .trim()
      .toLocaleLowerCase()
      .replace(/\s/g, "");
    console.log(wordValue, inputValue);
    console.log("index logic sau +", index);

    if (wordValue === inputValue) {
      console.log("đúng");
      console.log("index truoc", index);
      wordText.innerText = words[index].word.trim().toUpperCase();
      questionText.innerText = words[index].question;
      resultWord.innerText = "Chính xác !!";
      setTimeout(() => {
        index++;
        appWord(index);
        wordText.innerText = "";
        questionText.innerText = words[index].question;
        resultWord.innerText = "";
        inputWords.value = "";
        checkWord.style.pointerEvents = "visible";
      }, 1800);
    } else {
      resultWord.innerText = "Sai rồi !!";
      inputWords.value = "";
      inputWords.focus();
      checkWord.style.pointerEvents = "visible";
    }
  } else if (check === "reset") {
    index = 0;
    checkWord.style.pointerEvents = "none";
    let inputValue = inputWords.value.trim().toLowerCase().replace(/\s/g, "");

    let wordValue = words[index].word
      .trim()
      .toLocaleLowerCase()
      .replace(/\s/g, "");
    console.log(wordValue, inputValue);

    if (wordValue === inputValue) {
      wordText.innerText = words[index].word.trim().toUpperCase();
      questionText.innerText = words[index].question;
      resultWord.innerText = "Chính xác !!";
      setTimeout(() => {
        index++;
        appWord(index);
        wordText.innerText = "";
        questionText.innerText = words[index].question;
        resultWord.innerText = "";
        inputWords.value = "";
        checkWord.style.pointerEvents = "visible";
      }, 1800);
    }
    if (inputWords.value === "") {
      resultWord.innerText = " ";
      checkWord.style.pointerEvents = "visible";
    } else {
      resultWord.innerText = "Sai rồi !!";
      inputWords.value = "";
      inputWords.focus();
      checkWord.style.pointerEvents = "visible";
    }
  }
}
function handleResetGame() {
  resetGame.classList.add("none");
  checkWord.classList.remove("none");
  appWord(0);
  setTime();
  handleCheck("reset");
  inputWords.classList.remove("none");
  inputWords.value = "";
  inputWords.focus();
}
function handleSubmit() {
  if (
    valueInputLogin.value.trim().length > 3 ||
    Number.isNaN(valueInputLogin.value.trim())
  ) {
    loginUser.classList.add("none");
    contents.classList.remove("none");
  } else if (valueInputLogin.value.trim() === "") {
    alert("Bạn chưa nhập tên");
  } else {
    alert("bạn nhập sai tên");
  }
}
function appWord(index) {
  console.log("app ", index);
  if (index < words.length) {
    questionText.innerText = words[index].question;
    wordText.innerText = "";
    resultWord.innerText = "";
    numberQuestion.innerText = `Câu hỏi ${index + 1}/${words.length}`;
  } else if (index === words.length) {
    container.classList.add("none");
    nameDragon.innerText = valueInputLogin.value;
    boxDragon.classList.remove("none");
  }
}
function setTime() {
  let maxTime = 150;
  let time = setInterval(() => {
    if (maxTime > 0) {
      maxTime--;
      timeText.innerText = maxTime + "s";
    } else {
      resultWord.innerText = "Hết thời gian !";
      inputWords.classList.add("none");
      checkWord.classList.add("none");
      resetGame.classList.remove("none");
      clearInterval(time);
    }
  }, 1000);

  return time;
}
function handleTym() {
  tym.classList.add("none");
  nameDragon.innerText = valueInputLogin.value;
  form.classList.remove("none");
}
("use strict");

let canvas, width, height, ctx;
let fireworks = [];
let particles = [];

function setup() {
  canvas = document.getElementById("canvas");
  setSize(canvas);
  ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  fireworks.push(new Firework(Math.random() * (width - 100) + 100));
  window.addEventListener("resize", windowResized);
  document.addEventListener("click", onClick);
}

setTimeout(setup, 1);

function loop() {
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  for (let i = 0; i < fireworks.length; i++) {
    let done = fireworks[i].update();
    fireworks[i].draw();
    if (done) fireworks.splice(i, 1);
  }

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].lifetime > 80) particles.splice(i, 1);
  }

  if (Math.random() < 1 / 60)
    fireworks.push(new Firework(Math.random() * (width - 200) + 100));
}
setInterval(loop, 1 / 60);
//setInterval(loop, 100/60);
class Particle {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.vel = randomVec(2);
    this.lifetime = 0;
  }

  update() {
    this.x += this.vel.x;
    this.y += this.vel.y;
    this.vel.y += 0.02;
    this.vel.x *= 0.99;
    this.vel.y *= 0.99;
    this.lifetime++;
  }

  draw() {
    ctx.globalAlpha = Math.max(1 - this.lifetime / 80, 0);
    ctx.fillStyle = this.col;
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}

class Firework {
  constructor(x) {
    this.x = x;
    this.y = height;
    this.isBlown = false;
    this.col = randomCol();
  }

  update() {
    this.y -= 3;
    if (this.y < 350 - Math.sqrt(Math.random() * 500) * 40) {
      this.isBlown = true;
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(this.x, this.y, this.col));
      }
    }
    return this.isBlown;
  }

  draw() {
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.col;
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}

function randomCol() {
  var letter = "0123456789ABCDEF";
  var nums = [];

  for (var i = 0; i < 3; i++) {
    nums[i] = Math.floor(Math.random() * 256);
  }

  let brightest = 0;
  for (var i = 0; i < 3; i++) {
    if (brightest < nums[i]) brightest = nums[i];
  }

  brightest /= 255;
  for (var i = 0; i < 3; i++) {
    nums[i] /= brightest;
  }

  let color = "#";
  for (var i = 0; i < 3; i++) {
    color += letter[Math.floor(nums[i] / 16)];
    color += letter[Math.floor(nums[i] % 16)];
  }
  return color;
}

function randomVec(max) {
  let dir = Math.random() * Math.PI * 2;
  let spd = Math.random() * max;
  return { x: Math.cos(dir) * spd, y: Math.sin(dir) * spd };
}

function setSize(canv) {
  canv.style.width = innerWidth + "px";
  canv.style.height = innerHeight + "px";
  width = innerWidth;
  height = innerHeight;

  canv.width = innerWidth * window.devicePixelRatio;
  canv.height = innerHeight * window.devicePixelRatio;
  canvas
    .getContext("2d")
    .scale(window.devicePixelRatio, window.devicePixelRatio);
}

function onClick(e) {
  fireworks.push(new Firework(e.clientX));
}

function windowResized() {
  setSize(canvas);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
}

//
