import * as tf from "@tensorflow/tfjs";

export async function predictSign(landmarks) {
  // Load trained model
  const model = await tf.loadLayersModel("localstorage://sign-model");

  const input = tf.tensor2d([landmarks]); // [1, 63]
  const prediction = model.predict(input);
  const probabilities = prediction.arraySync()[0];

  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  return maxIndex; // corresponds to letter index
}
