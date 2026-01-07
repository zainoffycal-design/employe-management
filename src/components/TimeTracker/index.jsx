import React, { useState, useCallback, useMemo, memo } from 'react';
import { FiClock, FiEdit3, FiTrash2, FiPlus } from 'react-icons/fi';
import { formatHours } from '../../utils/uiUtils';
import './TimeTracker.scss';

const TimeTracker = memo(({ task, onUpdate, disabled = false, currentUser, users = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHours, setTempHours] = useState('');
  const [timeUnit, setTimeUnit] = useState('hours');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [filterUser, setFilterUser] = useState('all');

  const totalHours = task?.totalHours || 0;

  const parseTimeInput = (input, unit) => {
    if (!input || input.trim() === '') return 0;
    
    if (unit === 'minutes') {
      return parseFloat(input) || 0;
    }
    
    const inputStr = input.trim().toLowerCase();
    
    const colonMatch = inputStr.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
      const hours = parseInt(colonMatch[1]) || 0;
      const minutes = parseInt(colonMatch[2]) || 0;
      return hours + (minutes / 60);
    }
    
    const hMMatch = inputStr.match(/(\d+)\s*h\s*(\d+)\s*m/i);
    if (hMMatch) {
      const hours = parseInt(hMMatch[1]) || 0;
      const minutes = parseInt(hMMatch[2]) || 0;
      return hours + (minutes / 60);
    }
    
    const hMatch = inputStr.match(/(\d+)\s*h/i);
    const mMatch = inputStr.match(/(\d+)\s*m/i);
    if (hMatch || mMatch) {
      const hours = hMatch ? parseInt(hMatch[1]) || 0 : 0;
      const minutes = mMatch ? parseInt(mMatch[1]) || 0 : 0;
      return hours + (minutes / 60);
    }
    
    const decimalMatch = parseFloat(inputStr);
    if (!isNaN(decimalMatch)) {
      return decimalMatch;
    }
    
    return 0;
  };

  const formatTimeForDisplay = (hours) => {
    if (!hours || hours === 0) return '';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h ${minutes}m`;
  };

  const addManualHours = async () => {
    if (disabled || !tempHours || tempHours.trim() === '') return;
    
    let hoursToAdd = parseTimeInput(tempHours, timeUnit);
    if (timeUnit === 'minutes') {
      hoursToAdd = hoursToAdd / 60;
    }
    
    if (hoursToAdd <= 0) return;
    
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
      setTimeUnit('hours');
      setTempHours(formatTimeForDisplay(entry.hours));
      setEditingEntryId(entryId);
      setIsEditing(true);
    }
  };

  const updateTimeEntry = async () => {
    if (disabled || !tempHours || tempHours.trim() === '' || !editingEntryId) return;
    
    let newHours = parseTimeInput(tempHours, timeUnit);
    if (timeUnit === 'minutes') {
      newHours = newHours / 60;
    }
    
    if (newHours <= 0) return;
    
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


  return (
    <div className="time-tracker">
      <div className="time-tracker-header">
        <div className="time-icon">
          <FiClock size={16} />
        <span className="time-label ms-2">Time Tracking</span>
        </div>
        {totalHours > 0 && (
          <div className="total-hours">
            {formatHours(totalHours)}
          </div>
        )}
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
            <div className="time-input-wrapper">
              <input
                type={timeUnit === 'hours' ? 'text' : 'number'}
                value={tempHours}
                onChange={(e) => setTempHours(e.target.value)}
                placeholder={timeUnit === 'hours' ? 'e.g., 1h 30m or 1:30' : 'Minutes'}
                min="0"
                step={timeUnit === 'minutes' ? '1' : undefined}
                className="hours-input"
              />
              <div className="time-unit-selector">
                <button
                  type="button"
                  className={`unit-btn ${timeUnit === 'hours' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('hours')}
                >
                  H
                </button>
                <button
                  type="button"
                  className={`unit-btn ${timeUnit === 'minutes' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('minutes')}
                >
                  M
                </button>
              </div>
            </div>
            <div className="input-actions">
              <button
                className="save-btn"
                onClick={editingEntryId ? updateTimeEntry : addManualHours}
                disabled={!tempHours || tempHours.trim() === '' || parseTimeInput(tempHours, timeUnit) <= 0}
              >
                {editingEntryId ? 'Update' : 'Add'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setTempHours('');
                  setIsEditing(false);
                  setEditingEntryId(null);
                  setTimeUnit('hours');
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
                const canEdit = !disabled && (
                  entry.userId === currentUser?.uid || 
                  entry.userId === currentUser?.id ||
                  currentUser?.role === 'super_manager' ||
                  currentUser?.role === 'manager'
                );
                
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
