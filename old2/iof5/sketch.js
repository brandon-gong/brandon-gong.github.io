function preload() {
  inconsolata = loadFont('typestarblack.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(inconsolata);
  textSize(20);
  textAlign(CENTER, CENTER);
  noStroke();
}

let drawAngles = false;
let drawAtomNames = false;

function keyPressed() {
  if (keyCode == 65) drawAngles = !drawAngles;
  if (keyCode == 78) drawAtomNames = !drawAtomNames;
}

function draw() {
  background(50);
  orbitControl(5, 5);

  if (drawAngles) {
    push();
    rotateY(-PI / 4);
    fill(66, 161, 245);
    arc(0, 0, 150, 150, atan(40 / 100) - 0.1, PI / 2, PIE);
    text("<90°", 70, 70);
    pop();

    push();
    rotateY(PI / 4);
    fill(66, 161, 245);
    arc(0, 0, 150, 150, -PI / 2, atan(40 / 100) - 0.1, PIE);
    text(">90°", 70, -70);
    pop();

    push();
    rotateX(PI / 2);
    rotateY(-0.4);
    rotateZ(3 * PI / 4);
    fill(66, 161, 245);
    arc(0, 0, 150, 150, 0, PI / 2, PIE);
    text("<90°", 70, 70);
    pop();
  }

  if (drawAtomNames) {
    fill(255);
    text("Iodine", 80, 0);
    push();
    translate(0, -120, 0);
    rotateZ(-PI / 2);
    text("Oxygen", 70, 0);
    pop();

    push();
    translate(0, 150, 0);
    rotateZ(PI / 2);
    text("Fluorine", 70, 0);
    pop();


    push();
    translate(100, 40, 100);
    rotateY(PI / 4);
    rotateX(atan(100 / 40) + 0.1);
    rotateZ(PI / 2);
    text("Fluorine", 70, 0);
    pop();
    push();
    translate(-100, 40, 100);
    rotateY(-PI / 4);
    rotateX(atan(100 / 40) + 0.1);
    rotateZ(PI / 2);
    text("Fluorine", 70, 0);
    pop();

    push();
    translate(-100, 40, -100);
    rotateY(PI / 4);
    rotateX(-atan(100 / 40) - 0.1);
    rotateZ(PI / 2);
    text("Fluorine", 70, 0);
    pop();
    push();
    translate(100, 40, -100);
    rotateY(-PI / 4);
    rotateX(-atan(100 / 40) - 0.1);
    rotateZ(PI / 2);
    text("Fluorine", 70, 0);
    pop();

  }

  ambientLight(160);
  pointLight(255, 255, 255, mouseX - width / 2, mouseY - height / 2, 100);

  push();
  ambientMaterial(150, 40, 150);
  sphere(40);
  pop();

  push();
  translate(0, -120, 0);
  ambientMaterial(250, 0, 0);
  sphere(30);
  pop();

  push();
  translate(100, 40, 100);
  ambientMaterial(131, 196, 0);
  sphere(20);
  pop();

  push();
  translate(-100, 40, 100);
  ambientMaterial(131, 196, 0);
  sphere(20);
  pop();

  push();
  translate(-100, 40, -100);
  ambientMaterial(131, 196, 0);
  sphere(20);
  pop();

  push();
  translate(100, 40, -100);
  ambientMaterial(131, 196, 0);
  sphere(20);
  pop();

  push();
  translate(0, 150, 0);
  ambientMaterial(131, 196, 0);
  sphere(20);
  pop();

  push();
  translate(0, 150 / 2, 0);
  ambientMaterial(250, 250, 250);
  cylinder(4, 150);
  pop();

  push();
  translate(-7, -60, 0);
  ambientMaterial(250, 250, 250);
  cylinder(4, 120);
  pop();
  push();
  translate(7, -60, 0);
  ambientMaterial(250, 250, 250);
  cylinder(4, 120);
  pop();

  push();
  translate(50, 20, 50);
  rotateY(PI / 4);
  rotateX(atan(100 / 40) + 0.1);
  ambientMaterial(250, 250, 250);
  cylinder(4, 150);
  pop();

  push();
  translate(-50, 20, 50);
  rotateY(-PI / 4);
  rotateX(atan(100 / 40) + 0.1);
  ambientMaterial(250, 250, 250);
  cylinder(4, 150);
  pop();

  push();
  translate(-50, 20, -50);
  rotateY(PI / 4);
  rotateX(-(atan(100 / 40) + 0.1));
  ambientMaterial(250, 250, 250);
  cylinder(4, 150);
  pop();

  push();
  translate(50, 20, -50);
  rotateY(-PI / 4);
  rotateX(-(atan(100 / 40) + 0.1));
  ambientMaterial(250, 250, 250);
  cylinder(4, 150);
  pop();


  //  

  //   push();
  //   translate(-width / 4, -height / 4, 0);
  //   rotateZ(frameCount * 0.01);
  //   rotateX(frameCount * 0.01);
  //   rotateY(frameCount * 0.01);
  //   fill(250, 0, 0);
  //   torus(80, 20, 64, 64);
  //   pop();

  //   push();
  //   translate(width / 4, -height / 4, 0);
  //   rotateZ(frameCount * 0.01);
  //   rotateX(frameCount * 0.01);
  //   rotateY(frameCount * 0.01);
  //   normalMaterial();
  //   torus(80, 20, 64, 64);
  //   pop();

  //   push();
  //   translate(-width / 4, height / 4, 0);
  //   rotateZ(frameCount * 0.01);
  //   rotateX(frameCount * 0.01);
  //   rotateY(frameCount * 0.01);
  //   ambientMaterial(250);
  //   torus(80, 20, 64, 64);
  //   pop();

  //   push();
  //   translate(width / 4, height / 4, 0);
  //   rotateZ(frameCount * 0.01);
  //   rotateX(frameCount * 0.01);
  //   rotateY(frameCount * 0.01);
  //   specularMaterial(250);
  //   torus(80, 20, 64, 64);
  //   pop();
}