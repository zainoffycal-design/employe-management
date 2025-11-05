import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiClock, FiCheckCircle, FiTrendingUp, FiUser, FiChevronDown, FiChevronUp, FiMessageSquare, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SlideModal from "../SlideModal";
import TaskDetails from "../TaskDetails";
import "./ProjectCard.scss";

const ProjectCard = memo(({ project, taskCount = 0, index = 0, tasks = [], variant = "full", users = [], isCompleted = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleCardClick = () => {
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

  return (
    <motion.div
      className={`project-card ${variant === "dashboard" ? "dashboard-variant" : ""} ${isCompleted ? "completed" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}>
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

      <div className="project-progress">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {variant !== "dashboard" && (
        <div className="project-stats">
          <div className="stat-item">
            <FiUsers size={14} />
            <span>{project.teamMembers?.length || 0}</span>
            <small>Members</small>
          </div>
          <div className="stat-item">
            <FiClock size={14} />
            <span>{todoTasks}</span>
            <small>To Do</small>
          </div>
          <div className="stat-item">
            <FiTrendingUp size={14} />
            <span>{inProgressTasks}</span>
            <small>In Progress</small>
          </div>
          <div className="stat-item">
            <FiCheckCircle size={14} />
            <span>{completedTasks}</span>
            <small>Done</small>
          </div>
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
