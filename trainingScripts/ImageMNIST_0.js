// ================ HANDWRITTEN DIGIT CLASSIFICATION (MNIST) ================


// MNIST neural network example

const activation = "gelu";

// neural network layers:
const layers = [];

// real input data is 28x28 but we increase it to make it PoT
layers.push({sizeSqrt: 32, preprocessing: 'copyChannels'});

// stride=kernelsCount*fromSize/toSize
// stride = 8*32/256 = 1
layers.push({sizeSqrt: 128, connectivityUp: 'conv', sparsitySqrt: 8, kernelsCountSqrt: 8, maxPooling: {sizeSqrt: 2}, activation: activation});
// output : 128

// stride = 8*128/64=16
layers.push({sizeSqrt: 64, connectivityUp: 'conv', sparsitySqrt: 16, kernelsCountSqrt: 8, activation: activation});

// output : 64
layers.push({sizeSqrt: 8, connectivityUp: 'full', activation: activation});

layers.push({connectivityUp: 'full', clampOutput: "none", normalize: true, activation: activation, classesCount: 10});


const net = new NeuronNetwork({
  layers: layers
});

const postprocessingPipeline = new ImageTransformPipeline([
  {
    passType: 'distortElastic',
    options: {
      n: 6,
      radiusRange: [10, 40],
      displacement: 4
    }
  }]); 

const problem = new Problem({
  provider:'ImageDatasetTrainer',
  postprocessing: postprocessingPipeline,
  options: {
    problem: 'classification',
    dir: 'trainingData/images/MNIST/',
    batchPrefix: 'mnist_batch_',
    batchJson: 'mnist_labels.json',
    batchX: 60, batchY: 50,
    batchsCount: 21, // total number of batches
    batchsTestCount: 1, // batch for the test
    tilt: {
      flipY: false, // flip left<->right
      rotateMaxAngle: 17, // max rotate angle in degrees
      translateMax: [0.08, 0.08], // max translation (1 -> 100%)
      inputBgColor: 0,
    }
  }
});

const trainer = new Trainer({
  network: net,
  problem: problem,
  
  testMinibatchsInterval: 4000,
  cost: 'quadratic',
  
  display: true,
  SGDMomentum: 0.6,
  SGDLearningRatePeriod: 3000 * 40,
  SGDLearningRate: 0.03,
  
  minibatchSize: 20,
  updateLiveDisplayMinibatchsInterval: 20,
  delayBetweenMinibatchs: 5,
  l2Decay: 0.000001
});

trainer.start(); 