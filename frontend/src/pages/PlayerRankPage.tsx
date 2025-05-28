import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { Crown, Trophy, Search } from 'lucide-react'; // Removed Medal
import Input from '../components/common/Input';
import { User } from '../contexts/AuthContext';

interface RankUser extends User {
  rank: number;
}

const PlayerRankPage = () => {
  const [rankList, setRankList] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (socket && isConnected) {
      const handleRankUpdate = (updatedUserListFromServer: User[]) => {
        if (timerId) clearTimeout(timerId); // Clear timeout if data is received
        const rankedUsers: RankUser[] = updatedUserListFromServer.map((serverUser, index) => ({
          ...serverUser,
          rank: index + 1,
        }));
        setRankList(rankedUsers);
        setLoading(false);
      };
      
      socket.on('rank_update', handleRankUpdate);
      socket.emit('request_initial_ranks'); // Request initial ranks when socket is ready
      
      // Set a timeout to stop loading if no data comes through after a while
      // This helps if the initial state is empty and relies on an event.
      timerId = setTimeout(() => {
        if (rankList.length === 0) { // Check if rankList is still empty
            setLoading(false);
            // console.log("RankPage: No rank data received via socket after timeout.");
        }
      }, 7000); // 7 second timeout for initial load, adjust as needed

      return () => {
        socket.off('rank_update', handleRankUpdate);
        if (timerId) clearTimeout(timerId);
      };
    } else {
      // If no socket or not connected, don't keep loading indefinitely
      setLoading(false);
      setRankList([]); // Clear any stale ranks
    }
  }, [socket, isConnected]); // Removed 'user' and 'rankList' from deps to avoid re-running unnecessarily

  // Filter users based on search term
  const filteredUsers = rankList.filter((user) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCurrentUserRank = () => {
    if (!user) return null;
    return rankList.find((u) => u._id === user._id); // Use _id for comparison
  };

  const currentUserRank = getCurrentUserRank();

  // Function to get medal or rank number
  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-yellow-400" />;
    } else if (rank === 2) {
      return <Crown className="w-6 h-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Crown className="w-6 h-6 text-amber-700" />;
    } else {
      return <span className="text-lg font-bold">{rank}</span>;
    }
  };

  // Function to get background style for rank rows
  const getRowStyle = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-yellow-100 border-l-4 border-yellow-500';
    } else if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-100 to-transparent';
    } else if (rank === 2) {
      return 'bg-gradient-to-r from-gray-100 to-transparent';
    } else if (rank === 3) {
      return 'bg-gradient-to-r from-amber-100 to-transparent';
    }
    return '';
  };

  return (
    <div className="pb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center">
            <Trophy className="mr-2" /> Banana Rankings
          </h1>
          <p className="opacity-90">Who has the most bananas?</p>
        </div>
        
        {/* Current User Stats */}
        <div className="p-6 bg-yellow-50 border-b border-yellow-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-16 w-16 rounded-full bg-yellow-200 flex items-center justify-center text-2xl mr-4">
                {currentUserRank?.avatarUrl ? (
                  <img
                    src={currentUserRank.avatarUrl}
                    alt={currentUserRank.displayName || currentUserRank.username}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  '🍌'
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">Your Ranking</h2>
                <p className="text-gray-600">{currentUserRank?.displayName || user?.displayName || 'Unknown Player'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-sm text-gray-500">Rank</p>
                <p className="text-3xl font-bold text-yellow-700">
                  #{currentUserRank?.rank || '?'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">Bananas</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {currentUserRank?.bananaCount || user?.bananaCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        
        {/* Leaderboard */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Rank</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Player</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500 text-right">Bananas</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500">Loading rankings...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No players found matching "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice(0, 20).map((rankUser) => { // Display top 20 of filtered, or implement pagination
                    const isCurrentUser = user ? rankUser._id === user._id : false; // Use _id
                    
                    return (
                      <motion.tr
                        key={rankUser._id} // Use _id for key
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${getRowStyle(rankUser.rank, isCurrentUser)}`}
                      >
                        <td className="px-6 py-4 w-16">
                          <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-100">
                            {getRankDisplay(rankUser.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                              {rankUser.avatarUrl ? (
                                <img 
                                  src={rankUser.avatarUrl}
                                  alt={rankUser.displayName || rankUser.username}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                '🍌'
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{rankUser.displayName}</p>
                              <p className="text-sm text-gray-500">@{rankUser.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-lg">{rankUser.bananaCount.toLocaleString()}</span>
                          <span className="text-yellow-500 ml-1">🍌</span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Real-time indicator */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {Math.min(filteredUsers.length, 20)} of {filteredUsers.length} players
          </div>
          <div className={`flex items-center space-x-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Real-time updates active' : 'Updates paused'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRankPage;