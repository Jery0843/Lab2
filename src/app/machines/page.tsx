'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FaServer, FaChartLine, FaTrophy, FaCode, FaEdit, FaSave, FaTimes, FaCog } from 'react-icons/fa';

// Note: Metadata export moved to layout.tsx for client components

interface HTBStats {
  rank: number;
  points: number;
  owns_user: number;
  owns_root: number;
  owns_total: number;
  respect: number;
  university_rank: number | null;
}

interface THMStats {
  rank: number;
  points: number;
  rooms_completed: number;
  streak: number;
  badges: string[];
  learning_paths_completed: number;
}

export default function MachinesPage() {
  const [htbStats, setHtbStats] = useState<HTBStats>({
    rank: 15234,
    points: 1337,
    owns_user: 42,
    owns_root: 38,
    owns_total: 80,
    respect: 15,
    university_rank: null
  });

  const [thmStats, setThmStats] = useState<THMStats>({
    rank: 8456,
    points: 2895,
    rooms_completed: 67,
    streak: 12,
    badges: ['Top 1%', 'Pwned', 'OSCP Prep'],
    learning_paths_completed: 3
  });

  const [adminMode, setAdminMode] = useState(false);
  const [editingHTB, setEditingHTB] = useState(false);
  const [editingTHM, setEditingTHM] = useState(false);
  const [editHTBValues, setEditHTBValues] = useState<HTBStats>(htbStats);
  const [editTHMValues, setEditTHMValues] = useState<THMStats>(thmStats);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Check admin mode
    const checkAdminMode = () => {
      fetch('/api/admin/auth')
        .then(res => res.json())
        .then(data => setAdminMode(data.authenticated))
        .catch(() => setAdminMode(false));
    };
    
    checkAdminMode();
    
    // Listen for admin mode changes
    window.addEventListener('adminModeChanged', checkAdminMode);
    return () => window.removeEventListener('adminModeChanged', checkAdminMode);
  }, []);

  useEffect(() => {
    // Fetch HTB stats
    const fetchHTBStats = async () => {
      try {
        const response = await fetch('/api/admin/htb-stats-d1');
        if (response.ok) {
          const data = await response.json();
          const stats = {
            rank: data.globalRanking || 15234,
            points: data.finalScore || 1337,
            owns_user: data.machinesPwned || 42,
            owns_root: data.machinesPwned || 42, // Same as user owns
            owns_total: data.machinesPwned || 80,
            respect: 15,
            university_rank: null
          };
          setHtbStats(stats);
          setEditHTBValues(stats);
        }
      } catch (error) {
        console.error('Error fetching HTB stats:', error);
        // Set fallback data on error
        const fallbackStats = {
          rank: 15234,
          points: 1337,
          owns_user: 42,
          owns_root: 38,
          owns_total: 80,
          respect: 15,
          university_rank: null
        };
        setHtbStats(fallbackStats);
        setEditHTBValues(fallbackStats);
      }
    };

    // Fetch THM stats
    const fetchTHMStats = async () => {
      try {
        const response = await fetch('/api/admin/thm-stats-d1');
        if (response.ok) {
          const data = await response.json();
          const stats = {
            rank: data.global_ranking || 8456,
            points: data.total_points || 2895,
            rooms_completed: data.rooms_completed || 67,
            streak: data.streak || 12,
            badges: data.badges || ['Top 1%', 'Pwned', 'OSCP Prep'],
            learning_paths_completed: 3
          };
          setThmStats(stats);
          setEditTHMValues(stats);
        }
      } catch (error) {
        console.error('Error fetching THM stats:', error);
        // Set fallback data on error
        const fallbackStats = {
          rank: 8456,
          points: 2895,
          rooms_completed: 67,
          streak: 12,
          badges: ['Top 1%', 'Pwned', 'OSCP Prep'],
          learning_paths_completed: 3
        };
        setThmStats(fallbackStats);
        setEditTHMValues(fallbackStats);
      }
    };

    fetchHTBStats();
    fetchTHMStats();
  }, []);

  const handleEditHTB = () => {
    setEditingHTB(true);
    setEditHTBValues(htbStats);
  };

  const handleEditTHM = () => {
    setEditingTHM(true);
    setEditTHMValues(thmStats);
  };

  const handleSaveHTB = async () => {
    try {
      // Root owns should be same as user owns (machines pwned)
      const updatedStats = {
        ...editHTBValues,
        owns_root: editHTBValues.owns_user, // Same as user owns
        last_updated: new Date().toISOString()
      };

      const response = await fetch('/api/admin/htb-stats-d1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          globalRanking: editHTBValues.rank,
          finalScore: editHTBValues.points,
          machinesPwned: editHTBValues.owns_user,
          last_updated: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setHtbStats(updatedStats);
        setSaveMessage('✅ HTB stats saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Error saving HTB stats');
      }
    } catch (error) {
      console.error('Error saving HTB stats:', error);
      setSaveMessage('❌ Error saving HTB stats');
    }
    setEditingHTB(false);
  };

  const handleSaveTHM = async () => {
    try {
      const response = await fetch('/api/admin/thm-stats-d1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          global_ranking: editTHMValues.rank,
          total_points: editTHMValues.points,
          rooms_completed: editTHMValues.rooms_completed,
          streak: editTHMValues.streak,
          badges: editTHMValues.badges.length,
          last_updated: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setThmStats(editTHMValues);
        setSaveMessage('✅ THM stats saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Error saving THM stats');
      }
    } catch (error) {
      console.error('Error saving THM stats:', error);
      setSaveMessage('❌ Error saving THM stats');
    }
    setEditingTHM(false);
  };

  const handleCancelHTB = () => {
    setEditingHTB(false);
    setEditHTBValues(htbStats);
  };

  const handleCancelTHM = () => {
    setEditingTHM(false);
    setEditTHMValues(thmStats);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Admin Mode Indicator */}
        {adminMode && (
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center space-x-2 bg-cyber-green/10 border border-cyber-green/30 px-3 sm:px-4 py-2 rounded-lg">
              <FaCog className="text-cyber-green animate-spin text-sm sm:text-base" />
              <span className="text-cyber-green text-xs sm:text-sm font-bold">Admin Mode Active - Click containers to edit stats</span>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-block px-3 sm:px-4 py-2 rounded-lg bg-green-500/20 border border-green-500 text-green-400 text-sm">
              {saveMessage}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 px-2 sm:px-4">
          <div className="relative z-10 max-w-4xl mx-auto rounded-2xl backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-5 sm:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cyber font-bold mb-3 sm:mb-4">
              <span
                className="block"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #00ff41, #ff0080, #ffb300)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  animation: 'gradientShift 6s ease-in-out infinite',
                }}
                data-text="MACHINE LABS"
              >
                MACHINE LABS
              </span>
            </h1>
            <div className="flex justify-center">
              <p className="text-base sm:text-lg lg:text-xl text-center text-foreground max-w-3xl mx-auto leading-relaxed">
                Cybersecurity training platforms with hands-on machine exploitation and detailed writeups.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Hack The Box Card */}
          <div className="relative group">
            {adminMode && (
              <button
                onClick={editingHTB ? handleCancelHTB : handleEditHTB}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-2 bg-cyber-green/20 border border-cyber-green rounded-lg text-cyber-green hover:bg-cyber-green hover:text-black transition-all duration-300 text-sm sm:text-base"
                title={editingHTB ? "Cancel Edit" : "Edit HTB Stats"}
              >
                {editingHTB ? <FaTimes /> : <FaEdit />}
              </button>
            )}
            
            {editingHTB ? (
              // HTB Edit Mode
              <div className="glass-panel rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-cyber-green/20 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <FaServer className="text-2xl sm:text-2xl lg:text-3xl text-cyber-green" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-cyber-green mb-1">Edit HTB Stats</h2>
                    <p className="text-gray-400 text-sm sm:text-base">Update all Hack The Box statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Global Rank</label>
                    <input
                      type="number"
                      value={editHTBValues.rank}
                      onChange={(e) => setEditHTBValues({...editHTBValues, rank: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-cyber-green/30 rounded px-3 py-2 text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Final Score</label>
                    <input
                      type="number"
                      value={editHTBValues.points}
                      onChange={(e) => setEditHTBValues({...editHTBValues, points: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-cyber-green/30 rounded px-3 py-2 text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Machines Pwned</label>
                    <input
                      type="number"
                      value={editHTBValues.owns_user}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setEditHTBValues({
                          ...editHTBValues, 
                          owns_user: newValue,
                          owns_root: newValue // Update root owns to match
                        });
                      }}
                      className="w-full bg-gray-800 border border-cyber-green/30 rounded px-3 py-2 text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Root Owns</label>
                    <input
                      type="number"
                      value={editHTBValues.owns_root}
                      readOnly
                      className="w-full bg-gray-700 border border-cyber-green/30 rounded px-3 py-2 text-cyber-green cursor-not-allowed opacity-75 text-sm sm:text-base"
                      title="Root Owns automatically matches Machines Pwned"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleSaveHTB}
                    className="flex-1 bg-cyber-green text-black px-4 sm:px-6 py-3 rounded-lg font-bold hover:bg-cyber-green/80 transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
                  >
                    <FaSave className="mr-2" />
                    Save HTB Stats
                  </button>
                  <button
                    onClick={handleCancelHTB}
                    className="flex-1 bg-transparent border border-cyber-green text-cyber-green px-4 sm:px-6 py-3 rounded-lg font-bold hover:bg-cyber-green hover:text-black transition-all duration-300 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // HTB Display Mode
              <Link href="/machines/htb" className="block group">
                <div className="glass-panel rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-300">
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-cyber-green/20 rounded-lg flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-cyber-green/30">
                      <FaServer className="text-2xl sm:text-2xl lg:text-3xl text-cyber-green group-hover:animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-cyber-green dark:text-cyber-green light:text-green-600 mb-1">Hack The Box</h2>
                      <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base">Realistic penetration testing labs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaChartLine className="text-cyber-green dark:text-cyber-green light:text-green-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Global Rank</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-cyber-green dark:text-cyber-green light:text-green-600">#{htbStats.rank?.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaTrophy className="text-cyber-green dark:text-cyber-green light:text-green-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Final Score</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-cyber-green dark:text-cyber-green light:text-green-600">{htbStats.points?.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaCode className="text-cyber-green dark:text-cyber-green light:text-green-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">User Owns</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-cyber-green dark:text-cyber-green light:text-green-600">{htbStats.owns_user}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaServer className="text-cyber-green dark:text-cyber-green light:text-green-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Root Owns</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-cyber-green dark:text-cyber-green light:text-green-600">{htbStats.owns_root}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-cyber-green border border-white/5 backdrop-blur-sm bg-black/10 light:bg-white/20 group-hover:bg-cyber-green group-hover:text-black transition-all duration-300 text-sm sm:text-base">
                      Explore HTB Machines →
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* TryHackMe Card */}
          <div className="relative group">
            {adminMode && (
              <button
                onClick={editingTHM ? handleCancelTHM : handleEditTHM}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-2 bg-purple-500/20 border border-purple-500 rounded-lg text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-300 text-sm sm:text-base"
                title={editingTHM ? "Cancel Edit" : "Edit THM Stats"}
              >
                {editingTHM ? <FaTimes /> : <FaEdit />}
              </button>
            )}
            
            {editingTHM ? (
              // THM Edit Mode
              <div className="glass-panel rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <FaServer className="text-2xl sm:text-2xl lg:text-3xl text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-500 mb-1">Edit THM Stats</h2>
                    <p className="text-gray-400 text-sm sm:text-base">Update all TryHackMe statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Global Rank</label>
                    <input
                      type="number"
                      value={editTHMValues.rank}
                      onChange={(e) => setEditTHMValues({...editTHMValues, rank: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-purple-500 focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Badges</label>
                    <input
                      type="number"
                      value={editTHMValues.points}
                      onChange={(e) => setEditTHMValues({...editTHMValues, points: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-purple-500 focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Rooms Completed</label>
                    <input
                      type="number"
                      value={editTHMValues.rooms_completed}
                      onChange={(e) => setEditTHMValues({...editTHMValues, rooms_completed: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-purple-500 focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-terminal-bg/50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Streak (days)</label>
                    <input
                      type="number"
                      value={editTHMValues.streak}
                      onChange={(e) => setEditTHMValues({...editTHMValues, streak: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-800 border border-purple-500/30 rounded px-3 py-2 text-purple-500 focus:border-purple-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleSaveTHM}
                    className="flex-1 bg-purple-500 text-white px-4 sm:px-6 py-3 rounded-lg font-bold hover:bg-purple-600 transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
                  >
                    <FaSave className="mr-2" />
                    Save THM Stats
                  </button>
                  <button
                    onClick={handleCancelTHM}
                    className="flex-1 bg-transparent border border-purple-500 text-purple-500 px-4 sm:px-6 py-3 rounded-lg font-bold hover:bg-purple-500 hover:text-white transition-all duration-300 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // THM Display Mode
              <Link href="/machines/thm" className="block group">
                <div className="glass-panel rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-300">
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-purple-500/30">
                      <FaServer className="text-2xl sm:text-2xl lg:text-3xl text-purple-500 group-hover:animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600 mb-1">TryHackMe</h2>
                      <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base">Guided cybersecurity learning</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaChartLine className="text-purple-500 dark:text-purple-400 light:text-purple-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Global Rank</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600">#{thmStats.rank?.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaTrophy className="text-purple-500 dark:text-purple-400 light:text-purple-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Badges</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600">{thmStats.points?.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaCode className="text-purple-500 dark:text-purple-400 light:text-purple-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Rooms</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600">{thmStats.rooms_completed}</p>
                    </div>
                    <div className="rounded-lg backdrop-blur-sm bg-black/10 light:bg-white/20 border border-white/5 p-3 sm:p-4">
                      <div className="flex items-center mb-2">
                        <FaServer className="text-purple-500 dark:text-purple-400 light:text-purple-600 mr-2 text-sm sm:text-base" />
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Streak</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600">{thmStats.streak} days</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-purple-500 border border-white/5 backdrop-blur-sm bg-black/10 light:bg-white/20 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 text-sm sm:text-base">
                      Explore THM Rooms →
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
