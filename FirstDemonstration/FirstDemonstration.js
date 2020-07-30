// TUNIO 2020
// First Demonstration of 'Distance Learning in Low-Bandwidth Areas'
// (A very rough first exploration into how this might work)
// 
//
//
// Core libraries used are:
//  [BASE]:                  p5js       -  https://p5js.org/
//  [BODY & HEAD TRACKING]:  poseNet    -  https://github.com/tensorflow/tfjs-models/tree/master/posenet
//  [FACE TRACKING]:         clmtrackr  -  https://github.com/auduno/clmtrackrp5js
//
//
//
// license: GPL v3
// contact: tuniomurtaza at gmail dot com


let video; // p5js variable to store video feed

let poseNet; // PoseNet: holds PoseNet pose detection method
let pose; // PoseNet: holds the pose (keypoints on body and face) array from PoseNet
let skeleton; // PoseNet: holds skeleton (connected keypoints on body) array from PoseNet

var ctracker; // clmtrackr: Holds clm.tracker() object for face detection
var positions = []; // clmtrackr: Holds key points detected on face

let skelshow = 0;// Count of number of points used to create skeleton
let faceshow = 0; // Count of number of points used to track face


function setup() {
  // setup canvas
  var cnv = createCanvas(1280, 480);
  cnv.position(0, 0);

  // setup camera capture
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.position(0, 0);
  video.hide();

  // setup PoseNet tracker for body/head tracking
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  // setup clmtracker for facetracking
  ctracker = new clm.tracker();
  ctracker.init();
  ctracker.start(video.elt);

  // fix target framerate at 30 FPS
  frameRate(30);
}


// fetches poses from PoseNet
function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}


// checks if PoseNet model is loaded into memory
function modelLoaded() {
  console.log('poseNet ready');
}

// drawing: joins array of (x,y) coordinates into an open shape
function connectdotsopen(dots) {
  for (var i=0; i<dots.length-1; i++) {
    stroke(0);
    strokeWeight(2);
    line(dots[i][0], dots[i][1], dots[i+1][0], dots[i+1][1]);
  }
}


// drawing: joins array of (x,y) coordinates into a closed shape
function connnectdotsclosed(dots) {
  connectdotsopen(dots);
  line(dots[dots.length-1][0], dots[dots.length-1][1], dots[0][0], dots[0][1]);
}


// draws keypoints from PoseNet
// only draws first 10 keypoints (head, shoulders, arms)
// (the green numbered dots)
// after 10 it would draw the torso and legs
function drawkeypoints() {
  for (let i = 0; i < 10; i++) {
    let x = pose.keypoints[i].position.x;
    let y = pose.keypoints[i].position.y;
    fill(0, 255, 0);
    noStroke();
    ellipse(x, y, 16, 16);
    textSize(12);
    fill(0);
    text(i, x, y);
  }
}


// draws skeleton from PoseNet
// only draws when a full/half body is detected
// (the black lines)
function drawskeleton() {
  for (let i = 0; i < skeleton.length; i++) {
    let a = skeleton[i][0];
    let b = skeleton[i][1];
    strokeWeight(5);
    stroke(0);
    line(a.position.x, a.position.y, b.position.x, b.position.y);
  }
}

// draws lines to connect selected keypoints from clmtrackr
// kind of sucks
function drawface() {
  //right eyebrow
  connectdotsopen(positions.slice(15, 19)); // points 15 to 18 are the right eyebrow

  //right eye
  connnectdotsclosed(positions.slice(28, 32)); // and so on

  //left eyebrow
  connectdotsopen(positions.slice(19, 23));

  //left eye
  connnectdotsclosed(positions.slice(23, 27));

  //nose
  connectdotsopen(positions.slice(34, 44));

  //mouth
  connnectdotsclosed(positions.slice(44, 56));
  connnectdotsclosed(positions.slice(56, 62));

  //face edge
  connectdotsopen(positions.slice(0, 15));
  
  //clmtrackr captures around 69 points, I am using only a subset
}


function draw() {
  clear(); // clear canvas each frame
  image(video, 0, 0, 640, 480); // draw captured video to canvas Teacher Side
  image(video, width/2, 0, 640, 480); // draw captured video to canvas Student Side
  fill(200,200);
  rect(640, 0, 640, 480); // Greys out video so you can see keypoints and skeleton clearly


  push();
  translate(640, 0); // Reset coordinates and start drawing on Student Side
  noFill(); rect(0, 0, 640, 480); // Makes a frame around the Student Side
  
  // PoseNet stuff: [BODY/HEAD-TRACKING]
  if (pose) { // Checks if pose is detectedS
    drawkeypoints(); // Draw the PoseNet keypoints (green numbered dots)
    drawskeleton(); // Draw the PoseNet skeleton (black lines)
    skelshow = skeleton.length; // sets count of detected skeleton points
  } else {
    skelshow = 0; // sets count of points in detected skeleton
  }
  
  // Clmtrackr stuff: [FACE-TRACKING]
  positions = ctracker.getCurrentPosition(); // fetch face keypoints from clmtrackr
  if (positions.length>0) { // Checks if face is detectedS
    drawface(); // Draw face using clmtrackr captured keypoints
    faceshow = 59; // Sets count of detected face keypoints
  } else {
    faceshow = 0; // Sets count of detected face keypoints
  }
  
  pop(); //shift coordinates back to true origin

  
  // Label Teacher/Student sides
  textSize(24);
  fill(255, 100, 100);
  stroke(0);
  text("Teacher Side", 20, 30);
  text("Student Side", 20 + width/2, 30);

  // Display Frames per second
  let fps = frameRate();
  text("FPS: " + fps.toFixed(2), 10, height - 10);
  
  // Rough Bandwidth calculation (excluding ALL protocol overhead, and a many other things)
  let NUMBERS_PER_POINT = 2 ; // (x and y)
  let BITS_PER_NUMBER = 16; // Assume 16bit integers used
  let BITS_PER_BYTE = 8; // fact
  let BYTES_PER_KILOBYTE = 1000; //fact
  
  let TOTAL_POINTS = 10 + skelshow + faceshow; // 10 points from posenet are fixed, skelshow and 
                                               // faceshow depend on how many are captured...
  let TOTAL_NUMBERS = NUMBERS_PER_POINT * TOTAL_POINTS;
  let TOTAL_DATA_BITS = TOTAL_NUMBERS * BITS_PER_NUMBER;
  let TOTAL_DATA_BYTES = TOTAL_DATA_BITS / BITS_PER_BYTE;
  let TOTAL_DATA_KILOBYTES = TOTAL_DATA_BYTES / BYTES_PER_KILOBYTE;
  let TOTAL_DATA_RATE = fps * TOTAL_DATA_KILOBYTES;
  let BANDWIDTH = TOTAL_DATA_RATE;
  
  // Display Bandwidth calculation
  text("BW: " + BANDWIDTH.toFixed(2) + "kbps", 10 + width/2, height - 10);
}
