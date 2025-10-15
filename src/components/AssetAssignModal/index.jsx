import { reactSelectStyles } from '../../utils/uiUtils';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import Select from 'react-select';

const AssetAssignModal = ({
  isOpen,
  asset,
  users = [],
  onAssign,
  onClose
}) => {
  const userOptions = users
    .filter(user => user.isActive !== false)
    .map(user => ({
      value: user.id,
      label: user.name,
      role: user.role === 'super_manager' ? 'Super Manager' : 
            user.role === 'manager' ? 'Manager' :
            user.role.charAt(0).toUpperCase() + user.role.slice(1),
      avatar: user.avatar
    }));

  const CustomOption = ({ children, ...props }) => {
    const { data } = props;
    return (
      <div 
        {...props.innerProps} 
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          backgroundColor: props.isFocused ? '#f8fafc' : 'white',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar 
          src={data.avatar} 
          name={data.label}
          size="small"
          style={{ marginRight: '8px' }}
        />
        <div>
          <div style={{ fontSize: '0.875rem', color: '#334155' }}>{data.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.role}</div>
        </div>
      </div>
    );
  };

  const handleUserSelect = (selected) => {
    if (selected) {
      onAssign(asset.id, selected.value);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Asset"
      size="small"
    >
      {asset && (
        <div>
          <div className="assign-asset-info">
            <h4>{asset.name}</h4>
            <p>Select a user to assign this asset to:</p>
          </div>
          
          <div className="form-group">
            <Select
              options={userOptions}
              onChange={handleUserSelect}
              placeholder="Search and select user..."
              styles={reactSelectStyles}
              components={{ Option: CustomOption }}
              className="user-select"
              classNamePrefix="user-select"
              isSearchable
            />
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AssetAssignModal;
