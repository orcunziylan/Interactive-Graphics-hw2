"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 12;
var tailId = 2; //
var mouthId = 3; //
var leftUpperArmId = 4;
var leftLowerArmId = 5;
var rightUpperArmId = 6;
var rightLowerArmId = 7;
var leftUpperLegId = 8;
var leftLowerLegId = 9;
var rightUpperLegId = 10;
var rightLowerLegId = 11;


var xAxisOfTorso = 0 ; //
var yAxisOfTorso = 0 ; //


var torsoHeight = 5.0;
var torsoWidth = 2.0;
var torsoPitch = 0;
var upperArmHeight = 3.0;
var lowerArmHeight = 2.0;
var upperArmWidth  = 0.6;
var lowerArmWidth  = 0.5;
var upperLegWidth  = 0.6;
var lowerLegWidth  = 0.5;
var lowerLegHeight = 2.0;
var upperLegHeight = 3.0;
var headHeight = 4.0;
var headWidth = 1.0;
var tailHeight = 3; //
var tailWidth = 0.5; //

var numNodes = 12;
//var numAngles = 11;

// ----> Texture;

var texture1;
var texture2;

var colorsArray = [];
var texCoordsArray = [];

var texSize = 256;
var numChecks = 8;
var c;

var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            image2[4*i*texSize+4*j] = 255 - i;
            image2[4*i*texSize+4*j+1] = 255 - i;
            image2[4*i*texSize+4*j+2] = 255 - i;
            image2[4*i*texSize+4*j+3] = 255;
           }
    }

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];


function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 
        0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 
        0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);
}

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var colorHorse = 7;

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[colorHorse]);
    texCoordsArray.push(texCoord[3]);
}


//------------------------

var theta = [
    0,                  // torso 
    0, 
    80,                 // tail
    0,                   // mouth
    -85 + torsoPitch,   // left up arm
    -5,                 // left low arm
    -90 + torsoPitch,   // right up arm
    0,                  // right low arm
    -90 + torsoPitch,   // left up leg
    5,                  // left low leg
    -85 + torsoPitch,   // right up leg
    0,                  // right low leg
    0, 0
];

let jumpPos = [
    [-110,  -15,  -15,  -45],   // left up arm
    [ -10,  -90,  -90,   -5],   // left low arm
    [ -95,  -70,  -15,  -35],   // right up arm
    [   0,  -90,  -80,  -80],   // right low arm
    [-135,  -80, -140, -155],   // left up leg
    [   0,    0,    0,  135],   // left low leg
    [-140,  -85, -135, -155],   // right up leg
    [   0,    0,    0,  135],   // right low leg
    [ -10,   60,  -45,  -10],   // tail
    [   0,    0,  4.5,    3],   // torso.y translation
    [   0,  -10,  -20,    10],   // torso pitch rotation
];

let walkPos = [
    [ -45,  -30,  -90, -130],   // left up arm
    [-110,    0,    0,  -20],   // left low arm
    [ -90, -130,  -45,  -30],   // right up arm
    [   0,  -20, -110,    0],   // right low arm
    [ -60, -100, -160, -120],   // left up leg
    [  10,   10,   10,   90],   // left low leg
    [-160, -120,  -60, -100],   // right up leg
    [  10,   90,   10,   10],   // right low leg
    [   0,   60,    0,   60],   // tail
    [ -0.2, 0.2, -0.2,  0.2],   // torso.y translation    
    [   0,    0,    0,    0],   // torso pitch rotation
];

//------------------------

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

var numVertices  = 16;

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:

        //translate( x, y, z );
        m = translate(xAxisOfTorso, yAxisOfTorso , 0);

        //m = rotate(theta[torsoId], 1, 1, 0 ); 
        
        m = mult(m,rotate(-90, 1, 0, 0 )); // pitch axis
        m = mult(m,rotate(torsoPitch, 0, 1, 0 )); // yaw axis
        m = mult(m,rotate(-90, 0, 0, 1 )); // roll axis

        
        //m = mult(m,rotate(15, 0, 0, 1 ));
        figure[torsoId] = createNode( m, torso, null, headId );
        break;

    case headId:
    case head1Id:
    case head2Id:

        //m = translate(0.0, torsoHeight+0.5*headHeight, 0.0);    
        m = translate(0.0, torsoHeight, 1);

        //m = mult(m, rotate(theta[head1Id], 1, 0, 0));
        //m = mult(m, rotate(theta[head2Id], 0, 1, 0));
        m = mult(m, rotate(45, 1, 0, 0));
        
        m = mult(m, translate(0.0, -0.5*headHeight, 0.0));

        figure[headId] = createNode( m, head, tailId, mouthId);
        break;
    
    case tailId:
  
        m = translate(0, 0, (torsoWidth/2) - 0.1);

        m = mult(m, rotate(180 + theta[tailId], 1, 0, 0));
        

        figure[tailId] = createNode( m, tail, leftUpperArmId, null);
        break;

    case leftUpperArmId:

        m = translate(-torsoWidth/2, 0.9*torsoHeight, 0.0);
        m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
        figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
        break;

    case rightUpperArmId:

        m = translate(torsoWidth/2, 0.9*torsoHeight, 0.0);
        m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
        figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
        break;

    case leftUpperLegId:

        m = translate(-torsoWidth/2, 0.1*upperLegHeight, 0.0);
        m = mult(m , rotate(theta[leftUpperLegId], 1, 0, 0));
        figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
        break;

    case rightUpperLegId:

        m = translate(torsoWidth/2, 0.1*upperLegHeight, 0.0);
        m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
        figure[rightUpperLegId] = createNode( m, rightUpperLeg, null, rightLowerLegId );
        break;

    case leftLowerArmId:

        m = translate(0.0, upperArmHeight, 0.0);
        m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
        figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
        break;

    case rightLowerArmId:

        m = translate(0.0, upperArmHeight, 0.0);
        m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
        figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
        break;

    case leftLowerLegId:

        m = translate(0.0, upperLegHeight, 0.0);
        m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
        figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
        break;

    case rightLowerLegId:

        m = translate(0.0, upperLegHeight, 0.0);
        m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
        figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
        break;

    case mouthId:
  
        m = translate(0.0, headHeight - headHeight/7, 0);

        m = mult(m, rotate(-90, 1, 0, 0));
        figure[mouthId] = createNode( m, mouth, null, null);
        break;

    }

}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}



function torso() {   
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);

}

function head() {
    gl.deleteTexture(texture1);
    gl.deleteTexture(texture2);

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function tail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function mouth() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight /3 , 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headHeight / 4, headHeight/3 , headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

function rightLowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}

var obstacleHeight = 0.5;
var obstacleWidth = 10;
var obstacleX = 60;


function obstacle() {

    configureTexture();

    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -5, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleHeight, obstacleWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
    
    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -2.5, obstacleWidth/2) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleWidth/2, obstacleHeight) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
    
    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -2.5, -obstacleWidth/2) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleWidth/2, obstacleHeight) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);

    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -2, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleHeight, obstacleWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);

    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -3, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleHeight, obstacleWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);

    instanceMatrix = mult(modelViewMatrix, translate(obstacleX, -4, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(1, obstacleHeight, obstacleWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
        for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLES, 4*i, numVertices);
}



function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-100.0,100.0);
    
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    document.getElementById("slider0").oninput = function(event) {
        eyeX = event.target.value;
    }
    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   

    configureTexture();
        
    traverse(torsoId);
    
    cam();
    
    obstacle();

    animation(0);

    requestAnimFrame(render);
}

let eyeX = 0;
let start = false;
let jump = false;

var startAnim = function() {
    start = !start;
}

var jumpAnim = function() {
    jump = !jump;
}

var cam = function(){
    var eye = vec3(eyeX, -eyeX/3, 1.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    
    modelViewMatrix = lookAt(eye, at, up);
}

/////////////////

var frame = 0;
let fSpeed = 10;
let endedFrames = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let count = 1
let firstFrame = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let notFirst = false;
var currentFrameValue = 0;;
var pos = walkPos;

var move = function(no, limb){

    if(start){
        // change next frame
        if (count >= endedFrames.length -1){
                
            for (let index = 0; index < endedFrames.length; index++) {
                endedFrames[index] = 0;
                firstFrame[index] = 0;
            }
            count = 0;
            frame += 1;

            if(frame > frame % pos[no].length){
                if(jump){
                    pos = jumpPos;
                    jump = !jump;
                    console.log("jump");
                    
                }else{
                    if(obstacleX < -10) obstacleX = 60;
                    console.log("endofjump");
                    frame = 0;
                    pos = walkPos;
                }
            }
            
            console.log(frame, pos[no].length, frame % pos[no].length);                    

            frame = frame % pos[no].length;
            return 0;
        }else{
            
            // approximate limb's angles to the frame's
            count = 0;

            var nextFrameValue = pos[no][(frame +1) % pos[no].length];
            let diff = limb - nextFrameValue;

            if(firstFrame[no] == 0){                    
                firstFrame[no] = limb - nextFrameValue;
                currentFrameValue = limb;
            }
            
            if(diff < 0.1 && diff > -0.1){ 
                
                endedFrames[no] = 1;
                for (let index = 0; index < endedFrames.length; index++) {
                    endedFrames[index] == 1 ? count += 1 : count;
                    if(count == endedFrames.length -1){
                        return 0;
                    }
                }
                return 0;
            }
            
            if(notFirst == false){
                return -firstFrame[no] / fSpeed;    
            }

            return -currentFrameValue - nextFrameValue / fSpeed;
        }        
    }
    
    return 0;   
}

var animation = function(speed) {

    if (start) obstacleX -= 0.5;

    if(obstacleX == 18) jump = true;


    theta[leftUpperArmId] += move(0, theta[leftUpperArmId]);
    initNodes(leftUpperArmId);

    theta[leftLowerArmId] += move(1, theta[leftLowerArmId]);
    initNodes(leftLowerArmId);

    theta[rightUpperArmId] += move(2, theta[rightUpperArmId]);
    initNodes(rightUpperArmId);

    theta[rightLowerArmId] +=  move(3, theta[rightLowerArmId]);
    initNodes(rightLowerArmId);

    theta[leftUpperLegId] += move(4, theta[leftUpperLegId]);
    initNodes(leftUpperLegId);

    theta[leftLowerLegId] += move(5, theta[leftLowerLegId]);
    initNodes(leftLowerLegId);

    theta[rightUpperLegId] += move(6, theta[rightUpperLegId]);
    initNodes(rightUpperLegId);

    theta[rightLowerLegId] += move(7, theta[rightLowerLegId]);
    initNodes(rightLowerLegId);

    theta[tailId] += move(8, theta[tailId]);
    initNodes(tailId);

    xAxisOfTorso += speed;
    yAxisOfTorso += move(9, yAxisOfTorso);
    torsoPitch += move(10, torsoPitch);
    initNodes(torsoId);
}

