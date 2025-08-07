import React from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiUsers, FiClock, FiCheckCircle, FiTrendingUp, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ProjectCard.scss';

const ProjectCard = ({ 
  project, 
  taskCount = 0, 
  index = 0,
  tasks = [],
  variant = "full",
  users = []
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleCardClick = () => {
    navigate(`/project/${project.id}/board`);
  };



  const projectTasks = tasks.filter(task => task.projectId === project.id);
  const completedTasks = projectTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = projectTasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = projectTasks.filter(task => task.status === 'todo').length;
  
  const progressPercentage = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  return (
    <motion.div
      className={`project-card ${variant === 'dashboard' ? 'dashboard-variant' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="project-card-header">
        <div className="project-icon">
          <FiFolder size={20} />
        </div>
        <div className="project-info">
          <h3 className="project-title">{project.name}</h3>
          <p className="project-description">{project.description}</p>
        </div>
      </div>
      
      <div className="project-progress">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {variant !== 'dashboard' && (
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
      

      
      {variant !== 'dashboard' && currentUser?.role === 'super_manager' && (
        <div className="project-creator">
          <FiUser size={12} />
          <span>Created by: {(() => {
            if (users.length === 0) return 'Loading...';
            
            const managerId = project.managerId || currentUser.uid;
            const creator = users.find(user => user.id === managerId);
            
            console.log('Debug creator lookup:', {
              projectName: project.name,
              managerId,
              currentUserId: currentUser.uid,
              usersCount: users.length,
              foundCreator: creator,
              allUsers: users.map(u => ({ id: u.id, name: u.name, role: u.role }))
            });
            
            if (!creator) {
              if (managerId === currentUser.uid) {
                return currentUser.displayName || currentUser.email || 'You';
              }
              return 'Unknown User';
            }
            return creator.name;
          })()}</span>
          {project.createdAt && (
            <span className="creation-date">
              • {new Date(project.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard; 