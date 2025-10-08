import React, { useState, useCallback, useMemo, memo } from 'react';
import { FiClock, FiEdit3, FiTrash2, FiPlus } from 'react-icons/fi';
import './TimeTracker.scss';

const TimeTracker = memo(({ task, onUpdate, disabled = false, currentUser, users = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHours, setTempHours] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [filterUser, setFilterUser] = useState('all');

  const totalHours = task?.totalHours || 0;

  const addManualHours = async () => {
    if (disabled || !tempHours || parseFloat(tempHours) <= 0) return;
    
    const hoursToAdd = parseFloat(tempHours);
    const newTotalHours = (task?.totalHours || 0) + hoursToAdd;
    
    if (onUpdate) {
      await onUpdate({
        totalHours: newTotalHours,
        timeEntries: [
          ...(task?.timeEntries || []),
          {
            id: Date.now().toString(),
            hours: hoursToAdd,
            date: new Date().toISOString(),
            description: '',
            userId: currentUser?.uid || currentUser?.id,
            userName: currentUser?.name || 'Unknown User'
          }
        ]
      });
    }
    
    setTempHours('');
    setIsEditing(false);
  };

  const editTimeEntry = (entryId) => {
    const entry = task?.timeEntries?.find(e => e.id === entryId);
    if (entry) {
      setTempHours(entry.hours.toString());
      setEditingEntryId(entryId);
      setIsEditing(true);
    }
  };

  const updateTimeEntry = async () => {
    if (disabled || !tempHours || parseFloat(tempHours) <= 0 || !editingEntryId) return;
    
    const newHours = parseFloat(tempHours);
    const entry = task?.timeEntries?.find(e => e.id === editingEntryId);
    const oldHours = entry?.hours || 0;
    const hoursDifference = newHours - oldHours;
    
    if (onUpdate) {
      const updatedEntries = task?.timeEntries?.map(e => 
        e.id === editingEntryId 
          ? { ...e, hours: newHours }
          : e
      ) || [];
      
      await onUpdate({
        totalHours: (task?.totalHours || 0) + hoursDifference,
        timeEntries: updatedEntries
      });
    }
    
    setTempHours('');
    setIsEditing(false);
    setEditingEntryId(null);
  };

  const deleteTimeEntry = async (entryId) => {
    if (disabled) return;
    
    const entry = task?.timeEntries?.find(e => e.id === entryId);
    if (!entry) return;
    
    if (onUpdate) {
      const updatedEntries = task?.timeEntries?.filter(e => e.id !== entryId) || [];
      
      await onUpdate({
        totalHours: (task?.totalHours || 0) - (entry.hours || 0),
        timeEntries: updatedEntries
      });
    }
  };

  const formatHours = (hours) => {
    if (!hours || isNaN(hours) || hours === 0) return '0h';
    return hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`;
  };

  return (
    <div className="time-tracker">
      <div className="time-tracker-header">
        <div className="time-icon">
          <FiClock size={16} />
        </div>
        <span className="time-label">Time Tracking</span>
        <div className="total-hours">
          {formatHours(totalHours)}
        </div>
      </div>

      <div className="manual-time">
        {!isEditing ? (
          <button
            className="manual-btn"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            <FiPlus size={14} />
            Add Time Entry
          </button>
        ) : (
          <div className="manual-input">
            <input
              type="number"
              value={tempHours}
              onChange={(e) => setTempHours(e.target.value)}
              placeholder="Hours"
              min="0"
              step="0.25"
              className="hours-input"
            />
            <div className="input-actions">
              <button
                className="save-btn"
                onClick={editingEntryId ? updateTimeEntry : addManualHours}
                disabled={!tempHours || parseFloat(tempHours) <= 0}
              >
                {editingEntryId ? 'Update' : 'Add'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setTempHours('');
                  setIsEditing(false);
                  setEditingEntryId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {task?.timeEntries && task.timeEntries.length > 0 && (
        <div className="time-entries">
          <div className="entries-header">
            <span>Time Entries</span>
            {users.length > 1 && (
              <select 
                value={filterUser} 
                onChange={(e) => setFilterUser(e.target.value)}
                className="user-filter"
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="entries-list">
            {task.timeEntries
              .filter(entry => filterUser === 'all' || entry.userId === filterUser)
              .slice()
              .reverse()
              .map((entry) => {
                const entryUser = users.find(u => u.id === entry.userId || u.uid === entry.userId);
                const canEdit = !disabled && (entry.userId === currentUser?.uid || entry.userId === currentUser?.id);
                
                return (
                  <div key={entry.id} className="time-entry">
                    <div className="entry-info">
                      <div className="entry-date">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="entry-user">
                        {entryUser?.name || entry.userName || 'Unknown User'}
                      </div>
                      <div className="entry-duration">
                        {formatHours(entry.hours)}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="entry-actions">
                        <button
                          className="edit-btn"
                          onClick={() => editTimeEntry(entry.id)}
                          title="Edit entry"
                        >
                          <FiEdit3 size={12} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteTimeEntry(entry.id)}
                          title="Delete entry"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
});

TimeTracker.displayName = 'TimeTracker';

export default TimeTracker;
