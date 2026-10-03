const documents = [
  "A patient can book a hospital appointment up to 90 days in advance.",
  "Standard doctor appointments have a duration of 30 minutes.",
  "Cancelled appointments immediately make the time slot available again.",
  "Administrator accounts require multi-factor authentication.",
  "Patient records are encrypted when stored.",
  "NovaCare uses PostgreSQL as its primary database.",
  "High priority support tickets should receive a response within one hour.",
  "The analytics service is built using Python.",
  "Green Valley Hospital has 48 doctors and can handle 620 appointments per day.",
  "Sunrise Medical Center has 31 doctors and can handle 410 appointments per day.",
  "Riverbend Clinic has 16 doctors and can handle 180 appointments per day."
]

const queries = [
  "How far ahead can someone schedule a doctor's visit?",
  "How long does a normal consultation take?",
  "What happens to a doctor's availability after a cancellation?",
  "How is administrator login protected?",
  "Which database does the application use?",
  "Which programming language powers the analytics system?",
  "Which hospital has 31 doctors?",
  "How many appointments can Sunrise Medical Center handle each day?"
]


module.exports = {
  documents,
  queries
}