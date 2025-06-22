import React, { useState } from 'react';
import '../styles/CommentForm.css';

const CommentForm = ({ locationId, parentCommentId = null, onSubmit, onCancel, user }) => {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [media, setMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('locationId', locationId);
      formData.append('text', text.trim());
      formData.append('isAnonymous', isAnonymous);
      
      if (parentCommentId) {
        formData.append('parentCommentId', parentCommentId);
      }

      if (media.length > 0) {
        media.forEach(file => {
          formData.append('media', file);
        });
      }

      await onSubmit(formData);
      setText('');
      setMedia([]);
      setIsAnonymous(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMedia(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="comment-form">
      <form onSubmit={handleSubmit}>
        <div className="comment-form-header">
          <h4>{parentCommentId ? 'Reply to Comment' : 'Add a Comment'}</h4>
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
          >
            ✕
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={parentCommentId ? "Write your reply..." : "Share your thoughts about this location..."}
          className="comment-textarea"
          required
          maxLength={1000}
        />

        <div className="comment-form-options">
          <label className="anonymous-checkbox">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span>Post anonymously</span>
          </label>

          <div className="character-count">
            {text.length}/1000
          </div>
        </div>

        {/* Media upload section */}
        <div className="media-upload-section">
          <label htmlFor="comment-media" className="media-upload-label">
            📎 Add Photos/Videos
          </label>
          <input
            id="comment-media"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="media-input"
          />
          
          {media.length > 0 && (
            <div className="media-preview">
              {media.map((file, index) => (
                <div key={index} className="media-item">
                  <span className="media-name">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-media"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="comment-form-actions">
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="submit-comment-btn"
          >
            {submitting ? 'Posting...' : (parentCommentId ? 'Reply' : 'Post Comment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm; 