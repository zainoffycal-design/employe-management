import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiPackage,
  FiUser,
  FiUsers,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiEyeOff,
  FiLayers,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiMonitor,
  FiMinus,
  FiType,
  FiVolume2,
  FiSmartphone,
  FiPrinter,
  FiHardDrive
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { assetService, userManagementService } from '../../services/firebaseService';
import { notificationService } from '../../services/notificationService';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import AssetFormModal from '../../components/AssetFormModal';
import AssetRequestModal from '../../components/AssetRequestModal';
import AssetAssignModal from '../../components/AssetAssignModal';
import AssetApprovalModal from '../../components/AssetApprovalModal';
import AssetFilters from '../../components/AssetFilters';
import AssetStats from '../../components/AssetStats';
import './AssetManager.scss';

const AssetCard = ({ asset, onEdit, onDelete, onAssign, onUnassign, canManageAssets, isCurrentUserAsset = false, currentUser, users = [], index = 0 }) => {
  const getAssetIcon = (type) => {
    const icons = {
      laptop: FiMonitor,
      mouse: FiMinus,
      keyboard: FiType,
      headphones: FiVolume2,
      phone: FiSmartphone,
      printer: FiPrinter,
      storage: FiHardDrive,
      other: FiPackage
    };
    return icons[type] || FiPackage;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'info';
      case 'maintenance': return 'warning';
      case 'retired': return 'danger';
      default: return 'secondary';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'laptop': return 'primary';
      case 'monitor': return 'primary';
      case 'mouse': return 'info';
      case 'keyboard': return 'warning';
      case 'headphones': return 'success';
      case 'phone': return 'secondary';
      case 'printer': return 'danger';
      case 'router': return 'info';
      case 'storage': return 'warning';
      case 'desk': return 'success';
      case 'chair': return 'success';
      case 'custom': return 'secondary';
      default: return 'secondary';
    }
  };

  const assignedUser = users.find(user => user.id === asset.assignedTo);
  const AssetIcon = getAssetIcon(asset.type);

  return (
    <motion.div 
      className={`asset-card ${isCurrentUserAsset ? 'current-user-asset' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="asset-icon">
        <AssetIcon />
      </div>
      <div className="asset-info">
        <h3>{asset.name}</h3>
        <div className="asset-details">
          <div className="asset-details-row">
            <span className={`badge badge--type ${getTypeBadgeColor(asset.type)}`}>
              {asset.type === 'custom' && asset.customType 
                ? asset.customType 
                : asset.type 
                  ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1)
                  : 'Unknown'
              }
            </span>
            <span className={`badge badge--status ${getStatusBadgeColor(asset.status)}`}>
              {asset.status}
            </span>
          </div>
          <div className="asset-meta">
            <div className="asset-serial">
              <strong>Serial:</strong> {asset.serialNumber}
            </div>
            <div className="asset-brand">
              <strong>Brand:</strong> {asset.brand}
            </div>
            {asset.assignedAt && (
              <div className="asset-date">
                <strong>Assigned:</strong> {new Date(asset.assignedAt).toLocaleDateString()}
              </div>
            )}
            {asset.requestedAsset && (
              <div className="asset-source">
                <span className="badge badge--info">From Request</span>
              </div>
            )}
          </div>
          {asset.assignedTo && assignedUser && (
            <div className="asset-assignment">
              <div className="assigned-user">
                <Avatar 
                  src={assignedUser.avatar}
                  name={assignedUser.name}
                  size="small"
                />
                <span>{assignedUser.name}</span>
              </div>
              {asset.assignedAt && (
                <div className="assigned-date">
                  Assigned: {new Date(asset.assignedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {canManageAssets && (
        <div className="asset-actions">
          <button
            className="action-btn edit"
            onClick={() => onEdit(asset)}
            title="Edit asset"
          >
            <FiEdit3 />
          </button>
          {asset.status === 'assigned' ? (
            <button
              className="action-btn unassign"
              onClick={() => onUnassign(asset.id)}
              title="Unassign asset"
            >
              <FiUserX />
            </button>
          ) : (
            <button
              className="action-btn assign"
              onClick={() => onAssign(asset)}
              title="Assign asset"
            >
              <FiUserCheck />
            </button>
          )}
          <button
            className="action-btn delete"
            onClick={() => onDelete(asset.id)}
            title="Delete asset"
          >
            <FiTrash2 />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const AssetManager = () => {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [assetRequests, setAssetRequests] = useState([]);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAssetRequest, setShowAssetRequest] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'laptop',
    brand: '',
    serialNumber: '',
    description: '',
    assignDate: '',
    customType: '',
    assignTo: ''
  });
  const [newAssetRequest, setNewAssetRequest] = useState({
    assetType: 'laptop',
    description: '',
    priority: 'medium',
    customType: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const { canManageAssets: canManageAssetsFromAuth, canViewAllAssets: canViewAllAssetsFromAuth } = useAuth();
  const canManageAssets = canManageAssetsFromAuth();
  const canViewAllAssets = canViewAllAssetsFromAuth();
  const canAddAssets = true;


  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const unsubscribeAssets = canViewAllAssets 
      ? assetService.subscribeToAllAssets((assetsData) => {
          const sorted = assetsData.sort((a, b) => 
            new Date(b.createdAt || b.assignedAt) - new Date(a.createdAt || a.assignedAt)
          );
          setAssets(sorted);
        })
      : assetService.subscribeToUserAssets(currentUser.uid, (assetsData) => {
          const sorted = assetsData.sort((a, b) => 
            new Date(b.createdAt || b.assignedAt) - new Date(a.createdAt || a.assignedAt)
          );
          setAssets(sorted);
        });

    const unsubscribeUsers = userManagementService.subscribeToAllUsers((usersData) => {
      setUsers(usersData);
    });

    const unsubscribeRequests = canManageAssets
      ? assetService.subscribeToAllAssetRequests((requestsData) => {
          const sorted = requestsData.sort((a, b) => 
            new Date(b.requestedAt) - new Date(a.requestedAt)
          );
          setAssetRequests(sorted);
        })
      : assetService.subscribeToUserAssetRequests(currentUser.uid, (requestsData) => {
          const sorted = requestsData.sort((a, b) => 
            new Date(b.requestedAt) - new Date(a.requestedAt)
          );
          setAssetRequests(sorted);
        });

    setLoading(false);

    return () => {
      unsubscribeAssets?.();
      unsubscribeUsers?.();
      unsubscribeRequests?.();
    };
  }, [currentUser, canViewAllAssets, canManageAssets]);

  const handleAddAsset = async (formData) => {
    if (formData && formData.preventDefault) {
      formData.preventDefault();
    }
    setLoading(true);
    setError('');

    try {
      const assetData = {
        ...formData,
        type: formData.type === 'custom' ? formData.customType : formData.type,
        assignedTo: canManageAssets ? (formData.assignTo || null) : currentUser.uid,
        assignedAt: canManageAssets ? (formData.assignTo ? new Date().toISOString() : null) : new Date().toISOString(),
        assignedBy: currentUser.uid,
        status: canManageAssets ? (formData.assignTo ? 'assigned' : 'available') : 'assigned'
      };
      
      const createdAsset = await assetService.createAsset(assetData);
      
      // If this asset was created from a request, update the request status
      if (formData.assignTo && assetRequests.some(req => req.requestedBy === formData.assignTo)) {
        const relatedRequest = assetRequests.find(req => 
          req.requestedBy === formData.assignTo && 
          req.status === 'pending' &&
          (req.assetType === formData.type || (req.assetType === 'custom' && req.customType === formData.customType))
        );
        
        if (relatedRequest) {
          await assetService.updateAssetRequest(relatedRequest.id, { 
            status: 'approved',
            approvedAssetId: createdAsset.id 
          });
          
          // Send notification to the user who requested the asset
          await notificationService.createNotification({
            userId: formData.assignTo,
            title: 'Asset Request Approved',
            message: `Your request for ${relatedRequest.assetType === 'custom' ? relatedRequest.customType : relatedRequest.assetType} has been approved and a new asset has been assigned to you`,
            type: 'success',
            data: { assetId: createdAsset.id, assetName: createdAsset.name }
          });
        }
      }
      
      setNewAsset({
        name: '',
        type: 'laptop',
        brand: '',
        serialNumber: '',
        description: '',
        assignDate: '',
        customType: '',
        assignTo: ''
      });
      setShowAddAsset(false);
    } catch (error) {
      console.error('Error creating asset:', error);
      setError('Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = async (formData) => {
    if (formData && formData.preventDefault) {
      formData.preventDefault();
    }
    setLoading(true);
    setError('');

    try {
      await assetService.updateAsset(editingAsset.id, formData);
      setEditingAsset(null);
    } catch (error) {
      console.error('Error updating asset:', error);
      setError('Failed to update asset');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await assetService.deleteAsset(assetId);
      } catch (error) {
        console.error('Error deleting asset:', error);
        setError('Failed to delete asset');
      }
    }
  };

  const handleAssignAsset = async (assetId, userId) => {
    try {
      await assetService.assignAsset(assetId, userId, currentUser.uid);
      
      const asset = assets.find(a => a.id === assetId);
      const assignedUser = users.find(u => u.id === userId);
      
      if (asset && assignedUser) {
        await notificationService.createNotification({
          userId: userId,
          title: 'Asset Assigned',
          message: `${asset.name} has been assigned to you`,
          type: 'info',
          data: { assetId, assetName: asset.name }
        });
      }
      
      setAssigningAsset(null);
    } catch (error) {
      console.error('Error assigning asset:', error);
      setError('Failed to assign asset');
    }
  };

  const handleUnassignAsset = async (assetId) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      const previousUser = asset ? users.find(u => u.id === asset.assignedTo) : null;
      
      await assetService.unassignAsset(assetId);
      
      if (asset && previousUser) {
        await notificationService.createNotification({
          userId: previousUser.id,
          title: 'Asset Unassigned',
          message: `${asset.name} has been unassigned from you`,
          type: 'warning',
          data: { assetId, assetName: asset.name }
        });
      }
    } catch (error) {
      console.error('Error unassigning asset:', error);
      setError('Failed to unassign asset');
    }
  };

  const handleAssignExistingAsset = async (requestId, assetId) => {
    try {
      setLoading(true);
      setError('');

      const request = assetRequests.find(req => req.id === requestId);
      if (!request) {
        setError('Request not found');
        return;
      }

      await assetService.assignAsset(assetId, request.requestedBy, currentUser.uid);
      await assetService.updateAssetRequest(requestId, { status: 'approved' });

      setApprovingRequest(null);
    } catch (error) {
      console.error('Error assigning existing asset:', error);
      setError('Failed to assign asset');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewAssetForRequest = (requestId) => {
    const request = assetRequests.find(req => req.id === requestId);
    if (!request) {
      setError('Request not found');
      return;
    }

    setNewAsset({
      name: `${request.assetType === 'custom' ? request.customType : request.assetType} - ${request.requestedByName}`,
      type: request.assetType === 'custom' ? 'custom' : request.assetType,
      brand: '',
      serialNumber: '',
      description: `Asset created from request by ${request.requestedByName}`,
      assignDate: new Date().toISOString().split('T')[0],
      customType: request.assetType === 'custom' ? request.customType : '',
      assignTo: request.requestedBy
    });

    setApprovingRequest(null);
    setShowAddAsset(true);
  };

  const handleCreateAssetRequest = async (requestData) => {
    if (requestData && requestData.preventDefault) {
      requestData.preventDefault();
    }
    setLoading(true);
    setError('');

    try {
      const finalRequestData = {
        ...requestData,
        assetType: requestData.assetType === 'custom' ? requestData.customType : requestData.assetType,
        requestedBy: currentUser.uid,
        requestedByName: currentUser.name
      };
      
      await assetService.createAssetRequest(finalRequestData);
      
      const superManagers = users.filter(user => user.role === 'super_manager' && user.isActive !== false);
      for (const manager of superManagers) {
        await notificationService.createNotification({
          userId: manager.id,
          title: 'New Asset Request',
          message: `${currentUser.name} has requested a ${requestData.assetType}`,
          type: 'asset_request',
          data: {
            requestId: null, // Will be updated after request is created
            requestedBy: currentUser.uid,
            assetType: requestData.assetType
          }
        });
      }
      
      setNewAssetRequest({
        assetType: 'laptop',
        description: '',
        priority: 'medium',
        customType: ''
      });
      setShowAssetRequest(false);
    } catch (error) {
      console.error('Error creating asset request:', error);
      setError('Failed to create asset request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssetRequest = async (requestId, status) => {
    try {
      setLoading(true);
      const request = assetRequests.find(req => req.id === requestId);
      
      await assetService.updateAssetRequest(requestId, { 
        status,
        processedAt: new Date().toISOString(),
        processedBy: currentUser.uid
      });
      
      // Send notification to the user based on status
      if (request) {
        const assetType = request.assetType === 'custom' ? request.customType : request.assetType;
        
        if (status === 'approved') {
          await notificationService.createNotification({
            userId: request.requestedBy,
            title: 'Asset Request Approved',
            message: `Your request for ${assetType} has been approved and an asset has been assigned to you`,
            type: 'success',
            data: { requestId, assetType }
          });
          
          // Create an asset and assign it to the requester
          const assetData = {
            name: `${assetType} - ${request.requestedByName}`,
            type: request.assetType === 'custom' ? 'custom' : request.assetType,
            customType: request.assetType === 'custom' ? request.customType : '',
            brand: 'Company Provided',
            serialNumber: `REQ-${requestId.slice(-6)}`,
            description: request.description,
            assignedTo: request.requestedBy,
            assignedAt: new Date().toISOString(),
            assignedBy: currentUser.uid,
            status: 'assigned',
            requestedAsset: true,
            originalRequestId: requestId
          };
          
          await assetService.createAsset(assetData);
        } else if (status === 'rejected') {
          await notificationService.createNotification({
            userId: request.requestedBy,
            title: 'Asset Request Rejected',
            message: `Your request for ${assetType} has been rejected`,
            type: 'error',
            data: { requestId, assetType }
          });
        }
      }
    } catch (error) {
      console.error('Error updating asset request:', error);
      setError('Failed to update asset request');
    } finally {
      setLoading(false);
    }
  };

  const openEditAssetModal = (asset) => {
    setEditingAsset(asset);
  };

  const openAssignAssetModal = (asset) => {
    setAssigningAsset(asset);
  };

  // Filter assets based on search and filters
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Search by asset name, type, or brand
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by asset type
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    // Filter by user (for Super Managers)
    if (canManageAssets && filterUser !== 'all') {
      filtered = filtered.filter(asset => asset.assignedTo === filterUser);
    }

    return filtered;
  }, [assets, searchTerm, filterType, filterUser, canManageAssets]);

  const userAssets = assets.filter(asset => asset.assignedTo === currentUser.uid);
  const availableAssets = assets.filter(asset => asset.status === 'available');
  const assignedAssets = assets.filter(asset => asset.status === 'assigned');
  const pendingRequests = assetRequests.filter(request => request.status === 'pending');


  return (
    <div className="asset-manager">
      <PageTitle 
        title="Asset Manager"
        subtitle="Manage office assets and equipment"
        icon={FiPackage}
        showBackButton={true}
        backTo="/dashboard"
        actions={
          <>
            {canManageAssets && activeTab === 'assets' && (
              <AssetFilters
                searchTerm={searchTerm}
                filterType={filterType}
                filterUser={filterUser}
                users={users}
                onSearchChange={setSearchTerm}
                onFilterChange={setFilterType}
                onUserFilterChange={setFilterUser}
                onClearFilters={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterUser('all');
                }}
              />
            )}
            
            <div className="page-actions">
              <Button
                variant="primary"
                onClick={() => setShowAddAsset(true)}
              >
                <FiPlus /> Add Asset
              </Button>
              {!canManageAssets && (
                <Button
                  variant="secondary"
                  onClick={() => setShowAssetRequest(true)}
                >
                  <FiLayers /> Request Asset
                </Button>
              )}
            </div>
          </>
        }
      />

      <div className="asset-tabs">
        <button 
          className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <FiPackage /> Assets
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <FiLayers /> {canManageAssets ? `Requests (${pendingRequests.length})` : 'My Requests'}
        </button>
      </div>


      {error && (
        <div className="error-message">
          <FiAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="asset-content">
        {activeTab === 'assets' && (
          <div className="assets-section">
            {canViewAllAssets ? (
              <>
                <AssetStats 
                  stats={{
                    total: assets.length,
                    assigned: assignedAssets.length,
                    available: availableAssets.length,
                    pendingRequests: assetRequests.filter(req => req.status === 'pending').length
                  }}
                  loading={loading}
                />

                {filteredAssets.length > 0 ? (
                  <div className="assets-grid">
                    {filteredAssets.map((asset, index) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={openEditAssetModal}
                        onDelete={handleDeleteAsset}
                        onAssign={openAssignAssetModal}
                        onUnassign={handleUnassignAsset}
                        canManageAssets={canManageAssets}
                        isCurrentUserAsset={asset.assignedTo === currentUser.uid}
                        currentUser={currentUser}
                        users={users}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    className="no-data-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="no-data-icon">
                      <FiPackage size={48} />
                    </div>
                    <h4>No Assets Found</h4>
                    <p  className='mb-3'>
                      {searchTerm || filterType !== 'all' || filterUser !== 'all' 
                        ? 'No assets match your current filters. Try adjusting your search criteria.'
                        : 'No assets have been added yet. Start by adding your first asset.'
                      }
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowAddAsset(true)}
                    >
                      <FiPlus /> Add First Asset
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="user-assets">
                <h3>My Assets</h3>
                {userAssets.length > 0 ? (
                  <div className="assets-grid">
                    {userAssets.map((asset, index) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        canManageAssets={false}
                        isCurrentUserAsset={true}
                        currentUser={currentUser}
                        users={users}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    className="no-data-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="no-data-icon">
                      <FiPackage size={48} />
                    </div>
                    <h4>No Assets Assigned</h4>
                    <p>You don't have any assets assigned to you yet. You can add your own assets or request assets from your manager.</p>
                    <div className="empty-state-actions">
                      <Button
                        variant="primary"
                        onClick={() => setShowAddAsset(true)}
                      >
                        <FiPlus /> Add Asset
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowAssetRequest(true)}
                      >
                        <FiLayers /> Request Asset
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            {assetRequests.length > 0 ? (
              <div className="requests-list">
                {assetRequests.map((request, index) => (
                  <motion.div 
                    key={request.id}
                    className="request-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className="request-info">
                      <div className="request-header">
                        <h4>{request.assetType} Request</h4>
                        {canManageAssets ? (
                          <span className={`badge badge--priority ${request.priority}`}>
                            {request.priority}
                          </span>
                        ) : (
                          <span className={`badge badge--status ${request.status}`}>
                            {request.status}
                          </span>
                        )}
                      </div>
                      <div className="request-details">
                        {canManageAssets && (
                          <p><strong>Requested by:</strong> {request.requestedByName}</p>
                        )}
                        <p><strong>Description:</strong> {request.description}</p>
                        {!canManageAssets && <p><strong>Priority:</strong> {request.priority}</p>}
                        <p><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {canManageAssets && request.status === 'pending' && (
                      <div className="request-actions">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => setApprovingRequest(request)}
                        >
                          <FiCheckCircle /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleUpdateAssetRequest(request.id, 'rejected')}
                        >
                          <FiXCircle /> Reject
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="no-data-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="no-data-icon">
                  <FiLayers size={48} />
                </div>
                <h4>No Asset Requests</h4>
                <p  className='mb-3'>
                  {canManageAssets 
                    ? 'No asset requests have been submitted yet.'
                    : 'You haven\'t submitted any asset requests yet.'
                  }
                </p>
                {!canManageAssets && (
                  <Button
                    variant="primary"
                    onClick={() => setShowAssetRequest(true)}
                  >
                    <FiLayers /> Submit Request
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AssetFormModal
        isOpen={showAddAsset}
        mode="add"
        users={users}
        canManageAssets={canManageAssets}
        onSave={handleAddAsset}
        onClose={() => setShowAddAsset(false)}
        loading={loading}
        error={error}
      />

      <AssetFormModal
        isOpen={!!editingAsset}
        mode="edit"
        asset={editingAsset}
        users={users}
        canManageAssets={canManageAssets}
        onSave={handleEditAsset}
        onClose={() => setEditingAsset(null)}
        loading={loading}
        error={error}
      />

      <AssetAssignModal
        isOpen={!!assigningAsset}
        asset={assigningAsset}
        users={users}
        onAssign={handleAssignAsset}
        onClose={() => setAssigningAsset(null)}
      />

      <AssetRequestModal
        isOpen={showAssetRequest}
        onSave={handleCreateAssetRequest}
        onClose={() => setShowAssetRequest(false)}
        loading={loading}
        error={error}
      />

      <AssetApprovalModal
        isOpen={!!approvingRequest}
        request={approvingRequest}
        availableAssets={availableAssets.filter(asset => 
          !asset.assignedTo && 
          asset.type === (approvingRequest?.assetType === 'custom' ? approvingRequest?.customType : approvingRequest?.assetType)
        )}
        users={users}
        onAssignExisting={handleAssignExistingAsset}
        onCreateNew={handleCreateNewAssetForRequest}
        onClose={() => setApprovingRequest(null)}
      />
    </div>
  );
};

export default AssetManager;
