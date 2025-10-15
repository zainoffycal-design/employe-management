import { useState } from 'react';
import { FiCheckCircle, FiPlus, FiPackage } from 'react-icons/fi';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import { reactSelectStyles } from '../../utils/uiUtils';
import Select from 'react-select';

const AssetApprovalModal = ({
  isOpen,
  request,
  availableAssets = [],
  users = [],
  onAssignExisting,
  onCreateNew,
  onClose
}) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState('existing'); // 'existing' or 'new'

  const availableAssetsOptions = availableAssets.map(asset => ({
    value: asset.id,
    label: `${asset.name} (${asset.brand})`,
    asset: asset
  }));

  const CustomAssetOption = ({ children, ...props }) => {
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
        <FiPackage style={{ marginRight: '8px', color: '#64748b' }} />
        <div>
          <div style={{ fontSize: '0.875rem', color: '#334155' }}>{data.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Serial: {data.asset.serialNumber}</div>
        </div>
      </div>
    );
  };

  const handleSubmit = () => {
    if (actionType === 'existing' && selectedAsset) {
      const asset = availableAssets.find(a => a.id === selectedAsset.value);
      onAssignExisting(request.id, asset.id);
    } else if (actionType === 'new') {
      onCreateNew(request.id);
    }
    onClose();
  };

  const resetModal = () => {
    setSelectedAsset(null);
    setActionType('existing');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!request) return null;

  const requestedUser = users.find(user => user.id === request.requestedBy);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Approve Asset Request"
      size="large"
    >
      <div className="approval-modal-content">
        <div className="request-summary">
          <h4>Request Details</h4>
          <div className="request-info">
            <div className="request-user">
              <Avatar 
                src={requestedUser?.avatar}
                name={requestedUser?.name}
                size="small"
              />
              <div>
                <strong>{requestedUser?.name}</strong>
                <p>Requested: {request.assetType === 'custom' ? request.customType : request.assetType}</p>
              </div>
            </div>
            <div className="request-meta">
              <p><strong>Priority:</strong> {request.priority}</p>
              <p><strong>Description:</strong> {request.description}</p>
            </div>
          </div>
        </div>

        <div className="approval-options">
          <h4>Choose Approval Method</h4>
          
          <div className="option-tabs">
            <button
              className={`option-tab ${actionType === 'existing' ? 'active' : ''}`}
              onClick={() => setActionType('existing')}
            >
              <FiPackage />
              Assign Existing Asset
            </button>
            <button
              className={`option-tab ${actionType === 'new' ? 'active' : ''}`}
              onClick={() => setActionType('new')}
            >
              <FiPlus />
              Create New Asset
            </button>
          </div>

          {actionType === 'existing' && (
            <div className="asset-selection">
              <label>Select Available Asset</label>
              <Select
                options={availableAssetsOptions}
                value={selectedAsset}
                onChange={setSelectedAsset}
                placeholder="Choose an available asset..."
                styles={reactSelectStyles}
                components={{ Option: CustomAssetOption }}
                className="asset-select"
                classNamePrefix="asset-select"
                isSearchable
              />
              {availableAssets.length === 0 && (
                <p className="no-assets-message">
                  No available assets of this type. Consider creating a new asset.
                </p>
              )}
            </div>
          )}

          {actionType === 'new' && (
            <div className="new-asset-info">
              <div className="info-card">
                <FiPlus className="info-icon" />
                <div>
                  <h5>Create New Asset</h5>
                  <p>This will open the "Add Asset" form where you can create a new asset and assign it to {requestedUser?.name}.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button 
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={actionType === 'existing' && !selectedAsset}
          >
            <FiCheckCircle />
            {actionType === 'existing' ? 'Assign Asset' : 'Create New Asset'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssetApprovalModal;
