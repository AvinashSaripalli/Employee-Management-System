import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import {
  HiOutlineCube,
  HiOutlinePlus,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineWrenchScrewdriver,
  HiOutlineUserPlus,
  HiOutlineArrowUturnLeft,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineDeviceTablet,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import axios from '../../api/axios';

const CATEGORIES = [
  'Laptop',
  'Desktop',
  'Mobile',
  'Tablet',
  'Monitor',
  'Peripherals',
  'Furniture',
  'Vehicle',
  'Other',
];

const CONDITIONS = ['New', 'Excellent', 'Good', 'Fair', 'Damaged', 'Needs Repair'];
const STATUSES = ['Available', 'Assigned', 'Under Repair', 'Retired', 'Lost'];

const AssetManagementHub = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    retired: 0,
    totalValuation: 0,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);

  // Form states
  const [assetForm, setAssetForm] = useState({
    assetTag: '',
    name: '',
    category: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: '',
    condition: 'Good',
    notes: '',
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    condition: 'Good',
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    returnedDate: new Date().toISOString().split('T')[0],
    condition: 'Good',
    status: 'Available',
    notes: '',
  });

  const userRole = localStorage.getItem('userRole') || 'Employee';
  const isPrivileged = ['Admin', 'Manager'].includes(userRole);
  const currentEmpId = localStorage.getItem('userEmployeeId');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/assets', {
        params: {
          search: searchTerm || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        },
      });
      setAssets(res.data?.assets || []);
      if (res.data?.metrics) setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Error fetching company assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAssets = async () => {
    if (!currentEmpId) return;
    try {
      const res = await axios.get('/assets/my-assets');
      setMyAssets(res.data?.assets || []);
    } catch (err) {
      console.error('Error fetching personal assets:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchMyAssets();
  }, [searchTerm, selectedStatus, selectedCategory]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.assetTag || !assetForm.name) {
      alert('Asset Tag and Asset Name are required.');
      return;
    }
    try {
      if (activeAsset) {
        await axios.put(`/assets/${activeAsset.id}`, assetForm);
        alert('Asset updated successfully.');
      } else {
        await axios.post('/assets', assetForm);
        alert('Asset registered successfully.');
      }
      setCreateDialogOpen(false);
      setActiveAsset(null);
      setAssetForm({
        assetTag: '',
        name: '',
        category: 'Laptop',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchaseCost: '',
        condition: 'Good',
        notes: '',
      });
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save asset.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activeAsset || !assignForm.employeeId) {
      alert('Employee ID is required.');
      return;
    }
    try {
      await axios.post(`/assets/${activeAsset.id}/assign`, assignForm);
      alert(`Asset assigned to ${assignForm.employeeId} successfully.`);
      setAssignDialogOpen(false);
      setActiveAsset(null);
      fetchAssets();
      fetchMyAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign asset.');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!activeAsset) return;
    try {
      await axios.post(`/assets/${activeAsset.id}/return`, returnForm);
      alert('Asset return and condition recorded.');
      setReturnDialogOpen(false);
      setActiveAsset(null);
      fetchAssets();
      fetchMyAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record return.');
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Are you sure you want to delete asset ${asset.assetTag} (${asset.name})?`)) return;
    try {
      await axios.delete(`/assets/${asset.id}`);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete asset.');
    }
  };

  const exportAssetsCSV = () => {
    if (assets.length === 0) {
      alert('No asset records to export.');
      return;
    }
    const headers = [
      'Asset Tag',
      'Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Status',
      'Condition',
      'Assigned Employee ID',
      'Assigned To Name',
      'Department',
      'Assigned Date',
      'Purchase Cost',
    ];
    const rows = assets.map((a) => [
      `"${a.assetTag || ''}"`,
      `"${a.name || ''}"`,
      `"${a.category || ''}"`,
      `"${a.brand || ''}"`,
      `"${a.model || ''}"`,
      `"${a.serialNumber || ''}"`,
      `"${a.status || ''}"`,
      `"${a.condition || ''}"`,
      `"${a.assignedToEmployeeId || ''}"`,
      `"${a.assignedToName || ''}"`,
      `"${a.assignedToDepartment || ''}"`,
      `"${a.assignedDate || ''}"`,
      `"${a.purchaseCost || 0}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Asset_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Desktop':
      case 'Monitor':
        return <HiOutlineComputerDesktop size={18} color="#14286D" />;
      case 'Mobile':
        return <HiOutlineDevicePhoneMobile size={18} color="#059669" />;
      case 'Tablet':
        return <HiOutlineDeviceTablet size={18} color="#7C3AED" />;
      default:
        return <HiOutlineCube size={18} color="#2563EB" />;
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Available':
        return <Chip label="Available" size="small" sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 700 }} />;
      case 'Assigned':
        return <Chip label="Assigned" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />;
      case 'Under Repair':
        return <Chip label="Under Repair" size="small" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700 }} />;
      case 'Retired':
      case 'Lost':
        return <Chip label={status} size="small" sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getConditionChip = (condition) => {
    const isGood = ['New', 'Excellent', 'Good'].includes(condition);
    return (
      <Chip
        label={condition}
        size="small"
        variant="outlined"
        sx={{
          borderColor: isGood ? '#a7f3d0' : '#fecaca',
          color: isGood ? '#065f46' : '#991b1b',
          fontSize: '11px',
          fontWeight: 600,
        }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Banner */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HiOutlineCube size={26} color="#14286D" />
            Asset & Device Inventory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.25 }}>
            Enterprise hardware allocation, IT serial tracking, and offboarding handover clearance
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<HiOutlineArrowDownTray size={17} />}
            onClick={exportAssetsCSV}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              borderColor: '#cbd5e1',
              color: '#334155',
              bgcolor: '#fff',
              '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
            }}
          >
            Export CSV
          </Button>

          {isPrivileged && (
            <Button
              variant="contained"
              startIcon={<HiOutlinePlus size={18} />}
              onClick={() => {
                setActiveAsset(null);
                setAssetForm({
                  assetTag: `AST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                  name: '',
                  category: 'Laptop',
                  brand: '',
                  model: '',
                  serialNumber: '',
                  purchaseDate: new Date().toISOString().split('T')[0],
                  purchaseCost: '',
                  condition: 'Good',
                  notes: '',
                });
                setCreateDialogOpen(true);
              }}
              sx={{
                bgcolor: '#14286D',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                '&:hover': { bgcolor: '#0f1e54' },
              }}
            >
              Add New Asset
            </Button>
          )}
        </Box>
      </Box>

      {/* Metric Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Devices</Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#EEF2FF', color: '#14286D' }}><HiOutlineCube size={20} /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>{metrics.total}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Assigned</Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#eff6ff', color: '#2563eb' }}><HiOutlineCheckCircle size={20} /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1d4ed8', mt: 0.5 }}>{metrics.assigned}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Available Stock</Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#ecfdf5', color: '#059669' }}><HiOutlineCube size={20} /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857', mt: 0.5 }}>{metrics.available}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Under Maintenance</Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#fffbeb', color: '#d97706' }}><HiOutlineWrenchScrewdriver size={20} /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#b45309', mt: 0.5 }}>{metrics.maintenance}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>My Devices</Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#f5f3ff', color: '#7c3aed' }}><HiOutlineDeviceTablet size={20} /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#6d28d9', mt: 0.5 }}>{myAssets.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, val) => setTabValue(val)}
        sx={{
          mb: 2.5,
          borderBottom: '1px solid #e2e8f0',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '14px', minWidth: 120 },
          '& .Mui-selected': { color: '#14286D' },
          '& .MuiTabs-indicator': { bgcolor: '#14286D', height: 3 },
        }}
      >
        <Tab label="Company Inventory" />
        <Tab label={`My Allocated Assets (${myAssets.length})`} />
      </Tabs>

      {/* Tab 0: Company Inventory */}
      {tabValue === 0 && (
        <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Filters Bar */}
          <Box sx={{ p: 2, bgcolor: '#ffffff', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <TextField
              size="small"
              placeholder="Search tag, name, serial, or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HiOutlineMagnifyingGlass size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280, flexGrow: 1 }}
            />

            <TextField
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>ASSET TAG</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>DEVICE & MODEL</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>SERIAL NO</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>CONDITION</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>ALLOCATED TO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '12px' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      No assets found. Click "Add New Asset" to register equipment.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Chip
                          label={asset.assetTag}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: '#EEF2FF',
                            color: '#14286D',
                            letterSpacing: '0.02em',
                            fontSize: '11px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{asset.name}</Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                          {[asset.brand, asset.model].filter(Boolean).join(' • ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {getCategoryIcon(asset.category)}
                          <Typography sx={{ fontSize: '12px', color: '#334155' }}>{asset.category}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'monospace', color: '#475569' }}>
                          {asset.serialNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(asset.status)}</TableCell>
                      <TableCell>{getConditionChip(asset.condition)}</TableCell>
                      <TableCell>
                        {asset.status === 'Assigned' && asset.assignedToEmployeeId ? (
                          <Box>
                            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                              {asset.assignedToName || asset.assignedToEmployeeId}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                              {asset.assignedToDepartment ? `${asset.assignedToDepartment} · ` : ''}ID: {asset.assignedToEmployeeId}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {isPrivileged && asset.status === 'Available' && (
                            <Tooltip title="Assign to Employee">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setActiveAsset(asset);
                                  setAssignForm({
                                    employeeId: '',
                                    assignedDate: new Date().toISOString().split('T')[0],
                                    expectedReturnDate: '',
                                    condition: asset.condition || 'Good',
                                    notes: '',
                                  });
                                  setAssignDialogOpen(true);
                                }}
                                sx={{ color: '#2563EB', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                              >
                                <HiOutlineUserPlus size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isPrivileged && asset.status === 'Assigned' && (
                            <Tooltip title="Return / Clearance">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setActiveAsset(asset);
                                  setReturnForm({
                                    returnedDate: new Date().toISOString().split('T')[0],
                                    condition: asset.condition || 'Good',
                                    status: 'Available',
                                    notes: '',
                                  });
                                  setReturnDialogOpen(true);
                                }}
                                sx={{ color: '#059669', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                              >
                                <HiOutlineArrowUturnLeft size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isPrivileged && (
                            <Tooltip title="Edit Asset">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setActiveAsset(asset);
                                  setAssetForm({
                                    assetTag: asset.assetTag,
                                    name: asset.name,
                                    category: asset.category,
                                    brand: asset.brand || '',
                                    model: asset.model || '',
                                    serialNumber: asset.serialNumber || '',
                                    purchaseDate: asset.purchaseDate || '',
                                    purchaseCost: asset.purchaseCost || '',
                                    condition: asset.condition || 'Good',
                                    notes: asset.notes || '',
                                  });
                                  setCreateDialogOpen(true);
                                }}
                                sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}
                              >
                                <HiOutlinePencilSquare size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {userRole === 'Admin' && asset.status !== 'Assigned' && (
                            <Tooltip title="Delete Asset">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(asset)}
                                sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}
                              >
                                <HiOutlineTrash size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 1: My Allocated Assets */}
      {tabValue === 1 && (
        <Box>
          {myAssets.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
              <HiOutlineCube size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                No Assets Allocated
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                You do not currently have any company equipment assigned to your employee ID.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {myAssets.map((asset) => (
                <Card key={asset.id} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#EEF2FF' }}>
                          {getCategoryIcon(asset.category)}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{asset.name}</Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                            {[asset.brand, asset.model].filter(Boolean).join(' • ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label={asset.assetTag} size="small" sx={{ fontWeight: 800, bgcolor: '#EEF2FF', color: '#14286D' }} />
                    </Box>

                    <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Serial Number</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                          {asset.serialNumber || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Condition</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {asset.condition || 'Good'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Assigned Date</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {asset.assignedDate || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Expected Return</Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {asset.expectedReturnDate || 'Ongoing'}
                        </Typography>
                      </Box>
                    </Box>

                    {asset.notes && (
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                        Note: {asset.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Dialog 1: Create or Edit Asset */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HiOutlineCube size={22} color="#14286D" />
          {activeAsset ? 'Edit Asset Record' : 'Register New Company Asset'}
        </DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Asset Tag *"
                size="small"
                value={assetForm.assetTag}
                onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                required
              />
              <TextField
                select
                label="Category *"
                size="small"
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Asset Name (e.g. MacBook Pro M2, Dell XPS) *"
              size="small"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Brand / Manufacturer"
                size="small"
                value={assetForm.brand}
                onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
              />
              <TextField
                label="Model Number"
                size="small"
                value={assetForm.model}
                onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Hardware Serial Number"
                size="small"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
              />
              <TextField
                select
                label="Condition"
                size="small"
                value={assetForm.condition}
                onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
              >
                {CONDITIONS.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="date"
                label="Purchase Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={assetForm.purchaseDate}
                onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
              />
              <TextField
                type="number"
                label="Purchase Cost ($/₹)"
                size="small"
                value={assetForm.purchaseCost}
                onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
              />
            </Box>

            <TextField
              label="Notes / Accessories Included"
              size="small"
              multiline
              rows={2}
              value={assetForm.notes}
              onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
              placeholder="e.g. 140W USB-C charger, Magic Mouse included"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#14286D', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0f1e54' } }}
            >
              {activeAsset ? 'Update Asset' : 'Save & Register'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog 2: Assign Asset to Employee */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Assign Asset {activeAsset?.assetTag}
        </DialogTitle>
        <form onSubmit={handleAssignSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Allocating: <b>{activeAsset?.name}</b> ({activeAsset?.category})
            </Typography>

            <TextField
              label="Employee ID *"
              size="small"
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
              placeholder="e.g. EMP001 or Parasurama"
              required
            />

            <TextField
              type="date"
              label="Assigned Date *"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={assignForm.assignedDate}
              onChange={(e) => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
              required
            />

            <TextField
              type="date"
              label="Expected Return Date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={assignForm.expectedReturnDate}
              onChange={(e) => setAssignForm({ ...assignForm, expectedReturnDate: e.target.value })}
            />

            <TextField
              select
              label="Handover Condition"
              size="small"
              value={assignForm.condition}
              onChange={(e) => setAssignForm({ ...assignForm, condition: e.target.value })}
            >
              {CONDITIONS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Handover Notes / Sign-off"
              size="small"
              multiline
              rows={2}
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              placeholder="e.g. Device handed over in sealed box with charger"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAssignDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#2563EB', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Confirm Assignment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog 3: Return Asset / Offboarding Clearance */}
      <Dialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Record Return: {activeAsset?.assetTag}
        </DialogTitle>
        <form onSubmit={handleReturnSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Returning device assigned to: <b>{activeAsset?.assignedToName}</b> ({activeAsset?.assignedToEmployeeId})
            </Typography>

            <TextField
              type="date"
              label="Return Date *"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={returnForm.returnedDate}
              onChange={(e) => setReturnForm({ ...returnForm, returnedDate: e.target.value })}
              required
            />

            <TextField
              select
              label="Inspection Condition upon Return *"
              size="small"
              value={returnForm.condition}
              onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
            >
              {CONDITIONS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="New Stock Status *"
              size="small"
              value={returnForm.status}
              onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
            >
              <MenuItem value="Available">Available for Reassignment</MenuItem>
              <MenuItem value="Under Repair">Needs Maintenance / Repair</MenuItem>
              <MenuItem value="Retired">Retired / Scrapped</MenuItem>
            </TextField>

            <TextField
              label="Inspection Notes (Cables, physical state, factory reset)"
              size="small"
              multiline
              rows={2}
              value={returnForm.notes}
              onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              placeholder="e.g. Factory reset completed, minor scratch on casing, charger returned"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setReturnDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#059669', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#047857' } }}
            >
              Confirm Return & Clear
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AssetManagementHub;
