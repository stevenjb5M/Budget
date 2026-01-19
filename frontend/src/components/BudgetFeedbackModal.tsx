import { BudgetFeedback } from '../services/budgetFeedbackService'
import './BudgetFeedbackModal.css'

interface BudgetFeedbackModalProps {
  isOpen: boolean
  feedback: BudgetFeedback | null
  isLoading: boolean
  error: string | null
  onClose: () => void
}

export function BudgetFeedbackModal({
  isOpen,
  feedback,
  isLoading,
  error,
  onClose,
}: BudgetFeedbackModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI Budget Analysis</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing your budget...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
            </div>
          )}

          {feedback && !isLoading && !error && (
            <>
              <div className="feedback-section summary-section">
                <h3>Summary</h3>
                <p>{feedback.summary}</p>
              </div>

              <div className="feedback-section">
                <h3>✨ What You're Doing Well</h3>
                <ul className="feedback-list strengths">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index}>
                      <span className="strength-icon">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="feedback-section">
                <h3>💡 Areas for Improvement</h3>
                <ul className="feedback-list improvements">
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index}>
                      <span className="improvement-icon">{index + 1}</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
