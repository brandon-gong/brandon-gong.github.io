NUM_PARTICLES = 8000;
particles = [];
let bg, bgc, fgc, tc, fg;
let logo;

function preload() {
  logo = loadImage("https://raw.githubusercontent.com/brandon-gong/processing-sketches/master/logo/logo_m_black.png");
}
function setup() {
  let x = createCanvas(800, 800);
  bgc = color(0, 0, 0);
  fgc = color(140,140,140);
  tc = color(255,255,255);
  fill(0, 0, 0, 2);

  for(let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }

  fg = createGraphics(width, height);
  fg.background(0);


  bg = createGraphics(width, height);
  bg.image(logo, width/2 - 128, height/2 - 128);
  bg.loadPixels();

  x.parent('animation-container');

}

z = 0;
noiseScl = 0.02;
framecounter = 0;

function draw() {

  fg.fill(0,5);
  fg.noStroke();
  fg.rect(0,0,width, height);
  image(fg, 0, 0);
  //image(bg, 0, 0);

  // stroke(bgc);
  // rect(0, 0, width, height);
  // stroke(fgc);
  z += 0.01;

  for(let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].trace();
    particles[i].wrap();
  }
}

class Particle {

  constructor() {
    this.init();
  }

  init() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.prevpos = this.pos.copy();
    this.age = random(200);
  }

  show() {
    fg.ellipse(this.pos.x, this.pos.y, 5, 5);
  }
  trace() {
    fg.line(this.prevpos.x, this.prevpos.y, this.pos.x, this.pos.y);
    fg.stroke(fgc);
  }
  update() {
    if(this.age > 500) this.init();
    if(bg.get(this.pos.x, this.pos.y)[3] > 127) {
      let force = p5.Vector.fromAngle(random(1) * TWO_PI - PI);
      force.setMag(1);
      this.acc.add(force);
      this.vel.add(this.acc);
      fg.stroke(tc);
    } else {
      let force = p5.Vector.fromAngle(noise(this.pos.x * noiseScl, this.pos.y*noiseScl, z) * TWO_PI);
      force.setMag(0.1);
      this.acc.add(force);
      this.vel.add(this.acc);
    }
    this.vel.limit(1);
    this.updatePrevious();
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.age++;
  }

  wrap() {
    if(this.pos.x < 0 || this.pos.y < 0 || this.pos.x > width || this.pos.y > height){
      this.pos.y = random(height);
      this.pos.x = random(width);
      this.updatePrevious();
    }
  }
  updatePrevious() {
    this.prevpos.x = this.pos.x;
    this.prevpos.y = this.pos.y;
  }

}
