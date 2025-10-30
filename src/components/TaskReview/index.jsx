import React, { useState, memo, useEffect, useMemo } from 'react';
import { FiStar, FiCheck } from 'react-icons/fi';
import './TaskReview.scss';

const TaskReview = memo(({ task, allTasks = [], currentUser, onSave, users }) => {
  const assignees = Array.isArray(task?.assignee) ? task.assignee : (task?.assignee ? [task.assignee] : []);
  const existingReviews = task?.reviews || {};
  
  const [selectedAssignee, setSelectedAssignee] = useState(assignees[0] || '');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState(null);

  const isManager = currentUser?.role === 'super_manager' || currentUser?.role === 'manager';
  
  const allUserReviews = useMemo(() => {
    const userReviewsMap = {};
    
    allTasks.forEach(t => {
      if (t.reviews) {
        Object.keys(t.reviews).forEach(assigneeId => {
          const reviews = t.reviews[assigneeId];
          const reviewArray = Array.isArray(reviews) ? reviews : [reviews];
          
          if (!userReviewsMap[assigneeId]) {
            userReviewsMap[assigneeId] = [];
          }
          
          reviewArray.forEach(review => {
            if (review && review.rating) {
              userReviewsMap[assigneeId].push(review);
            }
          });
        });
      }
    });
    
    return userReviewsMap;
  }, [allTasks]);

  useEffect(() => {
    if (selectedAssignee && existingReviews[selectedAssignee]) {
      const reviews = existingReviews[selectedAssignee];
      const reviewArray = Array.isArray(reviews) ? reviews : [reviews];
      const latestReview = reviewArray[reviewArray.length - 1];
      if (latestReview) {
        setRating(String(latestReview.rating));
        setComment(latestReview.comment || '');
      }
    } else {
      setRating('');
      setComment('');
    }
    setEditingReviewIndex(null);
  }, [selectedAssignee]);

  const getMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const calculateOverallRating = () => {
    let allRatings = [];
    
    Object.values(allUserReviews).forEach(reviews => {
      reviews.forEach(review => {
        if (review && review.rating) {
          allRatings.push(review.rating);
        }
      });
    });
    
    if (allRatings.length === 0) return 0;
    const sum = allRatings.reduce((acc, rating) => acc + rating, 0);
    return (sum / allRatings.length).toFixed(1);
  };

  const getMonthlyRatings = () => {
    const monthlyData = {};
    
    Object.keys(allUserReviews).forEach(assigneeId => {
      const reviews = allUserReviews[assigneeId];
      
      reviews.forEach(review => {
        if (review && review.monthKey) {
          if (!monthlyData[review.monthKey]) {
            monthlyData[review.monthKey] = {};
          }
          if (!monthlyData[review.monthKey][assigneeId]) {
            monthlyData[review.monthKey][assigneeId] = [];
          }
          monthlyData[review.monthKey][assigneeId].push(review.rating);
        }
      });
    });
    
    return Object.keys(monthlyData).sort().reverse().map(monthKey => {
      const assigneeRatings = monthlyData[monthKey];
      const date = new Date(monthKey + '-01');
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const results = [];
      Object.keys(assigneeRatings).forEach(assigneeId => {
        const ratings = assigneeRatings[assigneeId];
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const total = ratings.reduce((a, b) => a + b, 0);
        const user = users?.find(u => u.id === assigneeId);
        results.push({
          monthKey,
          assigneeId,
          assigneeName: user?.name || 'Unknown',
          avg: avg.toFixed(1),
          total: total.toFixed(1),
          count: ratings.length
        });
      });
      
      return { monthKey, monthName, results };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isManager || !selectedAssignee) return;
    if (rating === '' || Number.isNaN(Number(rating))) return;

    setSaving(true);
    try {
      const monthKey = getMonthKey();
      const updatedReview = {
        rating: Math.max(1, Math.min(10, Number(rating))),
        comment: comment?.trim() || '',
        reviewerId: currentUser?.uid,
        reviewerName: currentUser?.name,
        createdAt: new Date().toISOString(),
        monthKey
      };

      const userReviews = existingReviews[selectedAssignee] ? 
        (Array.isArray(existingReviews[selectedAssignee]) ? existingReviews[selectedAssignee] : [existingReviews[selectedAssignee]])
        : [];
      
      let updatedUserReviews;
      if (editingReviewIndex !== null && editingReviewIndex >= 0 && editingReviewIndex < userReviews.length) {
        updatedUserReviews = [...userReviews];
        updatedUserReviews[editingReviewIndex] = updatedReview;
      } else {
        updatedUserReviews = [...userReviews, updatedReview];
      }
      
      const updatedReviews = {
        ...existingReviews,
        [selectedAssignee]: updatedUserReviews
      };

      await onSave({
        reviews: updatedReviews
      });
      setIsEditing(false);
      setEditingReviewIndex(null);
    } finally {
      setSaving(false);
    }
  };

  const monthlyRatings = getMonthlyRatings();
  const selectedReviewData = selectedAssignee ? existingReviews[selectedAssignee] : null;
  const selectedReview = selectedReviewData && !Array.isArray(selectedReviewData) ? selectedReviewData : null;

  return (
    <div className="task-review">
      <div className="task-review__header">
        <FiStar size={16} />
        <h4 className="ms-2">Manager Review</h4>
      </div>

      {monthlyRatings.length > 0 && (
        <div className="task-review__monthly">
          <div className="task-review__monthly-header">
            <span className="task-review__monthly-label">Monthly Ratings:</span>
          </div>
          {monthlyRatings.slice(0, 6).map(month => (
            <div key={month.monthKey} className="task-review__monthly-group">
              <div className="task-review__monthly-title">{month.monthName}</div>
              <div className="task-review__monthly-list">
                {month.results.map(result => (
                  <div key={result.assigneeId} className="task-review__monthly-item">
                    <span className="task-review__monthly-assignee">{result.assigneeName}:</span>
                    <span className="task-review__monthly-avg">{result.avg}/10</span>
                    <span className="task-review__monthly-count">({result.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {assignees.length > 1 && (
        <div className="task-review__assignee-select">
          <label className="task-review__label">Review for:</label>
          <select
            className="task-review__input"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
          >
            {assignees.map(assigneeId => {
              const user = users?.find(u => u.id === assigneeId);
              return (
                <option key={assigneeId} value={assigneeId}>
                  {user?.name || 'Unknown'}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {selectedReviewData && Array.isArray(selectedReviewData) && selectedReviewData.length > 0 && !isEditing && (
        <div className="task-review__existing">
          <div className="task-review__row">
            <span className="task-review__label">Latest Review:</span>
            <span className="task-review__value">{selectedReviewData[selectedReviewData.length - 1].rating} / 10</span>
          </div>
          {selectedReviewData[selectedReviewData.length - 1].comment && (
            <div className="task-review__row">
              <span className="task-review__label">Comment:</span>
              <span className="task-review__value">{selectedReviewData[selectedReviewData.length - 1].comment}</span>
            </div>
          )}
          {isManager && (
            <button className="task-review__edit" onClick={() => {
              setEditingReviewIndex(selectedReviewData.length - 1);
              setIsEditing(true);
            }}>Edit Review</button>
          )}
        </div>
      )}
      
      {selectedReview && !isEditing && !Array.isArray(selectedReviewData) && (
        <div className="task-review__existing">
          <div className="task-review__row">
            <span className="task-review__label">Rating:</span>
            <span className="task-review__value">{selectedReview.rating} / 10</span>
          </div>
          {selectedReview.comment && (
            <div className="task-review__row">
              <span className="task-review__label">Comment:</span>
              <span className="task-review__value">{selectedReview.comment}</span>
            </div>
          )}
          {isManager && (
            <button className="task-review__edit" onClick={() => {
              setEditingReviewIndex(0);
              setIsEditing(true);
            }}>Edit Review</button>
          )}
        </div>
      )}

      {isManager && isEditing && (
        <form className="task-review__form" onSubmit={handleSubmit}>
          <div className="task-review__controls">
            <div className="task-review__field">
              <label className="task-review__label">Rating (1–10)</label>
              <select
                className="task-review__input"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option value="" disabled>Select rating</option>
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="task-review__field">
              <label className="task-review__label">Comment</label>
              <textarea
                className="task-review__textarea"
                rows="2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave feedback for the assignee"
              />
            </div>
          </div>
          <div className="task-review__actions">
            {selectedReviewData && (
              <button type="button" className="task-review__cancel" onClick={() => {
                setIsEditing(false);
                setEditingReviewIndex(null);
                if (selectedReviewData) {
                  const reviews = Array.isArray(selectedReviewData) ? selectedReviewData : [selectedReviewData];
                  const latestReview = reviews[reviews.length - 1];
                  if (latestReview) {
                    setRating(String(latestReview.rating));
                    setComment(latestReview.comment || '');
                  }
                }
              }}>Cancel</button>
            )}
            <button type="submit" className="task-review__submit" disabled={saving || rating === ''}>
              <FiCheck size={12} />
              <span>Save Review</span>
            </button>
          </div>
        </form>
      )}

      {isManager && !selectedReviewData && !isEditing && (
        <button className="task-review__edit" onClick={() => setIsEditing(true)}>
          Add Review
        </button>
      )}
    </div>
  );
});

TaskReview.displayName = 'TaskReview';

export default TaskReview;


