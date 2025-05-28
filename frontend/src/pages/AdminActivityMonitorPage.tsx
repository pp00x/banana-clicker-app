import { useState, useEffect, useRef } from 'react'; // Added useRef
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../hooks/useNotification';
import { Activity, Users, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';

interface ActiveUser {
  _id: string; // Changed from id to _id
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bananaCount: number;
  lastActive: Date;
  isOnline: boolean;
}

interface ClickEvent {
  id: string;
  userId: string; // This will be _id from User
  username: string;
  bananaCount: number; // This could be the new total after clicks
  timestamp: Date;
}

const AdminActivityMonitorPage = () => {
  const [loading, setLoading] = useState(true); // Ensure loading state is defined
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickEvent[]>([]);
  const [totalOnlineUsers, setTotalOnlineUsers] = useState(0);
  // const [totalClicks, setTotalClicks] = useState(0); // Removed as it's no longer displayed
  const [clicksPerMinute, setClicksPerMinute] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'lastActive',
    direction: 'desc',
  });
  const [cpmEventBuffer, setCpmEventBuffer] = useState<{ timestamp: number; clicks: number }[]>([]);
  
  const { socket, isConnected } = useSocket();
  const { showNotification } = useNotification();

  useEffect(() => {
    setActiveUsers([]);
    setRecentClicks([]);
    setTotalOnlineUsers(0);
    // setTotalClicks(0); // Removed as totalClicks state is removed
    setClicksPerMinute(0);
    setLoading(true);

    let initialLoadTimer: ReturnType<typeof setTimeout> | null = null;

    if (socket && isConnected) {
      const handleUserStatusUpdate = (data: {
        userId: string;
        username: string;
        status: 'online' | 'offline';
        bananaCount: number;
      }) => {
        if (initialLoadTimer) clearTimeout(initialLoadTimer);
        setLoading(false);
        const now = new Date();

        let actualClicksThisUpdate = 0;
        setActiveUsers(prevUsers => {
          const existingUser = prevUsers.find(u => u._id === data.userId);
          const oldBananaCount = existingUser ? existingUser.bananaCount : 0;
          
          if (data.bananaCount > oldBananaCount) {
            actualClicksThisUpdate = data.bananaCount - oldBananaCount;
          }

          const existingUserIndex = prevUsers.findIndex(u => u._id === data.userId);
          let updatedUsers = [...prevUsers];

          if (existingUserIndex !== -1) {
            updatedUsers[existingUserIndex] = {
              ...updatedUsers[existingUserIndex],
              username: data.username,
              bananaCount: data.bananaCount,
              isOnline: data.status === 'online',
              lastActive: now
            };
          } else {
            updatedUsers.push({
              _id: data.userId,
              username: data.username,
              displayName: data.username,
              avatarUrl: undefined,
              bananaCount: data.bananaCount,
              isOnline: data.status === 'online',
              lastActive: now
            });
          }
          return updatedUsers.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
        });

        if (actualClicksThisUpdate > 0) {
          setCpmEventBuffer(prevBuffer => [
            { timestamp: now.getTime(), clicks: actualClicksThisUpdate },
            ...prevBuffer
          ]);
        }

        setRecentClicks(prevClicks => {
          const newActivity: ClickEvent = {
            id: `${data.userId}-${now.getTime()}`,
            userId: data.userId,
            username: data.username,
            bananaCount: data.bananaCount,
            timestamp: now,
          };
          return [newActivity, ...prevClicks.slice(0, 49)];
        });
      };

      socket.on('user_status_update', handleUserStatusUpdate);
      
      initialLoadTimer = setTimeout(() => {
        setLoading(false);
      }, 7000);

      return () => {
        if (initialLoadTimer) clearTimeout(initialLoadTimer);
        socket.off('user_status_update', handleUserStatusUpdate);
      };
    } else {
      setLoading(false);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    setTotalOnlineUsers(activeUsers.filter(user => user.isOnline).length);
    // const totalSystemBananas = activeUsers.reduce((sum, user) => sum + user.bananaCount, 0); // No longer setting totalClicks
    // setTotalClicks(totalSystemBananas); // Removed
    // ClicksPerMinute is calculated by its own effect
  }, [activeUsers]);

  // useEffect for calculating Clicks Per Minute
  const cpmEventBufferRef = useRef(cpmEventBuffer);
  useEffect(() => {
    cpmEventBufferRef.current = cpmEventBuffer;
  }, [cpmEventBuffer]);

  useEffect(() => {
    const calculateCPM = () => {
      const oneMinuteAgo = Date.now() - 60000; // 60 seconds
      const twoMinutesAgo = Date.now() - 120000; // 2 minutes for pruning buffer

      // Prune old events from buffer
      // Access current buffer via ref for accuracy within setInterval/setTimeout
      const currentBuffer = cpmEventBufferRef.current;
      const stillRelevantEventsForBuffer = currentBuffer.filter(event => event.timestamp >= twoMinutesAgo);
      
      // Only call setCpmEventBuffer if it actually changes to avoid potential loops
      if (stillRelevantEventsForBuffer.length < currentBuffer.length) {
        setCpmEventBuffer(stillRelevantEventsForBuffer);
      }
      
      const clicksInLastMinute = stillRelevantEventsForBuffer
        .filter(event => event.timestamp >= oneMinuteAgo)
        .reduce((sum, event) => sum + event.clicks, 0);
      
      setClicksPerMinute(clicksInLastMinute);
    };

    const intervalId = setInterval(calculateCPM, 5000); // Calculate every 5 seconds
    calculateCPM(); // Initial calculation

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array: set up interval once


  const refreshData = () => {
    showNotification({
      title: 'Real-time Data',
      message: 'Activity data is updated in real-time via sockets. No manual refresh needed.',
      type: 'info',
    });
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedActiveUsers = () => {
    const sortableUsers = [...activeUsers];
    if (sortConfig.key) {
      sortableUsers.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  };

  const sortedActiveUsers = getSortedActiveUsers();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
      return `${diffSec}s ago`;
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="pb-12 space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Online Users</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold">{totalOnlineUsers}</p>
            {/* Removed fake percentage text */}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 font-medium">Clicks per Minute</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold">{clicksPerMinute}</p>
            {/* Removed fake percentage text */}
          </div>
        </motion.div>
        
        {/* "Total Clicks Today" card is removed as per user request */}
        
      </div>
      
      {/* Active Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Active Users</h2>
            <p className="text-gray-500">Users currently online and their activity</p>
          </div>
          
          <Button 
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={refreshData}
          >
            Refresh Data
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th 
                  className="px-6 py-3 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('username')}
                >
                  <div className="flex items-center">
                    User
                    {sortConfig.key === 'username' && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('bananaCount')}
                >
                  <div className="flex items-center">
                    Bananas
                    {sortConfig.key === 'bananaCount' && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('lastActive')}
                >
                  <div className="flex items-center">
                    Last Active
                    {sortConfig.key === 'lastActive' && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && sortedActiveUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-3 text-gray-500">Loading active users...</p>
                    </div>
                  </td>
                </tr>
              ) : !loading && sortedActiveUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No active users to display.
                  </td>
                </tr>
              ) : (
                sortedActiveUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-secondary-light/20 flex items-center justify-center mr-3 relative">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl}
                            alt={user.displayName || user.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-secondary">
                            {user.displayName?.charAt(0) || user.username.charAt(0)}
                          </span>
                        )}
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName || user.username}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{user.bananaCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{formatTimestamp(user.lastActive)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isOnline 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              )) ) }
            </tbody>
          </table>
        </div>
      </motion.div>
      
      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <p className="text-gray-500">Live feed of banana clicks</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-4">
            {loading && recentClicks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-3 text-gray-500">Loading recent activity...</p>
                </div>
              </div>
            ) : !loading && recentClicks.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No recent activity to display.
              </div>
            ) : (
              recentClicks.slice(0, 15).map((click) => (
                <div key={click.id} className="flex items-start border-b border-gray-100 pb-4 last:pb-0 last:border-b-0">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-yellow-600">🍌</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    <span className="text-secondary">{click.username}</span> clicked a banana
                  </p>
                  <p className="text-sm text-gray-500">
                    New total: {click.bananaCount.toLocaleString()} bananas
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(click.timestamp)}
                  </p>
                </div>
              </div>
            )) ) }
          </div>
        </div>
      </motion.div>
      
      {/* Connection status */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
        <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Real-time monitoring active' : 'Monitoring paused'}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityMonitorPage;