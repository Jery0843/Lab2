'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import WriteupModal from '@/components/WriteupModal';
import { FaExternalLinkAlt, FaCalendar, FaTag, FaGraduationCap, FaTrophy, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface THMRoom {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  tags: string[] | string; // Can be either array or string from database
  writeup: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  roomCode: string;
  points: number;
  dateCompleted: string | null;
}

interface THMRoomPageProps {
  room: THMRoom;
}

const THMRoomPage = ({ room }: THMRoomPageProps) => {
  const [showWriteupModal, setShowWriteupModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState(room.status);
  const [isEditingRoomCode, setIsEditingRoomCode] = useState(false);
  const [editRoomCode, setEditRoomCode] = useState(room.roomCode || '');
  
  // Handle both dateCompleted (camelCase) and date_completed (snake_case) from database
  const dateCompleted = room.dateCompleted || (room as any).date_completed || '';
  const [editDateCompleted, setEditDateCompleted] = useState(dateCompleted);

  // Debug logging
  console.log('THM Room Data:', {
    title: room.title,
    status: room.status,
    dateCompleted: room.dateCompleted,
    date_completed: (room as any).date_completed,
    finalDateCompleted: dateCompleted
  });

  // Check for admin session
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
  }, []);

  const getDifficultyColor = () => {
    switch (room.difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400 border-green-400 bg-green-400/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'hard':
        return 'text-red-400 border-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = () => {
    switch (room.status.toLowerCase()) {
      case 'completed':
        return 'text-green-400 border-green-400 bg-green-400/10';
      case 'in progress':
        return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await fetch('/api/admin/thm-rooms-d1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...room,
          status: editStatus,
          dateCompleted: editStatus === 'Completed' ? (editDateCompleted || new Date().toISOString().split('T')[0]) : null,
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        console.error('Failed to update room status');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
    setIsEditingStatus(false);
  };

  const handleRoomCodeUpdate = async () => {
    try {
      const response = await fetch('/api/admin/thm-rooms-d1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...room,
          roomCode: editRoomCode,
          room_code: editRoomCode, // Include both formats for compatibility
        }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        console.error('Failed to update room code');
      }
    } catch (error) {
      console.error('Error updating room code:', error);
    }
    setIsEditingRoomCode(false);
  };

  return (
    <Layout>
      <div className="py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-400">
            <Link href="/machines" className="hover:text-cyber-purple transition-colors">
              Machines
            </Link>
            <span>›</span>
            <Link href="/machines/thm" className="hover:text-cyber-purple transition-colors">
              TryHackMe
            </Link>
            <span>›</span>
            <span className="text-cyber-purple">{room.title}</span>
          </nav>
        </div>

        {/* Header */}
        <div className="rounded-2xl backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-cyber-purple/20 p-4 rounded-lg">
                <FaGraduationCap className="text-3xl text-cyber-purple" />
              </div>
              <div>
                <h1 className="text-4xl font-cyber font-bold text-cyber-purple mb-2">
                  {room.title}
                </h1>
                <p className="text-gray-400">TryHackMe Room • {room.points} points</p>
              </div>
            </div>
          </div>

          {/* Room Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Difficulty */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full border font-bold ${getDifficultyColor()}`}>
                {room.difficulty}
              </div>
              <p className="text-sm text-gray-400 mt-2">Difficulty</p>
            </div>

            {/* Status */}
            <div className="text-center">
              {isEditingStatus && isAdminMode ? (
                <div className="space-y-2">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="bg-terminal-bg border border-cyber-purple text-cyber-purple rounded px-3 py-1"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  {editStatus === 'Completed' && (
                    <input
                      type="date"
                      value={editDateCompleted}
                      onChange={(e) => setEditDateCompleted(e.target.value)}
                      className="bg-terminal-bg border border-cyber-purple text-cyber-purple rounded px-3 py-1 block w-full"
                    />
                  )}
                  <div className="flex space-x-2 justify-center">
                    <button onClick={handleStatusUpdate} className="text-green-400 hover:text-green-300">
                      <FaSave />
                    </button>
                    <button onClick={() => setIsEditingStatus(false)} className="text-red-400 hover:text-red-300">
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`inline-flex items-center px-4 py-2 rounded-full border font-bold ${getStatusColor()} ${isAdminMode ? 'cursor-pointer' : ''}`}
                  onClick={() => isAdminMode && setIsEditingStatus(true)}
                >
                  {room.status}
                  {isAdminMode && <FaEdit className="ml-2 text-xs" />}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-2">Status</p>
            </div>

            {/* Points */}
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple font-bold">
                <FaTrophy className="mr-2" />
                {room.points}
              </div>
              <p className="text-sm text-gray-400 mt-2">Points</p>
            </div>

            {/* Completion Date */}
            <div className="text-center">
              {room.status === 'Completed' ? (
                <div className="inline-flex items-center px-4 py-2 rounded-full border border-green-400/30 bg-green-400/10 text-green-400 font-bold">
                  <FaCalendar className="mr-2" />
                  {dateCompleted ? new Date(dateCompleted).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  }) : 'Date not set'}
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 rounded-full border border-gray-400/30 bg-gray-400/10 text-gray-400 font-bold">
                  <FaCalendar className="mr-2" />
                  Not completed
                </div>
              )}
              <p className="text-sm text-gray-400 mt-2">Completed</p>
            </div>
          </div>

          {/* Room Code Section */}
          {isAdminMode && (
            <div className="mt-6 p-4 bg-terminal-bg/50 border border-cyber-purple/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-cyber-purple">Room Code:</span>
                  {isEditingRoomCode ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="text"
                        value={editRoomCode}
                        onChange={(e) => setEditRoomCode(e.target.value)}
                        className="bg-terminal-bg border border-cyber-purple text-cyber-purple rounded px-3 py-1"
                        placeholder="Enter room code"
                      />
                      <button onClick={handleRoomCodeUpdate} className="text-green-400 hover:text-green-300">
                        <FaSave />
                      </button>
                      <button onClick={() => setIsEditingRoomCode(false)} className="text-red-400 hover:text-red-300">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-300 font-mono">{room.roomCode || 'Not set'}</span>
                      <button 
                        onClick={() => setIsEditingRoomCode(true)}
                        className="text-cyber-purple hover:text-cyber-pink text-sm"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  Used in URL: https://tryhackme.com/room/{room.roomCode || editRoomCode || 'room-code'}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {room.tags && (
            <div className="mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <FaTag className="text-cyber-purple" />
                <span className="font-semibold text-cyber-purple">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Handle different tag formats - can be string[] or string from database
                  if (Array.isArray(room.tags)) {
                    return room.tags;
                  } else if (typeof room.tags === 'string') {
                    return room.tags.includes(',') ? room.tags.split(',').map((t: string) => t.trim()) : [room.tags];
                  } else {
                    return [];
                  }
                })().map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cyber-purple/10 text-cyber-purple text-sm rounded-full border border-cyber-purple/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Writeup Section */}
        <div className="rounded-2xl backdrop-blur-sm bg-black/20 light:bg-white/30 border border-white/10 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyber-purple">Writeup</h2>
            {room.writeup && (
              <button
                onClick={() => setShowWriteupModal(true)}
                className="bg-cyber-purple text-white px-4 py-2 rounded-lg font-bold hover:bg-cyber-pink transition-colors"
              >
                Full Screen View
              </button>
            )}
          </div>

          {room.writeup ? (
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              <ReactMarkdown 
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold text-cyber-purple mb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold text-cyber-purple mb-3 mt-6">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-bold text-cyber-purple mb-2 mt-4">{children}</h3>,
                  code: ({children}) => <code className="bg-terminal-bg text-cyber-green px-2 py-1 rounded text-sm font-mono">{children}</code>,
                  pre: ({children}) => <pre className="bg-terminal-bg border border-cyber-purple/30 rounded-lg p-4 overflow-x-auto">{children}</pre>,
                  blockquote: ({children}) => <blockquote className="border-l-4 border-cyber-purple pl-4 italic text-gray-400">{children}</blockquote>,
                  a: ({href, children}) => <a href={href} className="text-cyber-purple hover:text-cyber-pink underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
              >
                {room.writeup}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No writeup available yet.</p>
              <p className="text-sm text-gray-500">
                This room hasn&apos;t been completed or the writeup hasn&apos;t been published yet.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href="/machines/thm"
            className="bg-cyber-purple text-white px-6 py-3 rounded-lg font-bold hover:bg-cyber-pink transition-colors"
          >
            ← Back to THM Rooms
          </Link>
        </div>
      </div>

      {/* Writeup Modal */}
      {showWriteupModal && room.writeup && (
        <WriteupModal
          machine={{
            id: room.id,
            name: room.title,
            os: 'Linux',
            difficulty: room.difficulty,
            status: room.status,
            dateCompleted: room.dateCompleted,
            tags: Array.isArray(room.tags) ? room.tags : [],
            writeup: room.writeup
          }}
          onClose={() => setShowWriteupModal(false)}
        />
      )}
    </Layout>
  );
};

export default THMRoomPage;
