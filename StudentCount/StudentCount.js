// TUNIO 2020
// Tracker to show how many students we have reached
// Going to add plot over time soon ...

function setup() {
  createCanvas(1280, 480);
  background(200);
}


function draw() {
  textAlign(CENTER);
  textSize(142);
  fill(255);
  stroke(0);
  strokeWeight(6);
  text("150", width/2, height/2);
  text("Learners Reached", width/2, height/2 + 200);
  noFill();
  rect(width/10, height/5, width - 2*width/10 , height - 3* height/5);
  noLoop();
  rect(0,0,width,height);
}
