import { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';

const AssetRequestModal = ({
  isOpen,
  onSave,
  onClose,
  loading = false,
  error = ''
}) => {
  const [formData, setFormData] = useState({
    assetType: '',
    customType: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        assetType: '',
        customType: '',
        description: '',
        priority: 'medium'
      });
    }
  }, [isOpen]);

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

  const getPriorityOptions = () => [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Asset"
      size="medium"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="assetType">Asset Type</label>
          <select
            id="assetType"
            name="assetType"
            value={formData.assetType}
            onChange={(e) => handleInputChange('assetType', e.target.value)}
            required
          >
            {getAssetTypes().map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {formData.assetType === 'custom' && (
          <div className="form-group">
            <label htmlFor="customRequestType">Custom Asset Type</label>
            <input
              type="text"
              id="customRequestType"
              name="customType"
              value={formData.customType}
              onChange={(e) => handleInputChange('customType', e.target.value)}
              placeholder="Enter custom asset type"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            required
          >
            {getPriorityOptions().map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows="4"
            placeholder="Describe why you need this asset..."
            required
          />
        </div>

        <div className="modal-actions">
          <Button 
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            type="submit" 
            loading={loading}
            loadingText="Submitting Request..."
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssetRequestModal;
