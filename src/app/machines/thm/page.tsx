'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MachineCardBase from '@/components/MachineCardBase';
import { FaPlus, FaFilter, FaSearch, FaSync, FaGraduationCap, FaTimes } from 'react-icons/fa';
import thmRoomsData from '@/data/thm-rooms.json';

interface THMRoom {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  tags: string[];
  writeup: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  roomCode: string;
  points: number;
  dateCompleted: string | null;
}

const TryHackMeRooms = () => {
  const [rooms, setRooms] = useState<THMRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<THMRoom[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<THMRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Room form state
  const [roomForm, setRoomForm] = useState({
    title: '',
    difficulty: 'Easy',
    status: 'In Progress',
    roomCode: '',
    points: 0,
    dateCompleted: null as string | null,
    tags: [] as string[],
    writeup: ''
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch rooms from D1 database
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/thm-rooms-d1');
      const data = await response.json();
      
      if (response.ok) {
        // Handle both direct array and object with rooms property
        const roomsArray = Array.isArray(data) ? data : (data.rooms || []);
        setRooms(roomsArray);
      } else {
        // Fallback to default data if API fails
        console.warn('D1 API not available, using fallback data:', data.error);
        setRooms(thmRoomsData);
        setError('Using cached data - database temporarily unavailable');
      }
    } catch (error) {
      console.error('Error fetching THM rooms:', error);
      setRooms(thmRoomsData);
      setError('Failed to load rooms from database');
    } finally {
      setLoading(false);
    }
  };

  // Load rooms data on component mount and check admin session
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/auth');
        const data = await response.json();
        setIsAdminMode(data.authenticated || false);
      } catch (error) {
        console.error('Error checking admin session:', error);
        setIsAdminMode(false);
      }
    };
    
    checkAdminSession();
    fetchRooms();
  }, []);

    // Listen for admin mode changes from header
  useEffect(() => {
    const handleAdminModeChange = () => {
      const checkAdminSession = async () => {
        try {
          const response = await fetch('/api/admin/auth');
          const data = await response.json();
          setIsAdminMode(data.authenticated || false);
        } catch (error) {
          console.error('Error checking admin session:', error);
          setIsAdminMode(false);
        }
      };
      checkAdminSession();
    };

    window.addEventListener('adminModeChanged', handleAdminModeChange);
    return () => window.removeEventListener('adminModeChanged', handleAdminModeChange);
  }, []);

  // Populate form when editing a room
  useEffect(() => {
    if (selectedRoom) {
      setRoomForm({
        title: selectedRoom.title,
        difficulty: selectedRoom.difficulty,
        status: selectedRoom.status,
        roomCode: selectedRoom.roomCode || '',
        points: selectedRoom.points || 0,
        dateCompleted: selectedRoom.dateCompleted,
        tags: Array.isArray(selectedRoom.tags) ? selectedRoom.tags : [],
        writeup: selectedRoom.writeup || ''
      });
    } else {
      setRoomForm({
        title: '',
        difficulty: 'Easy',
        status: 'In Progress',
        roomCode: '',
        points: 0,
        dateCompleted: null,
        tags: [],
        writeup: ''
      });
    }
  }, [selectedRoom]);

  useEffect(() => {
    let filtered = rooms;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(room.tags) && room.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Difficulty filter
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(room => room.difficulty === filterDifficulty);
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(room => room.status === filterStatus);
    }

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, filterDifficulty, filterStatus]);

  const handleAddRoom = async (newRoom: Omit<THMRoom, 'id'>) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/thm-rooms-d1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newRoom),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle development mode gracefully
        if (response.status === 503 && errorData.error?.includes('Database not available')) {
          setError('⚠️ Running in development mode - database operations not available');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to add room');
      }

      const result = await response.json();
      const addedRoom = result.room;
      setRooms(prev => [...prev, addedRoom]);
      
      // Show success message
      setError('✅ Room added successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error adding room:', error);
      setError(`❌ Failed to add room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateRoom = async (updatedRoom: THMRoom) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/thm-rooms-d1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedRoom),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle development mode gracefully
        if (response.status === 503 && errorData.error?.includes('Database not available')) {
          setError('⚠️ Running in development mode - database operations not available');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to update room');
      }

      const result = await response.json();
      const updated = result.room;
      setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
      
      // Show success message
      setError('✅ Room updated successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error updating room:', error);
      setError(`❌ Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    try {
      setError(null);
      const response = await fetch(`/api/admin/thm-rooms-d1?id=${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete room');
      }

      setRooms(prev => prev.filter(r => r.id !== roomId));
      
      // Show success message
      setError('✅ Room deleted successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error deleting room:', error);
      setError(`❌ Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewWriteup = (room: THMRoom) => {
    // Redirect to individual room page using slug
    window.location.href = `/machines/thm/${room.slug}`;
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newRoom: Omit<THMRoom, 'id'> = {
        title: roomForm.title,
        slug: roomForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        difficulty: roomForm.difficulty,
        status: roomForm.status,
        dateCompleted: roomForm.dateCompleted,
        tags: roomForm.tags,
        writeup: roomForm.writeup,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: `https://tryhackme.com/room/${roomForm.roomCode}`,
        roomCode: roomForm.roomCode,
        points: roomForm.points
      };

      if (selectedRoom) {
        // Update existing room
        await updateRoom(selectedRoom.id, newRoom);
      } else {
        // Add new room
        await handleAddRoom(newRoom);
      }

      // Reset form and close modal
      setRoomForm({
        title: '',
        difficulty: 'Easy',
        status: 'In Progress',
        roomCode: '',
        points: 0,
        dateCompleted: null,
        tags: [],
        writeup: ''
      });
      setTagInput('');
      setShowAddModal(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !roomForm.tags.includes(tagInput.trim())) {
      setRoomForm({
        ...roomForm,
        tags: [...roomForm.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Update room function
  const updateRoom = async (roomId: string, updatedRoom: Omit<THMRoom, 'id'>) => {
    const roomToUpdate = { ...updatedRoom, id: roomId, updatedAt: new Date().toISOString() };
    
    const response = await fetch(`/api/admin/thm-rooms-d1?id=${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(roomToUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update room');
    }

    // Update local state
    setRooms(prev => prev.map(r => r.id === roomId ? roomToUpdate : r));
    setError('✅ Room updated successfully!');
    setTimeout(() => setError(null), 3000);
  };

  const stats = {
    total: rooms.length,
    completed: rooms.filter(r => r.status === 'Completed').length,
    inProgress: rooms.filter(r => r.status === 'In Progress').length,
    easy: rooms.filter(r => r.difficulty === 'Easy').length,
    medium: rooms.filter(r => r.difficulty === 'Medium').length,
    hard: rooms.filter(r => r.difficulty === 'Hard').length,
  };

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-cyber-purple/20 p-3 rounded-lg">
              <FaGraduationCap className="text-2xl text-cyber-purple" />
            </div>
            <div>
              <h1 className="text-4xl font-cyber font-bold text-cyber-purple" data-text="TryHackMe Rooms">
                TryHackMe Rooms
              </h1>
              <p className="text-gray-400">Learning-focused cybersecurity challenges</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchRooms}
              disabled={loading}
              className="bg-cyber-purple text-white px-4 py-3 rounded-lg font-bold hover:bg-cyber-pink transition-colors flex items-center space-x-2 border-2 border-cyber-purple"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            {isAdminMode && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-cyber-purple text-white px-6 py-3 rounded-lg font-bold hover:bg-cyber-pink transition-colors flex items-center space-x-2 shadow-lg border-2 border-cyber-purple"
              >
                <FaPlus />
                <span>Add Room</span>
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Banner */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${error.includes('✅') ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 p-4 rounded-lg bg-cyber-purple/20 border border-cyber-purple/50 text-cyber-purple">
            <div className="flex items-center space-x-2">
              <FaSync className="animate-spin" />
              <span>Loading rooms from database...</span>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-cyber-purple">{stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.easy}</div>
            <div className="text-sm text-gray-400">Easy</div>
          </div>
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.medium}</div>
            <div className="text-sm text-gray-400">Medium</div>
          </div>
          <div className="rounded-lg backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.hard}</div>
            <div className="text-sm text-gray-400">Hard</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyber-purple" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-terminal-bg border border-cyber-purple/50 pl-10 pr-4 py-2 rounded text-cyber-purple focus:border-cyber-purple focus:outline-none"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-terminal-bg border border-cyber-purple/50 px-4 py-2 rounded text-cyber-purple focus:border-cyber-purple focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-terminal-bg border border-cyber-purple/50 px-4 py-2 rounded text-cyber-purple focus:border-cyber-purple focus:outline-none [&>option]:text-white [&>option]:bg-gray-800"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDifficulty('All');
                setFilterStatus('All');
              }}
              className="bg-cyber-purple text-white px-4 py-2 rounded font-bold hover:bg-cyber-pink transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <MachineCardBase
              key={room.id}
              machine={room}
              provider="thm"
              isAdminMode={isAdminMode}
              onViewWriteup={(machine) => handleViewWriteup(machine as THMRoom)}
              onEdit={(room) => {
                setSelectedRoom(room as THMRoom);
                setShowAddModal(true);
              }}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No rooms found matching your criteria.</p>
          </div>
        )}

        {/* Add THM Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyber-purple">
                  {selectedRoom ? 'Edit Room' : 'Add New Room'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedRoom(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Room Name</label>
                    <input
                      type="text"
                      value={roomForm.title}
                      onChange={(e) => setRoomForm({...roomForm, title: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                      placeholder="Enter room name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Difficulty</label>
                    <select
                      value={roomForm.difficulty}
                      onChange={(e) => setRoomForm({...roomForm, difficulty: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Status</label>
                    <select
                      value={roomForm.status}
                      onChange={(e) => setRoomForm({...roomForm, status: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Room Code</label>
                    <input
                      type="text"
                      value={roomForm.roomCode}
                      onChange={(e) => setRoomForm({...roomForm, roomCode: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                      placeholder="THM room code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Points</label>
                    <input
                      type="number"
                      value={roomForm.points}
                      onChange={(e) => setRoomForm({...roomForm, points: parseInt(e.target.value) || 0})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                      placeholder="Room points"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-cyber-purple">Date Completed</label>
                    <input
                      type="date"
                      value={roomForm.dateCompleted || ''}
                      onChange={(e) => setRoomForm({...roomForm, dateCompleted: e.target.value || null})}
                      className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-cyber-purple">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="flex-1 bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none"
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-cyber-purple text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roomForm.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-cyber-purple/20 text-cyber-purple px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setRoomForm({
                            ...roomForm,
                            tags: roomForm.tags.filter((_, i) => i !== index)
                          })}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-cyber-purple">Writeup</label>
                  <textarea
                    value={roomForm.writeup || ''}
                    onChange={(e) => setRoomForm({...roomForm, writeup: e.target.value})}
                    className="w-full bg-terminal-bg border border-cyber-purple/50 p-3 rounded text-white focus:border-cyber-purple focus:outline-none h-32"
                    placeholder="Writeup content (Markdown supported)"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedRoom(null);
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-cyber-purple text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : selectedRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TryHackMeRooms;
