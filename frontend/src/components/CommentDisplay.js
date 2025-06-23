import React, { useState } from 'react';
import { getEnvironmentConfig } from '../config/environments';
import '../styles/CommentDisplay.css';

const CommentDisplay = ({ 
  comment, 
  onVote, 
  onReply, 
  onDelete, 
  onEdit, 
  currentUser,
  showReplyForm = false,
  onShowReplyForm 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [submitting, setSubmitting] = useState(false);

  // Get the current environment configuration
  const config = getEnvironmentConfig();
  const API_URL = config.API_URL;

  const handleVote = async (voteType) => {
    try {
      await onVote(comment.id, voteType);
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    
    setSubmitting(true);
    try {
      await onEdit(comment.id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const canEdit = currentUser && (currentUser.isAdmin || comment.authorId === currentUser.id);
  const canDelete = currentUser && (currentUser.isAdmin || comment.authorId === currentUser.id);
  const canVote = currentUser && comment.authorId !== currentUser.id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getVoteButtonClass = (voteType) => {
    const userVote = comment.voters?.find(v => v.userId === currentUser?.id);
    return userVote?.voteType === voteType ? 'voted' : '';
  };

  return (
    <div className="comment-display">
      <div className="comment-header">
        <div className="comment-author">
          {comment.isAnonymous ? (
            <span className="anonymous-author">👤 Anonymous User</span>
          ) : (
            <span className="author-name">
              {comment.author?.profile?.name || comment.author?.email || 'Unknown User'}
            </span>
          )}
        </div>
        <div className="comment-meta">
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="edited-indicator">(edited)</span>
          )}
        </div>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
              maxLength={1000}
            />
            <div className="edit-actions">
              <button 
                onClick={handleEdit}
                disabled={!editText.trim() || submitting}
                className="save-btn"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.text}</p>
        )}

        {/* Media display */}
        {comment.mediaUrls && comment.mediaUrls.length > 0 && (
          <div className="comment-media">
            {comment.mediaUrls.map((url, index) => {
              const mediaType = comment.mediaTypes[index];
              const fullUrl = `${API_URL}/${url.replace(/\\/g, '/')}`;
              
              if (mediaType && mediaType.startsWith('video/')) {
                return (
                  <video key={index} controls className="comment-video">
                    <source src={fullUrl} type={mediaType} />
                    Your browser does not support the video tag.
                  </video>
                );
              } else {
                return (
                  <img key={index} src={fullUrl} alt="Comment media" className="comment-image" />
                );
              }
            })}
          </div>
        )}
      </div>

      <div className="comment-actions">
        <div className="vote-section">
          {canVote && (
            <>
              <button
                onClick={() => handleVote('upvote')}
                className={`vote-btn upvote ${getVoteButtonClass('upvote')}`}
                title="Upvote"
              >
                👍 {comment.upvotes || 0}
              </button>
              <button
                onClick={() => handleVote('downvote')}
                className={`vote-btn downvote ${getVoteButtonClass('downvote')}`}
                title="Downvote"
              >
                👎 {comment.downvotes || 0}
              </button>
            </>
          )}
          <span className="total-points">
            {comment.totalPoints || 0} pts
          </span>
        </div>

        <div className="action-buttons">
          <button
            onClick={() => onShowReplyForm(comment.id)}
            className="action-btn reply-btn"
          >
            💬 Reply
          </button>
          
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="action-btn edit-btn"
            >
              ✏️ Edit
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="action-btn delete-btn"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="reply-form-container">
          {/* This will be rendered by the parent component */}
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map(reply => (
            <CommentDisplay
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentDisplay; 