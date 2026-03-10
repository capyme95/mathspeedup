'use client';

import { useState, useEffect } from 'react';
import { Brain, Clock, Zap, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface RetrievalQuestion {
  id: string;
  standardId: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  difficulty: 'Achieved' | 'Merit' | 'Excellence';
  domain: 'Knowing' | 'Applying' | 'Reasoning';
}

interface RetrievalSession {
  questions: RetrievalQuestion[];
  startedAt: Date;
  completed: boolean;
}

export default function RetrievalPractice() {
  // Mock retrieval questions (in production, these would be fetched from Supabase)
  const mockQuestions: RetrievalQuestion[] = [
    {
      id: 'retrieve_1',
      standardId: 'AS91945',
      questionText: 'Simplify the expression for the combined area of one Artisan Stall (s m²) and one Food Truck (2s + 5 m²).',
      correctAnswer: '3s + 5',
      explanation: 'Combine like terms: s + (2s + 5) = 3s + 5.',
      difficulty: 'Achieved',
      domain: 'Knowing',
    },
    {
      id: 'retrieve_2',
      standardId: 'AS91945',
      questionText: 'If the revenue model is R = 850 – 75w and the required minimum revenue is $400 × d, write the inequality that determines the maximum number of rainy weekends w.',
      correctAnswer: '850 - 75w ≥ 400d',
      explanation: 'Set revenue greater than or equal to the minimum required.',
      difficulty: 'Merit',
      domain: 'Applying',
    },
    {
      id: 'retrieve_3',
      standardId: 'AS91945',
      questionText: 'Prove that the difference between the squares of any two consecutive positive odd integers is a multiple of 8.',
      correctAnswer: 'Let integers be 2n+1 and 2n+3. Then (2n+3)² – (2n+1)² = 8(n+1), which is divisible by 8.',
      explanation: 'Expand and factor to show the result is always 8 times an integer.',
      difficulty: 'Excellence',
      domain: 'Reasoning',
    },
  ];

  const [session, setSession] = useState<RetrievalSession>({
    questions: mockQuestions,
    startedAt: new Date(),
    completed: false,
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [confidenceRatings, setConfidenceRatings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0); // in seconds

  // Timer effect
  useEffect(() => {
    if (session.completed) return;
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.completed]);

  const currentQuestion = session.questions[currentQuestionIndex];

  const handleAnswerChange = (value: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleConfidenceChange = (rating: number) => {
    setConfidenceRatings(prev => ({ ...prev, [currentQuestion.id]: rating }));
  };

  const handleSubmitQuestion = () => {
    setSubmitted(prev => ({ ...prev, [currentQuestion.id]: true }));
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered
      setSession(prev => ({ ...prev, completed: true }));
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setSession({
      questions: mockQuestions,
      startedAt: new Date(),
      completed: false,
    });
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setConfidenceRatings({});
    setSubmitted({});
    setShowResults(false);
    setTimeSpent(0);
  };

  const calculateScore = () => {
    let correct = 0;
    let totalConfidence = 0;
    const totalQuestions = session.questions.length;
    session.questions.forEach(q => {
      const userAnswer = userAnswers[q.id]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correct++;
      totalConfidence += confidenceRatings[q.id] || 0;
    });
    const accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    const avgConfidence = totalQuestions > 0 ? totalConfidence / totalQuestions : 0;
    return { correct, totalQuestions, accuracy, avgConfidence };
  };

  const { correct, totalQuestions, accuracy, avgConfidence } = calculateScore();

  // Confidence labels
  const confidenceLabels = ['Very unsure', 'Unsure', 'Neutral', 'Confident', 'Very confident'];

  if (showResults) {
    return (
      <div className="border border-cyan-500/30 bg-black/40 p-8 md:p-10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Brain className="h-10 w-10 text-cyan-400" />
          <h3 className="text-3xl font-black uppercase tracking-tight text-white">
            Retrieval Practice Results
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-black/60 p-6 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <h4 className="text-xl font-black uppercase text-white">Accuracy</h4>
            </div>
            <p className="text-5xl font-black text-emerald-300">{accuracy.toFixed(0)}%</p>
            <p className="text-sm text-zinc-400 mt-2">
              {correct} out of {totalQuestions} correct
            </p>
          </div>
          <div className="bg-black/60 p-6 border border-cyan-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-cyan-400" />
              <h4 className="text-xl font-black uppercase text-white">Avg Confidence</h4>
            </div>
            <p className="text-5xl font-black text-cyan-300">{avgConfidence.toFixed(1)}</p>
            <p className="text-sm text-zinc-400 mt-2">
              out of 5 ({confidenceLabels[Math.round(avgConfidence) - 1]})
            </p>
          </div>
          <div className="bg-black/60 p-6 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-8 w-8 text-purple-400" />
              <h4 className="text-xl font-black uppercase text-white">Time Spent</h4>
            </div>
            <p className="text-5xl font-black text-purple-300">{timeSpent}s</p>
            <p className="text-sm text-zinc-400 mt-2">
              {((timeSpent / totalQuestions) || 0).toFixed(1)}s per question
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <h4 className="text-xl font-black uppercase text-white border-b border-zinc-800 pb-2">
            Question Review
          </h4>
          {session.questions.map((q, idx) => {
            const userAnswer = userAnswers[q.id] || '';
            const correctAnswer = q.correctAnswer;
            const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
            const confidence = confidenceRatings[q.id] || 0;
            return (
              <div key={q.id} className="bg-black/40 p-6 border border-zinc-800 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-mono uppercase tracking-widest text-cyan-400">Q{idx + 1}</span>
                    <h5 className="text-lg font-bold text-white mt-2">{q.questionText}</h5>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-3 py-1 text-xs font-black uppercase rounded-full ${q.difficulty === 'Achieved' ? 'bg-green-900/40 text-green-300' : q.difficulty === 'Merit' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-red-900/40 text-red-300'}`}>
                        {q.difficulty}
                      </span>
                      <span className={`px-3 py-1 text-xs font-black uppercase rounded-full ${q.domain === 'Knowing' ? 'bg-cyan-900/40 text-cyan-300' : q.domain === 'Applying' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-purple-900/40 text-purple-300'}`}>
                        {q.domain}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <span className="text-sm font-mono text-zinc-400">Confidence: {confidence}/5</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <p className="text-sm font-black uppercase text-zinc-500 mb-2">Your Answer</p>
                    <p className="text-white font-mono bg-zinc-900/60 p-3 rounded">{userAnswer || '(No answer)'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase text-zinc-500 mb-2">Correct Answer</p>
                    <p className="text-emerald-300 font-mono bg-emerald-900/20 p-3 rounded">{correctAnswer}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-4">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 font-mono">
            Retrieval practice boosts long‑term retention (testing effect).
          </p>
          <button
            onClick={handleRetry}
            className="px-10 py-4 bg-cyan-600 text-white font-black uppercase tracking-widest hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all rounded-lg"
          >
            Try Another Set
          </button>
        </div>
      </div>
    );
  }

  // Active quiz UI
  return (
    <div className="border border-cyan-500/30 bg-black/40 p-8 md:p-10 rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Brain className="h-10 w-10 text-cyan-400" />
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tight text-white">
              Retrieval Practice
            </h3>
            <p className="text-zinc-400 font-mono uppercase text-sm tracking-widest">
              Quick recall quiz to strengthen memory (Testing Effect)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-mono text-zinc-500">Question</p>
            <p className="text-2xl font-black text-white">{currentQuestionIndex + 1} / {session.questions.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-zinc-500">Time</p>
            <p className="text-2xl font-black text-cyan-300">{timeSpent}s</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <span className={`px-4 py-2 text-sm font-black uppercase rounded-full ${currentQuestion.difficulty === 'Achieved' ? 'bg-green-900/40 text-green-300' : currentQuestion.difficulty === 'Merit' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-red-900/40 text-red-300'}`}>
            {currentQuestion.difficulty}
          </span>
          <span className={`px-4 py-2 text-sm font-black uppercase rounded-full ${currentQuestion.domain === 'Knowing' ? 'bg-cyan-900/40 text-cyan-300' : currentQuestion.domain === 'Applying' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-purple-900/40 text-purple-300'}`}>
            {currentQuestion.domain}
          </span>
          <span className="px-4 py-2 text-sm font-black uppercase rounded-full bg-zinc-800 text-zinc-300">
            {currentQuestion.standardId}
          </span>
        </div>
        <h4 className="text-2xl font-bold text-white mb-8 leading-relaxed">
          {currentQuestion.questionText}
        </h4>

        <div className="space-y-8">
          <div>
            <label className="block text-lg font-black uppercase text-cyan-300 mb-4">
              Your Answer
            </label>
            <textarea
              className="w-full bg-black/60 border-2 border-cyan-800/50 text-white text-lg p-6 rounded-xl min-h-[120px] outline-none focus:border-cyan-500 transition-all font-mono"
              placeholder="Type your answer here..."
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={submitted[currentQuestion.id]}
            />
          </div>

          <div>
            <label className="block text-lg font-black uppercase text-purple-300 mb-4">
              How confident are you? (1 = Very unsure, 5 = Very confident)
            </label>
            <div className="flex items-center justify-between max-w-md">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleConfidenceChange(rating)}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all ${confidenceRatings[currentQuestion.id] === rating ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-zinc-700 bg-black/40 text-zinc-400 hover:border-purple-400'}`}
                  disabled={submitted[currentQuestion.id]}
                >
                  <span className="text-2xl font-black">{rating}</span>
                  <span className="text-[10px] uppercase tracking-widest mt-1">{confidenceLabels[rating - 1]}</span>
                </button>
              ))}
            </div>
            {confidenceRatings[currentQuestion.id] && (
              <p className="text-sm text-zinc-400 mt-4">
                Selected confidence: <strong className="text-purple-300">{confidenceRatings[currentQuestion.id]}/5</strong> – {confidenceLabels[confidenceRatings[currentQuestion.id] - 1]}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-zinc-800">
        <div className="text-sm text-zinc-500 max-w-lg">
          <HelpCircle className="inline h-4 w-4 mr-2" />
          <strong>Why retrieval practice?</strong> Actively recalling information strengthens neural pathways more than passive review (Roediger & Karpicke, 2006).
        </div>
        <button
          onClick={handleSubmitQuestion}
          disabled={!userAnswers[currentQuestion.id] || !confidenceRatings[currentQuestion.id] || submitted[currentQuestion.id]}
          className="px-12 py-5 bg-cyan-600 text-white font-black uppercase tracking-widest text-lg hover:bg-cyan-500 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl"
        >
          {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Finish & See Results'}
        </button>
      </div>
    </div>
  );
}