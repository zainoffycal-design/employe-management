import { motion } from 'framer-motion';
import { FiPackage, FiUser, FiShield, FiUserCheck } from 'react-icons/fi';

const AssetStats = ({ stats = {}, loading = false }) => {
  const statCards = [
    {
      title: 'Total Assets',
      value: stats.total || 0,
      icon: FiPackage,
      color: 'primary'
    },
    {
      title: 'Assigned',
      value: stats.assigned || 0,
      icon: FiUserCheck,
      color: 'success'
    },
    {
      title: 'Available',
      value: stats.available || 0,
      icon: FiUser,
      color: 'info'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests || 0,
      icon: FiShield,
      color: 'warning'
    }
  ];

  if (loading) {
    return (
      <div className="assets-stats">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="stat-card loading">
            <div className="stat-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-value"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="assets-stats">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
        <motion.div 
          key={stat.title}
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <div className="stat-icon">
            <Icon />
          </div>
          <div className="stat-info">
            <h3>{stat.value}</h3>
            <p>{stat.title}</p>
          </div>
        </motion.div>
        );
      })}
    </div>
  );
};

export default AssetStats;
