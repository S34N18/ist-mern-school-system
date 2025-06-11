import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../styles/Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('month'); // month, agenda
  const [selectedDate, setSelectedDate] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments...'); // Debug log
      
      // Use the existing assignments endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result); // Debug log
        
        // Handle the response structure from your backend
        const assignmentsData = result.success ? result.data : result;
        
        // Transform the data to match what the calendar expects
        const formattedAssignments = assignmentsData.map(assignment => ({
          id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          classroom: {
            name: assignment.classroomId?.name || assignment.classroom?.name || 'Unknown Course'
          },
          submitted: false, // You'll need to determine this based on your submission tracking
          attachments: assignment.attachments || []
        }));
        
        console.log('Formatted assignments:', formattedAssignments); // Debug log
        setAssignments(formattedAssignments);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(`Failed to fetch assignments: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`Error loading assignments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get first day of month and how many days in month
  const getMonthInfo = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { firstDay, lastDay, daysInMonth, startingDayOfWeek };
  };

  // Generate calendar days including previous/next month padding
  const generateCalendarDays = () => {
    const { daysInMonth, startingDayOfWeek } = getMonthInfo();
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Get assignments for a specific date
  const getAssignmentsForDate = (day) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    
    return assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate.toDateString() === dateStr;
    });
  };

  // Get upcoming assignments
  const getUpcomingAssignments = (days = 14) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return assignments
      .filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= futureDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  // Check if a date is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  // Check if assignment is overdue
  const isOverdue = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    return dueDate < now && !assignment.submitted;
  };

  // Navigate between months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your assignment calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-message">
          <h3>Unable to Load Calendar</h3>
          <p>{error}</p>
          <button onClick={fetchAssignments} className="btn btn-primary">
            Try Again
          </button>
          <div className="debug-info" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <p>Debug info:</p>
            <p>User: {user?.id ? `ID: ${user.id}` : 'No user'}</p>
            <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <div>
            <h1>Assignment Calendar</h1>
            <p>Keep track of your assignment due dates and deadlines</p>
          </div>
          <div className="header-actions">
            <button onClick={goToToday} className="btn btn-outline">
              Today
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
          onClick={() => setView('month')}
        >
          📅 Month View
        </button>
        <button 
          className={`toggle-btn ${view === 'agenda' ? 'active' : ''}`}
          onClick={() => setView('agenda')}
        >
          📋 Agenda View
        </button>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {view === 'month' ? (
          // Month View
          <div className="month-view">
            {/* Month Navigation */}
            <div className="month-navigation">
              <button onClick={() => navigateMonth(-1)} className="nav-btn">
                ← Previous
              </button>
              <h2 className="month-title">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => navigateMonth(1)} className="nav-btn">
                Next →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Day Headers */}
              <div className="day-headers">
                {dayNames.map(day => (
                  <div key={day} className="day-header">{day}</div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="calendar-days">
                {generateCalendarDays().map((day, index) => {
                  const dayAssignments = getAssignmentsForDate(day);
                  const hasAssignments = dayAssignments.length > 0;
                  const hasOverdue = dayAssignments.some(isOverdue);
                  
                  return (
                    <div 
                      key={index}
                      className={`calendar-day ${day ? 'valid-day' : 'empty-day'} ${isToday(day) ? 'today' : ''} ${hasAssignments ? 'has-assignments' : ''}`}
                      onClick={() => day && setSelectedDate(day)}
                    >
                      {day && (
                        <>
                          <div className="day-number">{day}</div>
                          {hasAssignments && (
                            <div className="assignment-indicators">
                              {dayAssignments.slice(0, 3).map((assignment, i) => (
                                <div 
                                  key={assignment.id}
                                  className={`assignment-dot ${isOverdue(assignment) ? 'overdue' : ''} ${assignment.submitted ? 'completed' : 'pending'}`}
                                  title={assignment.title}
                                />
                              ))}
                              {dayAssignments.length > 3 && (
                                <div className="more-indicator">+{dayAssignments.length - 3}</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="selected-date-details">
                <h3>
                  {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
                </h3>
                {getAssignmentsForDate(selectedDate).length > 0 ? (
                  <div className="date-assignments">
                    {getAssignmentsForDate(selectedDate).map(assignment => (
                      <div key={assignment.id} className={`assignment-item ${isOverdue(assignment) ? 'overdue' : ''}`}>
                        <div className="assignment-info">
                          <h4>{assignment.title}</h4>
                          <p className="course">{assignment.classroom?.name}</p>
                          <p className="due-time">Due: {formatTime(assignment.dueDate)}</p>
                        </div>
                        <div className="assignment-actions">
                          <Link to={`/assignments/${assignment.id}`} className="btn btn-sm">
                            View
                          </Link>
                          {!assignment.submitted && (
                            <Link to={`/assignments/${assignment.id}/submit`} className="btn btn-sm btn-primary">
                              Submit
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-assignments-day">No assignments due on this date.</p>
                )}
                <button onClick={() => setSelectedDate(null)} className="close-details">
                  ✕ Close
                </button>
              </div>
            )}
          </div>
        ) : (
          // Agenda View
          <div className="agenda-view">
            <h2>Upcoming Assignments</h2>
            {getUpcomingAssignments().length === 0 ? (
              <div className="no-upcoming">
                <div className="no-upcoming-icon">📅</div>
                <h3>All caught up!</h3>
                <p>You have no assignments due in the next 2 weeks.</p>
              </div>
            ) : (
              <div className="agenda-list">
                {getUpcomingAssignments().map(assignment => {
                  const daysUntil = getDaysUntilDue(assignment.dueDate);
                  const urgency = daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'soon' : 'normal';
                  
                  return (
                    <div 
                      key={assignment.id}
                      className={`agenda-item ${urgency} ${assignment.submitted ? 'completed' : ''} ${isOverdue(assignment) ? 'overdue' : ''}`}
                    >
                      <div className="assignment-date">
                        <div className="date-info">
                          <div className="day">{new Date(assignment.dueDate).getDate()}</div>
                          <div className="month">{monthNames[new Date(assignment.dueDate).getMonth()].slice(0, 3)}</div>
                        </div>
                        <div className="time-info">
                          <div className="time">{formatTime(assignment.dueDate)}</div>
                          <div className="days-left">
                            {daysUntil === 0 ? 'Today' : 
                             daysUntil === 1 ? 'Tomorrow' : 
                             daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                             `${daysUntil} days left`}
                          </div>
                        </div>
                      </div>

                      <div className="assignment-content">
                        <div className="assignment-header">
                          <h3>{assignment.title}</h3>
                          <span className="course-badge">{assignment.classroom?.name}</span>
                        </div>
                        
                        {assignment.description && (
                          <p className="assignment-description">{assignment.description}</p>
                        )}

                        <div className="assignment-meta">
                          <div className="status-info">
                            {assignment.submitted ? (
                              <span className="status completed">✅ Submitted</span>
                            ) : isOverdue(assignment) ? (
                              <span className="status overdue">⚠️ Overdue</span>
                            ) : (
                              <span className="status pending">⏳ Pending</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="assignment-actions">
                        <Link 
                          to={`/assignments/${assignment.id}`}
                          className="btn btn-outline"
                        >
                          View Details
                        </Link>
                        {!assignment.submitted && (
                          <Link 
                            to={`/assignments/${assignment.id}/submit`}
                            className="btn btn-primary"
                          >
                            Submit Now
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="calendar-stats">
        <div className="stats-grid">
          <div className="stat-item urgent">
            <div className="stat-value">{assignments.filter(a => getDaysUntilDue(a.dueDate) <= 1 && !a.submitted).length}</div>
            <div className="stat-label">Due Today/Tomorrow</div>
          </div>
          <div className="stat-item warning">
            <div className="stat-value">{getUpcomingAssignments(7).length}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-item danger">
            <div className="stat-value">{assignments.filter(isOverdue).length}</div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-item success">
            <div className="stat-value">{assignments.filter(a => a.submitted).length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;


// 🔴 Red: Overdue assignments
// 🟡 Yellow: Due soon (1-3 days)
// 🔵 Blue: Normal assignments
// 🟢 Green: Completed assignments