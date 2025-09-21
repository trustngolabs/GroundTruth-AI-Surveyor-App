import { useState, useEffect, useRef } from 'react';

export default function SurveyScreen({ survey, onComplete, onBack, verificationService }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Mock survey questions - in real app, this would come from the survey data
  const questions = [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is your primary occupation?',
      options: ['Farming', 'Business', 'Service', 'Daily Labor', 'Other'],
      required: true
    },
    {
      id: 2,
      type: 'text',
      question: 'What is your monthly household income (in ₹)?',
      placeholder: 'Enter amount in rupees',
      required: true
    },
    {
      id: 3,
      type: 'multiple_choice',
      question: 'Do you have access to clean drinking water?',
      options: ['Yes, always', 'Yes, sometimes', 'Rarely', 'No'],
      required: true
    },
    {
      id: 4,
      type: 'audio',
      question: 'Please share your opinion about healthcare facilities in your area.',
      required: false
    },
    {
      id: 5,
      type: 'photo',
      question: 'Please take a photo of your water source.',
      required: false
    },
    {
      id: 6,
      type: 'text',
      question: 'What are the main challenges you face in agriculture?',
      placeholder: 'Describe the key challenges...',
      multiline: true,
      required: true
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Initialize verification service when survey starts
    if (verificationService && !verificationData) {
      const initVerification = async () => {
        try {
          const data = await verificationService.startSurvey(survey.id);
          setVerificationData(data);
        } catch (error) {
          console.error('Failed to initialize verification:', error);
        }
      };
      initVerification();
    }
  }, [survey.id, verificationService, verificationData]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    
    // Log answer timestamp for verification
    if (verificationService) {
      verificationService.logAnswer(currentQuestion.id, value);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleAnswerChange({ type: 'audio', blob: audioBlob, url: audioUrl });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handlePhotoCapture = async () => {
    try {
      // In a real app, this would use the device camera
      // For this demo, we'll simulate a photo capture
      handleAnswerChange({ type: 'photo', url: 'photo_placeholder.jpg' });
      
    } catch (error) {
      console.error('Failed to capture photo:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    return answer !== undefined && answer !== '' && answer !== null;
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setNotes('');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setNotes('');
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Finalize verification data
      let finalVerificationData = verificationData;
      if (verificationService) {
        finalVerificationData = await verificationService.completeSurvey();
      }

      // Create survey packet
      const surveyPacket = {
        surveyId: survey.id,
        answers,
        notes,
        verification: finalVerificationData,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };

      onComplete(surveyPacket);
    } catch (error) {
      console.error('Failed to complete survey:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = () => {
    const answer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option, index) => (
              <div 
                key={index}
                className={`option-card ${answer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(option)}
              >
                <div className="option-radio"></div>
                {option}
              </div>
            ))}
          </div>
        );

      case 'text':
        return currentQuestion.multiline ? (
          <textarea
            placeholder={currentQuestion.placeholder}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="form-input"
            style={{ minHeight: '100px' }}
          />
        ) : (
          <input
            type="text"
            placeholder={currentQuestion.placeholder}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="form-input"
          />
        );

      case 'audio':
        return (
          <div className="media-capture">
            <button
              className={`capture-button record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
            <div className={`media-status ${answer ? 'recorded' : ''}`}>
              {isRecording ? (
                `Recording... ${formatTime(recordingTime)}`
              ) : answer ? (
                'Audio recorded successfully'
              ) : (
                'Press the button below to record your response'
              )}
            </div>
            {answer && (
              <div style={{ marginTop: '1rem' }}>
                <audio controls>
                  <source src={answer.url} type="audio/wav" />
                </audio>
              </div>
            )}
          </div>
        );

      case 'photo':
        return (
          <div className="media-capture">
            <button
              className="capture-button camera-button"
              onClick={handlePhotoCapture}
            >
              <i className="fas fa-camera"></i>
            </button>
            <div className={`media-status ${answer ? 'recorded' : ''}`}>
              {answer ? (
                'Photo taken successfully'
              ) : (
                'Take a photo of the subject'
              )}
            </div>
            {answer && (
              <img 
                src={answer.url} 
                alt="Captured" 
                className="photo-preview"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <div className="location-badge">
          <i className="fas fa-map-marker-alt"></i>
          {survey.location}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-text">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      {/* Question */}
      <div className="question-container">
        <h2 className="question-title">
          {currentQuestion.question}
          {currentQuestion.required && (
            <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
          )}
        </h2>
        
        {renderQuestionInput()}
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            className="btn btn-success"
            onClick={handleComplete}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Complete Survey'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
