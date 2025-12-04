import { useState, useEffect, useRef } from 'react';
import { reactSelectStyles } from '../../utils/uiUtils';
import { firebaseUtils } from '../../utils/firebaseUtils';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import Select from 'react-select';
import { FiX, FiImage } from 'react-icons/fi';

const AssetFormModal = ({ 
  isOpen, 
  mode = 'add', 
  asset = null, 
  users = [], 
  assets = [],
  canManageAssets = false,
  onSave, 
  onClose, 
  loading = false,
  error = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    serialNumber: '',
    assignTo: '',
    assignDate: '',
    description: '',
    customType: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'edit' && asset) {
      setFormData({
        name: asset.name || '',
        type: asset.type || '',
        brand: asset.brand || '',
        serialNumber: asset.serialNumber || '',
        assignTo: asset.assignedTo || '',
        assignDate: asset.assignedAt ? new Date(asset.assignedAt).toISOString().split('T')[0] : '',
        description: asset.description || '',
        customType: asset.customType || '',
        imageUrl: asset.imageUrl || ''
      });
      setImagePreview(asset.imageUrl || null);
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        type: 'laptop',
        brand: '',
        serialNumber: '',
        assignTo: '',
        assignDate: new Date().toISOString().split('T')[0],
        description: '',
        customType: '',
        imageUrl: ''
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setImageError('');
  }, [mode, asset, isOpen]);

  const getStandardTypes = () => [
    'laptop',
    'monitor',
    'mouse',
    'keyboard',
    'headphones',
    'phone',
    'router',
    'storage'
  ];

  const getAssetTypes = () => {
    const standardTypes = [
      { value: 'laptop', label: 'Laptop' },
      { value: 'monitor', label: 'Monitor' },
      { value: 'mouse', label: 'Mouse' },
      { value: 'keyboard', label: 'Keyboard' },
      { value: 'headphones', label: 'Headphones' },
      { value: 'phone', label: 'Phone' },
      { value: 'router', label: 'Router' },
      { value: 'storage', label: 'Storage Device' },
    ];

    const customTypes = assets
      .map(asset => asset.type)
      .filter((type, index, self) => 
        type && 
        !getStandardTypes().includes(type) && 
        self.indexOf(type) === index
      )
      .map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }));

    if (mode === 'edit' && asset?.type && !getStandardTypes().includes(asset.type) && !customTypes.find(ct => ct.value === asset.type)) {
      customTypes.push({
        value: asset.type,
        label: asset.type.charAt(0).toUpperCase() + asset.type.slice(1)
      });
    }

    return [...standardTypes, ...customTypes, { value: 'custom', label: 'Custom (New)' }];
  };

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

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');

    if (file.size > 2 * 1024 * 1024) {
      setImageError('Image size must be less than 2MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (mode === 'edit' && asset?.imageUrl) {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImageError('');

    if (formData.type === 'custom' && !formData.customType?.trim()) {
      setImageError('Please enter a custom asset type');
      return;
    }

    let finalImageUrl = formData.imageUrl;

    if (imageFile) {
      setUploadingImage(true);
      try {
        const timestamp = Date.now();
        const fileName = `assets/${timestamp}_${imageFile.name}`;
        finalImageUrl = await firebaseUtils.uploadImage(imageFile, fileName);
        setFormData(prev => ({ ...prev, imageUrl: finalImageUrl }));
      } catch (error) {
        setImageError(error.message || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    onSave({ ...formData, imageUrl: finalImageUrl });
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
      title={mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}
      size="large"
    >
      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Asset Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Macbook Pro 15-Inch, 2018"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Asset Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
            >
              {getAssetTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="Enter brand"
              required
            />
          </div>
        </div>

        {formData.type === 'custom' && (
          <div className="form-group">
            <label htmlFor="customType">Custom Asset Type</label>
            <input
              type="text"
              id="customType"
              name="customType"
              value={formData.customType}
              onChange={(e) => handleInputChange('customType', e.target.value)}
              placeholder="Enter custom asset type"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="serialNumber">Serial Number</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => handleInputChange('serialNumber', e.target.value)}
            placeholder="Enter serial number"
          />
        </div>

        {canManageAssets && (
          <div className="form-group">
            <label htmlFor="assignTo">Assign To (Optional)</label>
            <Select
              options={userOptions}
              value={userOptions.find(option => option.value === formData.assignTo) || null}
              onChange={(selected) => handleInputChange('assignTo', selected?.value || '')}
              isClearable
              placeholder="Leave Unassigned"
              styles={reactSelectStyles}
              components={{ Option: CustomOption }}
              className="user-select"
              classNamePrefix="user-select"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="assignDate">Assign Date</label>
          <input
            type="date"
            id="assignDate"
            name="assignDate"
            value={formData.assignDate}
            onChange={(e) => handleInputChange('assignDate', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows="3"
            placeholder="Enter asset description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Asset Image (Optional)</label>
          <div className="image-upload-container">
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                  disabled={uploadingImage}
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <div 
                className="image-upload-placeholder"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
              >
                <FiImage size={24} />
                <span>Click to upload image</span>
                <span className="upload-hint">Max size: 2MB (JPEG, PNG, GIF, WebP)</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="image"
              name="image"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={uploadingImage}
            />
          </div>
          {imageError && (
            <div className="error-message" style={{ marginTop: '0.5rem' }}>
              <span>{imageError}</span>
            </div>
          )}
          {uploadingImage && (
            <div className="upload-status" style={{ marginTop: '0.5rem', color: '#6366F1' }}>
              Uploading image...
            </div>
          )}
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
            loading={loading || uploadingImage}
            loadingText={uploadingImage ? 'Uploading Image...' : (mode === 'edit' ? 'Updating Asset...' : 'Creating Asset...')}
            disabled={uploadingImage}
          >
            {mode === 'edit' ? 'Update Asset' : 'Create Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssetFormModal;
