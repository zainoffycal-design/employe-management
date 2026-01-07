import React, { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCheckCircle, FiTrendingUp, FiUser, FiChevronDown, FiChevronUp, FiMessageSquare, FiCalendar, FiDollarSign } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { permissionUtils } from "../../utils/permissionUtils";
import { formatCurrency } from "../../utils/uiUtils";
import SlideModal from "../SlideModal";
import TaskDetails from "../TaskDetails";
import "./ProjectCard.scss";

const ProjectCard = memo(({ project, taskCount = 0, index = 0, tasks = [], variant = "full", users = [], isCompleted = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleCardClick = () => {
    if (location.pathname === '/projects') {
      sessionStorage.setItem('projectManagement_fromProjectBoard', 'true');
    }
    navigate(`/project/${project.id}/board`);
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const completedTasks = projectTasks.filter((task) => task.status === "done").length;
  const inProgressTasks = projectTasks.filter((task) => task.status === "in-progress").length;
  const inReviewTasks = projectTasks.filter((task) => task.status === "in-review").length;
  const todoTasks = projectTasks.filter((task) => task.status === "todo").length;

  const activeTasks = projectTasks.filter((task) => task.status === "in-progress" || task.status === "in-review");

  const progressPercentage = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  const totalProjectHours = useMemo(() => {
    return projectTasks.reduce((sum, task) => sum + (task.totalHours || 0), 0);
  }, [projectTasks]);

  const totalEstimatedHours = useMemo(() => {
    return projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  }, [projectTasks]);

  const timeStats = useMemo(() => {
    if (totalEstimatedHours === 0) return null;
    
    const progressPercentage = totalEstimatedHours > 0 
      ? Math.min((totalProjectHours / totalEstimatedHours) * 100, 100) 
      : 0;
    const remaining = totalEstimatedHours - totalProjectHours;
    
    return {
      estimated: totalEstimatedHours,
      actual: totalProjectHours,
      remaining,
      progressPercentage
    };
  }, [totalEstimatedHours, totalProjectHours]);

  const budgetStats = useMemo(() => {
    if (!project.budget || project.budget.type === 'none') return null;
    
    if (project.budget.type === 'fixed') {
      const totalBudget = parseFloat(project.budget.fixedBudget || 0);
      const totalReceived = (project.budget.payments || []).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      const remaining = totalBudget - totalReceived;
      const receivedPercentage = totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0;
      
      return {
        type: 'fixed',
        totalBudget,
        totalReceived,
        remaining,
        receivedPercentage
      };
    }
    
    if (project.budget.type === 'hourly') {
      const hourlyRate = parseFloat(project.budget.hourlyRate || 0);
      const estimatedBudget = totalProjectHours * hourlyRate;
      const totalReceived = (project.budget.payments || []).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      const remaining = estimatedBudget - totalReceived;
      const receivedPercentage = estimatedBudget > 0 ? (totalReceived / estimatedBudget) * 100 : 0;
      
      return {
        type: 'hourly',
        hourlyRate,
        totalHours: totalProjectHours,
        estimatedBudget,
        totalReceived,
        remaining,
        receivedPercentage
      };
    }
    
    return null;
  }, [project.budget, totalProjectHours]);

  const { canViewBudget: canViewBudgetFromAuth } = useAuth();
  const canViewBudget = canViewBudgetFromAuth();
  const canAccessBoard = !isCompleted || permissionUtils.isSuperManager(currentUser);

  const handleCardClickWithPermission = () => {
    if (!canAccessBoard) {
      return;
    }
    handleCardClick();
  };

  return (
    <motion.div
      className={`project-card ${variant === "dashboard" ? "dashboard-variant" : ""} ${isCompleted ? "completed" : ""} ${!canAccessBoard ? "no-access" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleCardClickWithPermission}
      style={{ cursor: canAccessBoard ? "pointer" : "not-allowed" }}
      title={!canAccessBoard ? "You don't have permission to access completed projects. Only super managers can access completed project boards." : ""}>
      <div className="project-card-header">
        {variant !== "dashboard" && activeTasks.length > 0 && (
          <button className="expand-button" onClick={handleExpandClick} title={isExpanded ? "Collapse tasks" : "Expand tasks"}>
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        )}
        <div className="project-info">
          <div className="project-title-wrapper">
            <h3 className="project-title">{project.name}</h3>
            {isCompleted && (
              <span className="completed-badge">
                <FiCheckCircle size={14} />
                Completed
              </span>
            )}
          </div>
          <p className="project-description">{project.description}</p>
        </div>
      </div>
      {(project.projectType || project.priority) && (
        <div className="project-badges">
          {project.projectType && (
            <span className={`project-badge project-badge--type project-badge--${project.projectType}`}>
              {project.projectType === 'long-term' ? 'Long Term' : 
               project.projectType === 'short-term' ? 'Short Term' : 
               project.projectType === 'other' ? 'Other' : project.projectType}
            </span>
          )}
          {project.priority && (
            <span className={`project-badge project-badge--priority project-badge--${project.priority}`}>
              {project.priority === 'high' ? 'High' : 
               project.priority === 'medium' ? 'Medium' : 
               project.priority === 'low' ? 'Low' : project.priority}
            </span>
          )}
        </div>
      )}

      <div className="project-progress">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {canViewBudget && budgetStats && variant !== "dashboard" && (
        <div className="project-info-card budget">
          {budgetStats.type === 'fixed' && (
            <>
              <div className="info-header">
                <div className="info-title">
                  <FiDollarSign size={14} />
                  <span>Budget</span>
                </div>
                <span className="info-total">${formatCurrency(budgetStats.totalBudget)}</span>
              </div>
              <div className="info-progress-bar">
                <div 
                  className="info-progress-fill" 
                  style={{ width: `${Math.min(budgetStats.receivedPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="info-details">
                <div className="info-item">
                  <span className="info-label">Received</span>
                  <span className="info-value positive">${formatCurrency(budgetStats.totalReceived)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{budgetStats.remaining < 0 ? 'Bonus' : 'Remaining'}</span>
                  <span className={`info-value ${budgetStats.remaining < 0 ? 'bonus' : ''}`}>
                    {budgetStats.remaining < 0 ? `+$${formatCurrency(Math.abs(budgetStats.remaining))}` : `$${formatCurrency(budgetStats.remaining)}`}
                  </span>
                </div>
              </div>
            </>
          )}
          {budgetStats.type === 'hourly' && (
            <>
              <div className="info-header">
                <div className="info-title">
                  <FiClock size={14} />
                  <span>Hour-Based Budget</span>
                </div>
                <span className="info-total">${formatCurrency(budgetStats.hourlyRate)}/hr</span>
              </div>
              <div className="info-progress-bar">
                <div 
                  className="info-progress-fill" 
                  style={{ width: `${Math.min(budgetStats.receivedPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="info-details">
                <div className="info-item">
                  <span className="info-label">Received</span>
                  <span className="info-value positive">${formatCurrency(budgetStats.totalReceived)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Estimated</span>
                  <span className="info-value">${formatCurrency(budgetStats.estimatedBudget)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{budgetStats.remaining < 0 ? 'Bonus' : 'Remaining'}</span>
                  <span className={`info-value ${budgetStats.remaining < 0 ? 'bonus' : ''}`}>
                    {budgetStats.remaining < 0 ? `+$${formatCurrency(Math.abs(budgetStats.remaining))}` : `$${formatCurrency(budgetStats.remaining)}`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {variant !== "dashboard" && timeStats && (
        <div className="project-info-card time">
          <div className="info-header">
            <div className="info-title">
              <FiClock size={14} />
              <span>Time Estimate</span>
            </div>
            <span className="info-total">{timeStats.estimated.toFixed(1)}h</span>
          </div>
          {timeStats.estimated > 0 && (
            <>
              <div className="info-progress-bar">
                <div 
                  className="info-progress-fill" 
                  style={{ 
                    width: `${Math.min(timeStats.progressPercentage, 100)}%`,
                    backgroundColor: timeStats.actual > timeStats.estimated ? '#ef4444' : '#15A970'
                  }}
                ></div>
              </div>
              <div className="info-details">
                <div className="info-item">
                  <span className="info-label">Actual</span>
                  <span className={`info-value ${timeStats.actual > timeStats.estimated ? 'negative' : ''}`}>
                    {timeStats.actual.toFixed(1)}h
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{timeStats.remaining < 0 ? 'Overdue Time' : 'Remaining'}</span>
                  <span className={`info-value ${timeStats.remaining < 0 ? 'negative' : ''}`}>
                    {timeStats.remaining >= 0 ? `+${timeStats.remaining.toFixed(1)}h` : `${Math.abs(timeStats.remaining).toFixed(1)}h`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {variant !== "dashboard" && (
        <>
          <AnimatePresence>
            {isExpanded && activeTasks.length > 0 && (
              <motion.div
                className="project-tasks-expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}>
                <div className="tasks-section">
                  {inProgressTasks > 0 && (
                    <div className="task-group">
                      <div className="task-group-header">
                        <FiTrendingUp size={14} />
                        <span>In Progress ({inProgressTasks})</span>
                      </div>
                      <div className="task-list-scroll">
                        <div className="task-list">
                          {projectTasks
                            .filter((task) => task.status === "in-progress")
                            .map((task) => {
                              const assignee = Array.isArray(task.assignee)
                                ? task.assignee.map((id) => users.find((u) => u.id === id)?.name || "Unknown").join(", ")
                                : users.find((u) => u.id === task.assignee)?.name || "Unknown";
                              return (
                                <div key={task.id} className="task-item" onClick={(e) => handleTaskClick(e, task)}>
                                  <div className="task-item-content">
                                    <span className="task-title">{task.title}</span>
                                    {task.description && <p className="task-description">{task.description.replace(/<[^>]*>/g, "").trim()}</p>}
                                    <div className="task-meta">
                                      {assignee && (
                                        <span className="task-assignee">
                                          <FiUser size={11} />
                                          {assignee}
                                        </span>
                                      )}
                                      {task.deadline && (
                                        <span className="task-deadline">
                                          <FiCalendar size={11} />
                                          {new Date(task.deadline).toLocaleDateString()}
                                        </span>
                                      )}
                                      {task.comments && task.comments.length > 0 && (
                                        <span className="task-comments">
                                          <FiMessageSquare size={11} />
                                          {task.comments.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {inReviewTasks > 0 && (
                    <div className="task-group">
                      <div className="task-group-header">
                        <FiCheckCircle size={14} />
                        <span>In Review ({inReviewTasks})</span>
                      </div>
                      <div className="task-list-scroll">
                        <div className="task-list">
                          {projectTasks
                            .filter((task) => task.status === "in-review")
                            .map((task) => {
                              const assignee = Array.isArray(task.assignee)
                                ? task.assignee.map((id) => users.find((u) => u.id === id)?.name || "Unknown").join(", ")
                                : users.find((u) => u.id === task.assignee)?.name || "Unknown";
                              return (
                                <div key={task.id} className="task-item" onClick={(e) => handleTaskClick(e, task)}>
                                  <div className="task-item-content">
                                    <span className="task-title">{task.title}</span>
                                    {task.description && <p className="task-description">{task.description.replace(/<[^>]*>/g, "").trim()}</p>}
                                    <div className="task-meta">
                                      {assignee && (
                                        <span className="task-assignee">
                                          <FiUser size={11} />
                                          {assignee}
                                        </span>
                                      )}
                                      {task.deadline && (
                                        <span className="task-deadline">
                                          <FiCalendar size={11} />
                                          {new Date(task.deadline).toLocaleDateString()}
                                        </span>
                                      )}
                                      {task.comments && task.comments.length > 0 && (
                                        <span className="task-comments">
                                          <FiMessageSquare size={11} />
                                          {task.comments.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentUser?.role === "super_manager" && (
            <div className="project-creator">
              <FiUser size={12} />
              <span>
                Created by:{" "}
                {(() => {
                  if (users.length === 0) return "Loading...";

                  const managerId = project.managerId || currentUser.uid;
                  const creator = users.find((user) => user.id === managerId);

                  if (!creator) {
                    if (managerId === currentUser.uid) {
                      return currentUser.displayName || currentUser.email || "You";
                    }
                    return "Unknown User";
                  }
                  return creator.name;
                })()}
              </span>
              {project.createdAt && <span className="creation-date">• {new Date(project.createdAt).toLocaleDateString()}</span>}
            </div>
          )}
        </>
      )}

      <SlideModal
        isOpen={showTaskDetails}
        onClose={() => {
          setShowTaskDetails(false);
          setSelectedTask(null);
        }}
        title="Task Details"
        width="600px"
      >
        {selectedTask && (
          <TaskDetails
            task={selectedTask}
            onClose={() => {
              setShowTaskDetails(false);
              setSelectedTask(null);
            }}
            users={users}
            project={project}
          />
        )}
      </SlideModal>
    </motion.div>
  );
});

ProjectCard.displayName = "ProjectCard";

export default ProjectCard;
