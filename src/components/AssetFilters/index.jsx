import { FiSearch, FiX } from 'react-icons/fi';
import Button from '../Button';

const AssetFilters = ({
  searchTerm,
  filterType,
  filterUser,
  users = [],
  onSearchChange,
  onFilterChange,
  onUserFilterChange,
  onClearFilters
}) => {
  const getAssetTypes = () => [
    { value: 'laptop', label: 'Laptop' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'mouse', label: 'Mouse' },
    { value: 'keyboard', label: 'Keyboard' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'phone', label: 'Phone' },
    { value: 'router', label: 'Router' },
    { value: 'storage', label: 'Storage Device' },
    { value: 'custom', label: 'Custom' },
  ];

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterUser !== 'all';

  return (
    <div className="filters-container">
      <div className="search-box">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <select
        value={filterType}
        onChange={(e) => onFilterChange(e.target.value)}
        className="filter-select"
      >
        <option value="all">All Types</option>
        {getAssetTypes().map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      
      <select
        value={filterUser}
        onChange={(e) => onUserFilterChange(e.target.value)}
        className="filter-select"
      >
        <option value="all">All Users</option>
        {users.filter(user => user.isActive !== false).map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      
      {hasActiveFilters && (
        <Button 
          variant="secondary"
          size="small"
          onClick={onClearFilters}
          className="clear-filters-btn"
        >
          <FiX /> Clear Filters
        </Button>
      )}
    </div>
  );
};

export default AssetFilters;
