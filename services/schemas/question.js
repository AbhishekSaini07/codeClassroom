const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  difficulty: String,
  tags: [String],
  problem_statement: String,
  input_format: String,
  output_format: String,
  constraints: String,
  sample_testcases: [{ input: String, output: String, explanation: String }],
  hidden_testcases: [{ input: String, output: String, explanation: String }],
});

// Create a model from the schema
const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
