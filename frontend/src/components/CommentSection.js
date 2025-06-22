import React, { useState, useEffect } from 'react';
import CommentForm from './CommentForm';
import CommentDisplay from './CommentDisplay';
import '../styles/CommentSection.css';

const CommentSection = ({ locationId, user, onNewBadges }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchComments = async (pageNum = 1, append = false) => {
    if (!locationId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/comments/location/${locationId}?page=${pageNum}&limit=10&sort=${sortBy}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      if (append) {
        setComments(prev => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(data.pagination.currentPage);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1, false);
  }, [locationId, sortBy]);

  const handleSubmitComment = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const data = await response.json();
      
      // Add new comment to the list
      setComments(prev => [data.comment, ...prev]);
      setShowCommentForm(false);
      setReplyingTo(null);

      // Handle new badges
      if (data.newBadges && data.newBadges.length > 0) {
        onNewBadges(data.newBadges);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    }
  };

  const handleVote = async (commentId, voteType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voteType })
      });

      if (!response.ok) {
        throw new Error('Failed to vote on comment');
      }

      const data = await response.json();
      
      // Update the comment in the list
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? data.comment : comment
      ));

      // Handle new badges
      if (data.newBadges && data.newBadges.length > 0) {
        onNewBadges(data.newBadges);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleEdit = async (commentId, newText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newText })
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      const updatedComment = await response.json();
      
      // Update the comment in the list
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Remove the comment from the list
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const loadMoreComments = () => {
    if (!loading && hasMore) {
      fetchComments(page + 1, true);
    }
  };

  const renderComment = (comment) => (
    <CommentDisplay
      key={comment.id}
      comment={comment}
      onVote={handleVote}
      onReply={handleSubmitComment}
      onDelete={handleDelete}
      onEdit={handleEdit}
      currentUser={user}
      showReplyForm={replyingTo === comment.id}
      onShowReplyForm={setReplyingTo}
    />
  );

  return (
    <div className="comment-section">
      <div className="comment-section-header">
        <h3>💬 Comments ({comments.length})</h3>
        <div className="comment-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="points">Most Points</option>
          </select>
          
          {user && (
            <button
              onClick={() => setShowCommentForm(true)}
              className="add-comment-btn"
            >
              💬 Add Comment
            </button>
          )}
        </div>
      </div>

      {showCommentForm && (
        <CommentForm
          locationId={locationId}
          onSubmit={handleSubmitComment}
          onCancel={() => setShowCommentForm(false)}
          user={user}
        />
      )}

      {replyingTo && (
        <div className="reply-form-wrapper">
          <CommentForm
            locationId={locationId}
            parentCommentId={replyingTo}
            onSubmit={handleSubmitComment}
            onCancel={() => setReplyingTo(null)}
            user={user}
          />
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 && !loading ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to share your thoughts! 💭</p>
          </div>
        ) : (
          comments.map(renderComment)
        )}
      </div>

      {loading && (
        <div className="loading-comments">
          <p>Loading comments... 🔄</p>
        </div>
      )}

      {hasMore && !loading && (
        <div className="load-more-container">
          <button
            onClick={loadMoreComments}
            className="load-more-btn"
          >
            📄 Load More Comments
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection; 