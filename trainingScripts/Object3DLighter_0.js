// training n°46 v0


const settings = {
  debug: false
};
//settings.debug = true;



// 3D OBJECTS SPECIFICATIONS:

const meshPath = 'trainingData/models3D/lighter/';
const objects = [
  {
    label: 'LIGHTER',
    distance: 2,
    trainingSets:[
      {
        meshes: [
          meshPath + 'LighterShort.glb',
          meshPath + 'LighterLong.glb',
          meshPath + 'LighterCasual.glb'
          ],
        envMapMats: 'ALL',
        materialsTweakers: {
          'MetalSilver': function(mat){
            // randomize metallic materials
            mat.reflectivity = 0.5 + 0.5 * Math.random();
            mat.metalness = 0.7 + 0.3 * Math.random();
            mat.roughness = 0.5 * Math.random();
            mat.envMapIntensity = 1 + 5 * Math.random();
            //mat.color.setHex(0xff0000); mat.metalness = 0;
          },
          'Plastic': function(mat){
            // randomize plastic materials
            mat.reflectivity = Math.random();
            mat.metalness = 0;
            mat.color.r = Math.random();
            mat.color.g = Math.random();
            mat.color.b = Math.random();
            mat.roughness = Math.random();
            mat.envMapIntensity = 3 * Math.random();
            //mat.color.setHex(0x00ff00); mat.metalness = 0;
          }
        },
        scale: 0.02,
        thetaOffset: 180,
        thetaRange: (settings.debug) ? [-120, 120] : [-120, 120],
        probability: 1,
        isCenter: false
      }
    ]
  }
];

const objectsLabels = [], objectsDistances = [];
let objectsCount = 0;
objects.forEach(function(obj){
  if (!obj.label){
    return;
  }
  ++objectsCount;
  objectsLabels.push(obj.label);
  objectsDistances.push(obj.distance);
});



// WE CREATE THE NEURAL NETWORK:

const layers = [];
const activationConv = 'arctan2';
const activation = 'gelu';

// every layer has a square shape
// so we declare the square root (Sqrt) of some hyperparameters
// for instance, a layer with sizeSqrt=4 is a 4x4 = 16 neurons layer

// input layer:
layers.push({
  //preprocessing: 'grayScaleTilt',
  preprocessing: 'inputMix0',
  varianceMin: 0.05,
  gain: 1.1,
  blurKernelSizePx: 7,
  sizeSqrt: 128 });

// hidden convolutional layers:
layers.push({sizeSqrt: 128, connectivityUp: 'conv', sparsitySqrt: 8,
  kernelsCountSqrt: 4, activation: activationConv});

layers.push({connectivityUp: 'conv',
  sizeSqrt: 32, sparsitySqrt: 16,
  kernelsCountSqrt: 4,
  maxPooling: null,
  activation: activation});

// hidden (almost) fully connected layers:
layers.push({sizeSqrt: 16,
  connectivityUp: 'full', shiftRGBAMode: 2, activation: activation});

layers.push({sizeSqrt: 16,
  connectivityUp: 'full', shiftRGBAMode: 2, activation: activation});

layers.push({sizeSqrt: 16,
  connectivityUp: 'full', shiftRGBAMode: 2, activation: activation});

// output layer:
layers.push({connectivityUp: 'full', clampOutput: "mask",
  sizeSqrt: ObjectDetectionTrainer.compute_outputSize(objects.length), activation: 'copy'});



const d2r = Math.PI / 180; // degrees 2 radians
const inputAspectRatio = 1;

const rotZMax = (settings.debug) ? 30 : 30, // in degrees = roll
    dxMax = 0.15, // 1 -> half of the window
    dyMax = 0.15,
    dsMax = 0.3,
    phiRange = [20, 120]; // Pitch: First value: when looking down. 0 -> aligned to vt axis. second value: when looking hzt

// build the neural net:
const net = new NeuronNetwork({
  exportData: {
    splitYawComponents: true,
    rollMax: rotZMax * d2r,
    pitchRange: [phiRange[0] * d2r, phiRange[1] * d2r],
    translationScalingFactors: [dxMax, dyMax, dsMax],
    labels: objectsLabels,
    distances: objectsDistances,
    inputAspectRatio: inputAspectRatio // = width / height of the input
  },
  layers: layers
});


// CREATE THE PREPROCESSING AND POSTPROCESSING IMAGES PIPELINES
// These pipelines are applied before and after 
// the sample image creation by the problem provider

const preprocessingPipeline = new ImageTransformPipeline([
  {
    passType: 'drawBackgroundImage',
    options: {imageSets: [
      {
        imagePath: 'trainingData/images/random/',
        imagePrefix: 'output_',
        count: 2,
        scaleRange: [0.03, 0.2],
        scalePow: 2,
        probability: 1
      }
    ]}
  },{
    passType: 'shiftLuminosity',
    options: {
      luminosityShiftRange: [0.5, 1.5]
    }
  }, {
    passType: 'distortElastic',
    probability: 0.4,
    options: {
      n: 4,
      radiusRange: [30, 100],
      displacement: 4
    }
  }, {
    passType: 'blur',
    probability: 0.5,
    options: {
      radiusRange: [1, 8]
    }
  },{
    passType: 'shiftGamma',
    options: {
      gammaShiftRange: [-0.4, 0.4]// negative -> brighter
    }
  },
  {
    passType: 'shiftLuminosity',
    options: {
      luminosityShiftRange: [0.5, 1.5]
    }
  },{
    passType: 'invertColors',
    probability: 0.3
  }]);


const postprocessingPipeline = new ImageTransformPipeline([
  {
    passType: 'shiftGamma',
    options: {
      gammaShiftRange: [-0.4, 0.4]//[-0.4, 0.4] // negative -> brighter
    }
  },
  {
    passType: 'shiftLuminosity',
    options: {
      luminosityShiftRange: [0.5, 1.5]
    }
  },
  {
    passType: 'shiftHue',
    options: {
      angleMaxRad: 3.14/6.0
    }
  }, 
  {
    passType: 'blur',
    probability: 0.2,
    options: {
      radiusRange: [0.5, 3]
    }
  }]);



// CREATE THE PROBLEM:

const rdmDistribution = {
  type: 'powCentered',
  pow: (settings.debug) ? 2 : 2
};

const problem = new Problem({
  provider: 'ObjectDetectionTrainer',
  preprocessing: preprocessingPipeline,
  postprocessing: postprocessingPipeline,
  options: {
    objects: objects,

    // rendering position:
    phiRange: phiRange, // zenith angle of the camera. First value: when looking down. 0-> aligned to vt axis. second value: when looking hzt
    translationScalingFactors: [dxMax, dyMax, dsMax],
    translationScalingFactorsDistributions: [rdmDistribution, rdmDistribution, 'uniform'],
    rotZ: {max: rotZMax, nSigmas: 4}, // in degrees - gaussian distribution

    // rendering output:
    width: 512,
    aspectRatio: inputAspectRatio,
    isSharedContext: true,
    FOV: [20, 70],

    // lighting and environment:
    pointLightNumberRange: [1, 2],
    ambientLightIntensityRange: [0.0, 1.5],
    updatePointLightsPeriod: (settings.debug) ? 10 : 100,
    pointLightMaxIntensity: 1,
    envMaps: true,
    //noiseTextures: textures,
    
    // statistics:
    positiveProbability: (settings.debug) ? 1 : 0.7,
    detectedObjScoreMin: 0.5,

    // output control:
    splitYawComponents: true,
    outputYaw: true,   // output yaw   (rotation of the object around vertical axis)
    outputPitch: true, // output pitch (rotation around hzt axis, ie phi)
    outputRoll: true   // output camera roll (rotation around view vector)
  }
});


// CREATE THE TRAINER TO TRAIN THE NEURAL NETWORK TO SOLVE THE PROBLEM:
const trainer = new Trainer({
  network: net,
  problem: problem,

  testsCount: 5000,
  testMinibatchsInterval: 20000,
  cost: 'quadratic',
  
  SGDLearningRate: 0.05,
  SGDLearningRatePeriod: 1000000,
  SGDMomentum: 0.7,

  stopAfterMinibatchsCount: 0,
  minibatchSize: (settings.debug) ? 1 : 200,
  display: true,
  updateLiveDisplayMinibatchsInterval: (settings.debug) ? 1 : 100,
  delayBetweenMinibatchs: (settings.debug) ? 500 : 5,
  l2Decay: 0.0000002
});


// TRIGGER TRAINING:
trainer.start(); 
