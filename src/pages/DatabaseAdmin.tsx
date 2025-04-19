import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { Edit, Trash2, Save, X, RefreshCw, Plus, Database, User, Calendar, FileText, Pill, AlertTriangle } from 'lucide-react';
import DatabaseSeeder from '../components/DatabaseSeeder';
import FixDatabaseConnection from '../components/FixDatabaseConnection';

type TableName = 'profiles' | 'appointments' | 'documents' | 'prescriptions';

interface TableData {
  [key: string]: any;
}

const DatabaseAdmin: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableName>('profiles');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<TableData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRowData, setNewRowData] = useState<TableData>({});
  const [showSeeder, setShowSeeder] = useState(false);
  const [showFixConnection, setShowFixConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchTableData(activeTable);
    }
  }, [activeTable, refreshTrigger, connectionStatus]);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        setConnectionStatus('error');
        setError('Database connection error. Please fix the connection first.');
      } else {
        setConnectionStatus('connected');
        setError(null);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setConnectionStatus('error');
      setError('Database connection error. Please fix the connection first.');
    }
  };

  const fetchTableData = async (tableName: TableName) => {
    setLoading(true);
    setError(null);
    try {
      // Use RPC function to get table data with admin privileges
      const { data, error } = await supabase.rpc(
        'admin_get_table_data',
        { table_name: tableName }
      );

      if (error) {
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
          
        if (directError) {
          throw directError;
        }
        
        setTableData(directData || []);
      } else {
        setTableData(data || []);
      }
    } catch (err: any) {
      console.error(`Error fetching ${activeTable}:`, err);
      setError(`Failed to load ${activeTable}: ${err.message}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (row: TableData) => {
    setEditingRow(row.id);
    setEditedData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData(null);
  };

  const handleSaveEdit = async () => {
    if (!editedData || !editingRow) return;

    setLoading(true);
    try {
      // Use RPC function to update with admin privileges
      const { error } = await supabase.rpc(
        'admin_update_record',
        { 
          p_table_name: activeTable,
          p_id: editingRow,
          p_data: editedData
        }
      );

      if (error) {
        // Fallback to direct update
        const { error: directError } = await supabase
          .from(activeTable)
          .update(editedData)
          .eq('id', editingRow);
          
        if (directError) {
          throw directError;
        }
      }

      // Refresh data
      handleRefresh();
      setEditingRow(null);
      setEditedData(null);
    } catch (err: any) {
      console.error(`Error updating ${activeTable}:`, err);
      setError(`Failed to update: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this record from ${activeTable}?`)) {
      return;
    }

    setLoading(true);
    try {
      // Use RPC function to delete with admin privileges
      const { error } = await supabase.rpc(
        'admin_delete_record',
        { 
          p_table_name: activeTable,
          p_id: id
        }
      );

      if (error) {
        // Fallback to direct delete
        const { error: directError } = await supabase
          .from(activeTable)
          .delete()
          .eq('id', id);
          
        if (directError) {
          throw directError;
        }
      }

      // Refresh data
      handleRefresh();
    } catch (err: any) {
      console.error(`Error deleting from ${activeTable}:`, err);
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [key]: value
      });
    }
  };

  const handleNewRowInputChange = (key: string, value: any) => {
    setNewRowData({
      ...newRowData,
      [key]: value
    });
  };

  const handleAddRow = async () => {
    setLoading(true);
    try {
      // Add created_at if not present
      const dataToInsert = {
        ...newRowData,
        created_at: new Date().toISOString()
      };

      // Use RPC function to insert with admin privileges
      const { error } = await supabase.rpc(
        'admin_insert_record',
        { 
          p_table_name: activeTable,
          p_data: dataToInsert
        }
      );

      if (error) {
        // Fallback to direct insert
        const { error: directError } = await supabase
          .from(activeTable)
          .insert(dataToInsert)
          .select();
          
        if (directError) {
          throw directError;
        }
      }

      // Refresh data
      handleRefresh();
      setShowAddForm(false);
      setNewRowData({});
    } catch (err: any) {
      console.error(`Error adding to ${activeTable}:`, err);
      setError(`Failed to add record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTableIcon = (tableName: TableName) => {
    switch (tableName) {
      case 'profiles':
        return <User className="h-5 w-5" />;
      case 'appointments':
        return <Calendar className="h-5 w-5" />;
      case 'documents':
        return <FileText className="h-5 w-5" />;
      case 'prescriptions':
        return <Pill className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const renderTableHeaders = () => {
    if (tableData.length === 0) return null;
    
    const headers = Object.keys(tableData[0]);
    return (
      <tr className="bg-gray-100">
        {headers.map(header => (
          <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {header}
          </th>
        ))}
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    );
  };

  const renderTableRows = () => {
    return tableData.map(row => (
      <tr key={row.id} className="border-t border-gray-200 hover:bg-gray-50">
        {Object.entries(row).map(([key, value]) => (
          <td key={key} className="px-4 py-2 whitespace-nowrap text-sm">
            {editingRow === row.id ? (
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={editedData?.[key] || ''}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full px-2 py-1 border rounded"
                disabled={key === 'id' || key === 'created_at' || key === 'updated_at'}
              />
            ) : (
              renderCellValue(value)
            )}
          </td>
        ))}
        <td className="px-4 py-2 whitespace-nowrap text-sm">
          {editingRow === row.id ? (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                title="Save"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(row)}
                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(row.id)}
                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  const renderCellValue = (value: any) => {
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Database Connection Status */}
        <div className="mb-4">
          {connectionStatus === 'checking' && (
            <div className="flex items-center text-yellow-600">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Checking database connection...
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
              <button
                onClick={() => setShowFixConnection(true)}
                className="ml-4 px-3 py-1 bg-red-100 rounded-md hover:bg-red-200"
              >
                Fix Connection
              </button>
            </div>
          )}
        </div>

        {/* Table Selection */}
        <div className="mb-4 flex space-x-4">
          {(['profiles', 'appointments', 'documents', 'prescriptions'] as TableName[]).map(table => (
            <button
              key={table}
              onClick={() => setActiveTable(table)}
              className={`flex items-center px-4 py-2 rounded-md ${
                activeTable === table
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getTableIcon(table)}
              <span className="ml-2 capitalize">{table}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-white rounded-md hover:bg-gray-100"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New
            </button>
            <button
              onClick={() => setShowSeeder(true)}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              <Database className="h-5 w-5 mr-2" />
              Seed Database
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && !loading && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-white rounded-md shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Record</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {tableData[0] && Object.keys(tableData[0]).map(key => (
              key !== 'id' && key !== 'created_at' && key !== 'updated_at' && (
                <div key={key} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={newRowData[key] || ''}
                    onChange={(e) => handleNewRowInputChange(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )
            ))}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRow}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Record'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                {renderTableHeaders()}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Seeder Modal */}
        {showSeeder && (
          <DatabaseSeeder />
        )}

        {/* Fix Connection Modal */}
        {showFixConnection && (
          <FixDatabaseConnection />
        )}
      </div>
    </div>
  );
};

export default DatabaseAdmin;