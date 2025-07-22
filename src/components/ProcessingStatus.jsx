import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ProcessingStatus.css';

const ProcessingStatus = ({ jobId, onClose }) => {
  const { t } = useTranslation("processing");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/audio-async/upload-status/${jobId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          setError(null);
        } else {
          setError(t("failed_to_fetch_status"));
        }
      } catch (err) {
        setError(t("connection_error"));
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial status
    fetchStatus();

    // Poll for updates every 3 seconds if not completed
    const interval = setInterval(() => {
      if (status?.status !== 'completed' && status?.status !== 'failed') {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, status?.status, t]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/audio-async/retry-processing/${jobId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });

      if (response.ok) {
        setStatus({ ...status, status: 'pending', progress: 0 });
        setError(null);
      } else {
        setError(t("failed_to_retry"));
      }
    } catch (err) {
      setError(t("connection_error"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'processing': return '🔄';
      case 'pending': return '⏳';
      case 'skipped': return '⏭️';
      default: return '⏳';
    }
  };

  const getStatusText = (statusType) => {
    switch (statusType) {
      case 'completed': return t('completed');
      case 'failed': return t('failed');
      case 'processing': return t('processing');
      case 'pending': return t('pending');
      case 'skipped': return t('skipped');
      default: return t('unknown');
    }
  };

  if (loading && !status) {
    return (
      <div className="processing-status-modal">
        <div className="processing-status-content">
          <h3>{t("loading_status")}</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="processing-status-modal">
        <div className="processing-status-content">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={onClose}>{t("close")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="processing-status-modal">
      <div className="processing-status-content">
        <div className="status-header">
          <h3>{t("processing_status")}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="background-processing-info">
          <p className="info-text">
            💡 You can close this window and continue working. 
            Processing will continue in the background.
          </p>
        </div>

        <div className="status-overview">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${status?.progress || 0}%` }}
            ></div>
          </div>
          <p className="progress-text">{t("overall_progress")}: {status?.progress || 0}%</p>
        </div>

        <div className="status-steps">
          <div className="status-step">
            <span className="step-icon">✅</span>
            <span className="step-text">Upload: {t("completed")}</span>
          </div>

          <div className="status-step">
            <span className="step-icon">{getStatusIcon(status?.transcription_status)}</span>
            <span className="step-text">
              Transcription: {getStatusText(status?.transcription_status)}
            </span>
            {status?.transcription_error && (
              <div className="error-message">
                <small>{status.transcription_error}</small>
              </div>
            )}
          </div>

          <div className="status-step">
            <span className="step-icon">ℹ️</span>
            <span className="step-text">
              Sentiment Analysis: Available in Patient Dashboard
            </span>
            <div className="info-message">
              <small>Click on a session in the Patient Dashboard to analyze sentiment</small>
            </div>
          </div>
        </div>

        <div className="status-actions">
          {status?.status === 'failed' && status?.retry_count < status?.max_retries && (
            <button onClick={handleRetry} disabled={loading}>
              {loading ? t("processing") : t("retry_processing")}
            </button>
          )}
          
          {status?.status === 'completed' && (
            <div className="success-message">
              <p>✅ Processing completed successfully!</p>
              <p>Your session has been saved to the database.</p>
            </div>
          )}
        </div>

        <div className="background-processing-footer">
          <p className="footer-text">
            🔄 Processing continues even if you close this window or navigate away
          </p>
        </div>

        <div className="status-details">
          <small>Job ID: {jobId}</small>
          <br />
          <small>Created: {status?.created_at ? new Date(status.created_at).toLocaleString() : 'N/A'}</small>
          {status?.completed_at && (
            <>
              <br />
              <small>Completed: {new Date(status.completed_at).toLocaleString()}</small>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
